import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Configuration constants
const BATCH_SIZE = 50; // Process in smaller batches to avoid timeouts
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

interface ProcessingResult {
  processed: number;
  created: number;
  updated: number;
  errors: Array<{ row: number; error: string }>;
}

// Utility function to delay execution
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Validate row data
function validateEventRow(row: any[], rowIndex: number): { isValid: boolean; error?: string } {
  if (!row[0] || row[0].trim() === '') {
    return { isValid: false, error: 'Title is required' };
  }
  
  if (!row[2]) {
    return { isValid: false, error: 'Date is required' };
  }
  
  // Validate date format (basic check)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(row[2])) {
    return { isValid: false, error: 'Invalid date format. Expected YYYY-MM-DD' };
  }
  
  if (!row[3]) {
    return { isValid: false, error: 'Start time is required' };
  }
  
  // Validate time format (basic check)
  const timeRegex = /^\d{2}:\d{2}$/;
  if (!timeRegex.test(row[3])) {
    return { isValid: false, error: 'Invalid start time format. Expected HH:MM' };
  }
  
  if (row[4] && !timeRegex.test(row[4])) {
    return { isValid: false, error: 'Invalid end time format. Expected HH:MM' };
  }
  
  return { isValid: true };
}

function validateTaskRow(row: any[], rowIndex: number): { isValid: boolean; error?: string } {
  if (!row[0] || row[0].trim() === '') {
    return { isValid: false, error: 'Title is required' };
  }
  
  if (!row[2]) {
    return { isValid: false, error: 'Date is required' };
  }
  
  // Validate date format (basic check)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(row[2])) {
    return { isValid: false, error: 'Invalid date format. Expected YYYY-MM-DD' };
  }
  
  // Validate time formats if provided
  const timeRegex = /^\d{2}:\d{2}$/;
  if (row[3] && !timeRegex.test(row[3])) {
    return { isValid: false, error: 'Invalid start time format. Expected HH:MM' };
  }
  
  if (row[4] && !timeRegex.test(row[4])) {
    return { isValid: false, error: 'Invalid end time format. Expected HH:MM' };
  }
  
  // Validate priority if provided
  if (row[6] && !['low', 'medium', 'high'].includes(row[6].toLowerCase())) {
    return { isValid: false, error: 'Invalid priority. Must be low, medium, or high' };
  }
  
  return { isValid: true };
}

