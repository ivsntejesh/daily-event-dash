
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    const apiKey = Deno.env.get('GOOGLE_SHEETS_API_KEY');
    if (!apiKey) {
      throw new Error('Google Sheets API key not configured');
    }

    // Your new Google Sheet ID
    const spreadsheetId = '1lZMQpzzIJpSeKefA8r2H6HbyNnBtTPVwhSqlm6pSOoU';
    
    console.log('Starting sync process...');
    console.log('Spreadsheet ID:', spreadsheetId);

    // Log sync start
    const { data: syncLog, error: syncLogError } = await supabase
      .from('sync_log')
      .insert({
        sync_type: 'sheets_sync',
        status: 'pending',
        started_at: new Date().toISOString(),
        metadata: { spreadsheet_id: spreadsheetId }
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

    try {
      // Fetch Events (Sheet1)
      console.log('Fetching events from Sheet1...');
      const eventsResponse = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1?key=${apiKey}`
      );

      if (!eventsResponse.ok) {
        const errorText = await eventsResponse.text();
        console.error('Events API Error:', errorText);
        throw new Error(`Failed to fetch events: ${eventsResponse.status} - ${errorText}`);
      }

      const eventsData = await eventsResponse.json();
      console.log('Events data received:', eventsData);

      if (eventsData.values && eventsData.values.length > 1) {
        const eventRows = eventsData.values.slice(1); // Skip header row
        console.log(`Processing ${eventRows.length} event rows...`);

        for (let i = 0; i < eventRows.length; i++) {
          const row = eventRows[i];
          if (row.length >= 4) { // Ensure minimum required columns
            const eventData = {
              title: row[0] || 'Untitled Event',
              description: row[1] || null,
              date: row[2],
              start_time: row[3],
              end_time: row[4] || row[3], // Use start_time if end_time is missing
              is_online: row[5] === 'TRUE' || row[5] === 'true',
              location: row[6] || null,
              meeting_link: row[7] || null,
              notes: row[8] || null,
              sheet_id: spreadsheetId,
              sheet_row_index: i + 2, // +2 because we skip header and arrays are 0-indexed
              user_id: null // Public events don't have a specific user
            };

            console.log(`Processing event ${i + 1}:`, eventData);

            // Check if event already exists (by sheet_id and sheet_row_index to prevent duplicates)
            const { data: existingEvent } = await supabase
              .from('public_events')
              .select('id')
              .eq('sheet_id', spreadsheetId)
              .eq('sheet_row_index', i + 2)
              .single();

            if (existingEvent) {
              // Update existing event
              const { error: updateError } = await supabase
                .from('public_events')
                .update(eventData)
                .eq('id', existingEvent.id);

              if (updateError) {
                console.error(`Error updating event ${i + 1}:`, updateError);
              } else {
                totalItemsUpdated++;
                console.log(`Updated existing event ${i + 1}`);
              }
            } else {
              // Insert new event
              const { error: insertError } = await supabase
                .from('public_events')
                .insert(eventData);

              if (insertError) {
                console.error(`Error inserting event ${i + 1}:`, insertError);
              } else {
                totalItemsCreated++;
                console.log(`Created new event ${i + 1}`);
              }
            }

            totalItemsProcessed++;
          }
        }
      }

      // Fetch Tasks (Sheet2)
      console.log('Fetching tasks from Sheet2...');
      const tasksResponse = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet2?key=${apiKey}`
      );

      if (!tasksResponse.ok) {
        const errorText = await tasksResponse.text();
        console.error('Tasks API Error:', errorText);
        throw new Error(`Failed to fetch tasks: ${tasksResponse.status} - ${errorText}`);
      }

      const tasksData = await tasksResponse.json();
      console.log('Tasks data received:', tasksData);

      if (tasksData.values && tasksData.values.length > 1) {
        const taskRows = tasksData.values.slice(1); // Skip header row
        console.log(`Processing ${taskRows.length} task rows...`);

        for (let i = 0; i < taskRows.length; i++) {
          const row = taskRows[i];
          if (row.length >= 3) { // Ensure minimum required columns
            const taskData = {
              title: row[0] || 'Untitled Task',
              description: row[1] || null,
              date: row[2],
              start_time: row[3] || null,
              end_time: row[4] || null,
              is_completed: row[5] === 'TRUE' || row[5] === 'true',
              priority: row[6] || 'medium',
              notes: row[7] || null,
              sheet_id: spreadsheetId,
              sheet_row_index: i + 2, // +2 because we skip header and arrays are 0-indexed
              user_id: null // Public tasks don't have a specific user
            };

            console.log(`Processing task ${i + 1}:`, taskData);

            // Check if task already exists (by sheet_id and sheet_row_index to prevent duplicates)
            const { data: existingTask } = await supabase
              .from('public_tasks')
              .select('id')
              .eq('sheet_id', spreadsheetId)
              .eq('sheet_row_index', i + 2)
              .single();

            if (existingTask) {
              // Update existing task
              const { error: updateError } = await supabase
                .from('public_tasks')
                .update(taskData)
                .eq('id', existingTask.id);

              if (updateError) {
                console.error(`Error updating task ${i + 1}:`, updateError);
              } else {
                totalItemsUpdated++;
                console.log(`Updated existing task ${i + 1}`);
              }
            } else {
              // Insert new task
              const { error: insertError } = await supabase
                .from('public_tasks')
                .insert(taskData);

              if (insertError) {
                console.error(`Error inserting task ${i + 1}:`, insertError);
              } else {
                totalItemsCreated++;
                console.log(`Created new task ${i + 1}`);
              }
            }

            totalItemsProcessed++;
          }
        }
      }

      // Update sync log as completed
      await supabase
        .from('sync_log')
        .update({
          status: 'success',
          completed_at: new Date().toISOString(),
          items_processed: totalItemsProcessed,
          items_created: totalItemsCreated,
          items_updated: totalItemsUpdated
        })
        .eq('id', syncLog.id);

      console.log('Sync completed successfully');
      console.log(`Total processed: ${totalItemsProcessed}, Created: ${totalItemsCreated}, Updated: ${totalItemsUpdated}`);

      return new Response(
        JSON.stringify({
          success: true,
          items_processed: totalItemsProcessed,
          items_created: totalItemsCreated,
          items_updated: totalItemsUpdated,
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
          items_updated: totalItemsUpdated
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