// Process events in batches
async function processEventsBatch(
  supabase: any,
  eventRows: any[][],
  spreadsheetId: string,
  startIndex: number,
  batchSize: number
): Promise<ProcessingResult> {
  const result: ProcessingResult = {
    processed: 0,
    created: 0,
    updated: 0,
    errors: []
  };

  const endIndex = Math.min(startIndex + batchSize, eventRows.length);
  console.log(`Processing events batch: ${startIndex + 1} to ${endIndex}`);

  for (let i = startIndex; i < endIndex; i++) {
    const row = eventRows[i];
    const actualRowIndex = i + 2; // +2 because we skip header and arrays are 0-indexed
    
    try {
      // Validate row data
      const validation = validateEventRow(row, actualRowIndex);
      if (!validation.isValid) {
        result.errors.push({
          row: actualRowIndex,
          error: validation.error || 'Validation failed'
        });
        console.warn(`Skipping event row ${actualRowIndex}: ${validation.error}`);
        continue;
      }

      if (row.length >= 4) { // Ensure minimum required columns
        const eventData = {
          title: row[0].trim(),
          description: row[1] ? row[1].trim() : null,
          date: row[2],
          start_time: row[3],
          end_time: row[4] || row[3], // Use start_time if end_time is missing
          is_online: row[5] === 'TRUE' || row[5] === 'true' || row[5] === true,
          location: row[6] ? row[6].trim() : null,
          meeting_link: row[7] ? row[7].trim() : null,
          notes: row[8] ? row[8].trim() : null,
          sheet_id: spreadsheetId,
          sheet_row_index: actualRowIndex,
          user_id: null // Public events don't have a specific user
        };

        console.log(`Processing event ${actualRowIndex}:`, eventData.title);

        // Check if event already exists
        const { data: existingEvent } = await supabase
          .from('public_events')
          .select('id')
          .eq('sheet_id', spreadsheetId)
          .eq('sheet_row_index', actualRowIndex)
          .single();

        let retries = 0;
        let success = false;

        while (retries < MAX_RETRIES && !success) {
          try {
            if (existingEvent) {
              // Update existing event
              const { error: updateError } = await supabase
                .from('public_events')
                .update(eventData)
                .eq('id', existingEvent.id);

              if (updateError) {
                throw updateError;
              } else {
                result.updated++;
                success = true;
                console.log(`Updated existing event ${actualRowIndex}`);
              }
            } else {
              // Insert new event
              const { error: insertError } = await supabase
                .from('public_events')
                .insert(eventData);

              if (insertError) {
                throw insertError;
              } else {
                result.created++;
                success = true;
                console.log(`Created new event ${actualRowIndex}`);
              }
            }
          } catch (error) {
            retries++;
            if (retries < MAX_RETRIES) {
              console.warn(`Retry ${retries} for event ${actualRowIndex}:`, error.message);
              await delay(RETRY_DELAY * retries); // Exponential backoff
            } else {
              result.errors.push({
                row: actualRowIndex,
                error: error.message
              });
              console.error(`Failed to process event ${actualRowIndex} after ${MAX_RETRIES} retries:`, error);
            }
          }
        }

        result.processed++;
      }
    } catch (error) {
      result.errors.push({
        row: actualRowIndex,
        error: error.message
      });
      console.error(`Error processing event row ${actualRowIndex}:`, error);
    }
  }

  return result;
}

// Process tasks in batches
async function processTasksBatch(
  supabase: any,
  taskRows: any[][],
  spreadsheetId: string,
  startIndex: number,
  batchSize: number
): Promise<ProcessingResult> {
  const result: ProcessingResult = {
    processed: 0,
    created: 0,
    updated: 0,
    errors: []
  };

  const endIndex = Math.min(startIndex + batchSize, taskRows.length);
  console.log(`Processing tasks batch: ${startIndex + 1} to ${endIndex}`);

  for (let i = startIndex; i < endIndex; i++) {
    const row = taskRows[i];
    const actualRowIndex = i + 2; // +2 because we skip header and arrays are 0-indexed
    
    try {
      // Validate row data
      const validation = validateTaskRow(row, actualRowIndex);
      if (!validation.isValid) {
        result.errors.push({
          row: actualRowIndex,
          error: validation.error || 'Validation failed'
        });
        console.warn(`Skipping task row ${actualRowIndex}: ${validation.error}`);
        continue;
      }

      if (row.length >= 3) { // Ensure minimum required columns
        const taskData = {
          title: row[0].trim(),
          description: row[1] ? row[1].trim() : null,
          date: row[2],
          start_time: row[3] ? row[3].trim() : null,
          end_time: row[4] ? row[4].trim() : null,
          is_completed: row[5] === 'TRUE' || row[5] === 'true' || row[5] === true,
          priority: row[6] ? row[6].toLowerCase() : 'medium',
          notes: row[7] ? row[7].trim() : null,
          sheet_id: spreadsheetId,
          sheet_row_index: actualRowIndex,
          user_id: null // Public tasks don't have a specific user
        };

        console.log(`Processing task ${actualRowIndex}:`, taskData.title);

        // Check if task already exists
        const { data: existingTask } = await supabase
          .from('public_tasks')
          .select('id')
          .eq('sheet_id', spreadsheetId)
          .eq('sheet_row_index', actualRowIndex)
          .single();

        let retries = 0;
        let success = false;

        while (retries < MAX_RETRIES && !success) {
          try {
            if (existingTask) {
              // Update existing task
              const { error: updateError } = await supabase
                .from('public_tasks')
                .update(taskData)
                .eq('id', existingTask.id);

              if (updateError) {
                throw updateError;
              } else {
                result.updated++;
                success = true;
                console.log(`Updated existing task ${actualRowIndex}`);
              }
            } else {
              // Insert new task
              const { error: insertError } = await supabase
                .from('public_tasks')
                .insert(taskData);

              if (insertError) {
                throw insertError;
              } else {
                result.created++;
                success = true;
                console.log(`Created new task ${actualRowIndex}`);
              }
            }
          } catch (error) {
            retries++;
            if (retries < MAX_RETRIES) {
              console.warn(`Retry ${retries} for task ${actualRowIndex}:`, error.message);
              await delay(RETRY_DELAY * retries); // Exponential backoff
            } else {
              result.errors.push({
                row: actualRowIndex,
                error: error.message
              });
              console.error(`Failed to process task ${actualRowIndex} after ${MAX_RETRIES} retries:`, error);
            }
          }
        }

        result.processed++;
      }
    } catch (error) {
      result.errors.push({
        row: actualRowIndex,
        error: error.message
      });
      console.error(`Error processing task row ${actualRowIndex}:`, error);
    }
  }

  return result;
}

// Check if sync is already running
async function checkSyncStatus(supabase: any): Promise<boolean> {
  const { data: runningSyncs } = await supabase
    .from('sync_log')
    .select('id')
    .eq('status', 'pending')
    .limit(1);

  return runningSyncs && runningSyncs.length > 0;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Check for concurrent sync operations
    const isSyncRunning = await checkSyncStatus(supabase);
    if (isSyncRunning) {
      console.log('Sync already running, skipping...');
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Sync operation already in progress',
          skipped: true
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 409,
        }
      );
    }

    const apiKey = Deno.env.get('GOOGLE_SHEETS_API_KEY');
    if (!apiKey) {
      throw new Error('Google Sheets API key not configured');
    }

    // Your Google Sheet ID
    const spreadsheetId = '1lZMQpzzIJpSeKefA8r2H6HbyNnBtTPVwhSqlm6pSOoU';
    
    console.log('Starting enhanced sync process...');
    console.log('Spreadsheet ID:', spreadsheetId);
    console.log('Batch size:', BATCH_SIZE);

    // Log sync start
    const { data: syncLog, error: syncLogError } = await supabase
      .from('sync_log')
      .insert({
        sync_type: 'sheets_sync_enhanced',
        status: 'pending',
        started_at: new Date().toISOString(),
        metadata: { 
          spreadsheet_id: spreadsheetId,
          batch_size: BATCH_SIZE,
          max_retries: MAX_RETRIES
        }
      })
      .select()
      .single();

    if (syncLogError) {
      console.error('Error creating sync log:', syncLogError);
      throw syncLogError;
    }

    console.log('Created sync log with ID:', syncLog.id);

    let totalItemsProcessed = 0;
    let totalItemsCreated = 0;
    let totalItemsUpdated = 0;
    let totalErrors: Array<{ sheet: string; row: number; error: string }> = [];

    try {
      // Fetch Events (Sheet1) with increased timeout handling
      console.log('Fetching events from Sheet1...');
      const eventsResponse = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1?key=${apiKey}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        }
      );

      if (!eventsResponse.ok) {
        const errorText = await eventsResponse.text();
        console.error('Events API Error:', errorText);
        throw new Error(`Failed to fetch events: ${eventsResponse.status} - ${errorText}`);
      }

      const eventsData = await eventsResponse.json();
      console.log('Events data received. Total rows:', eventsData.values?.length || 0);

      if (eventsData.values && eventsData.values.length > 1) {
        const eventRows = eventsData.values.slice(1); // Skip header row
        console.log(`Processing ${eventRows.length} event rows in batches of ${BATCH_SIZE}...`);

        // Process events in batches
        for (let startIndex = 0; startIndex < eventRows.length; startIndex += BATCH_SIZE) {
          const batchResult = await processEventsBatch(
            supabase,
            eventRows,
            spreadsheetId,
            startIndex,
            BATCH_SIZE
          );

          totalItemsProcessed += batchResult.processed;
          totalItemsCreated += batchResult.created;
          totalItemsUpdated += batchResult.updated;
          
          // Add sheet context to errors
          batchResult.errors.forEach(error => {
            totalErrors.push({
              sheet: 'Sheet1 (Events)',
              row: error.row,
              error: error.error
            });
          });

          // Small delay between batches to prevent overwhelming the database
          if (startIndex + BATCH_SIZE < eventRows.length) {
            await delay(100);
          }
        }
      }

      // Fetch Tasks (Sheet2)
      console.log('Fetching tasks from Sheet2...');
      const tasksResponse = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet2?key=${apiKey}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        }
      );

      if (!tasksResponse.ok) {
        const errorText = await tasksResponse.text();
        console.error('Tasks API Error:', errorText);
        throw new Error(`Failed to fetch tasks: ${tasksResponse.status} - ${errorText}`);
      }

      const tasksData = await tasksResponse.json();
      console.log('Tasks data received. Total rows:', tasksData.values?.length || 0);

      if (tasksData.values && tasksData.values.length > 1) {
        const taskRows = tasksData.values.slice(1); // Skip header row
        console.log(`Processing ${taskRows.length} task rows in batches of ${BATCH_SIZE}...`);

        // Process tasks in batches
        for (let startIndex = 0; startIndex < taskRows.length; startIndex += BATCH_SIZE) {
          const batchResult = await processTasksBatch(
            supabase,
            taskRows,
            spreadsheetId,
            startIndex,
            BATCH_SIZE
          );

          totalItemsProcessed += batchResult.processed;
          totalItemsCreated += batchResult.created;
          totalItemsUpdated += batchResult.updated;
          
          // Add sheet context to errors
          batchResult.errors.forEach(error => {
            totalErrors.push({
              sheet: 'Sheet2 (Tasks)',
              row: error.row,
              error: error.error
            });
          });

          // Small delay between batches to prevent overwhelming the database
          if (startIndex + BATCH_SIZE < taskRows.length) {
            await delay(100);
          }
        }
      }

      // Update sync log as completed
      await supabase
        .from('sync_log')
        .update({
          status: totalErrors.length === 0 ? 'success' : 'success', // Still success if some items processed
          completed_at: new Date().toISOString(),
          items_processed: totalItemsProcessed,
          items_created: totalItemsCreated,
          items_updated: totalItemsUpdated,
          error_message: totalErrors.length > 0 ? `${totalErrors.length} rows had errors` : null,
          metadata: {
            spreadsheet_id: spreadsheetId,
            batch_size: BATCH_SIZE,
            max_retries: MAX_RETRIES,
            errors: totalErrors.slice(0, 100) // Limit stored errors to prevent metadata bloat
          }
        })
        .eq('id', syncLog.id);

      console.log('Enhanced sync completed');
      console.log(`Total processed: ${totalItemsProcessed}, Created: ${totalItemsCreated}, Updated: ${totalItemsUpdated}`);
      console.log(`Errors: ${totalErrors.length}`);

      if (totalErrors.length > 0) {
        console.log('Sample errors:', totalErrors.slice(0, 5));
      }

      return new Response(
        JSON.stringify({
          success: true,
          items_processed: totalItemsProcessed,
          items_created: totalItemsCreated,
          items_updated: totalItemsUpdated,
          errors_count: totalErrors.length,
          errors: totalErrors.slice(0, 10), // Return first 10 errors for debugging
          sync_log_id: syncLog.id
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );

    } catch (syncError) {
      console.error('Sync error:', syncError);
      
      // Update sync log as failed
      await supabase
        .from('sync_log')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          error_message: syncError.message,
          items_processed: totalItemsProcessed,
          items_created: totalItemsCreated,
          items_updated: totalItemsUpdated,
          metadata: {
            spreadsheet_id: spreadsheetId,
            batch_size: BATCH_SIZE,
            max_retries: MAX_RETRIES,
            errors: totalErrors.slice(0, 100)
          }
        })
        .eq('id', syncLog.id);

      throw syncError;
    }

  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({
        error: error.message,
        details: error.stack
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});