import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Helper function to parse dates in various formats
function parseSheetDate(dateStr: string, year = 2025): string | null {
  if (!dateStr || dateStr.trim() === '') return null;
  
  try {
    // Handle formats like "28-Apr", "29-Apr", etc.
    const monthMap: { [key: string]: string } = {
      'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04',
      'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08',
      'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
    };
    
    // Handle "DD-MMM" format
    const dayMonthMatch = dateStr.match(/^(\d{1,2})-([A-Za-z]{3})$/);
    if (dayMonthMatch) {
      const [, day, month] = dayMonthMatch;
      const monthNum = monthMap[month];
      if (monthNum) {
        const paddedDay = day.padStart(2, '0');
        return `${year}-${monthNum}-${paddedDay}`;
      }
    }
    
    // Handle "YYYY-MM-DD" format (already correct)
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return dateStr;
    }
    
    // Handle "MM/DD/YYYY" format
    const slashMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (slashMatch) {
      const [, month, day, yearVal] = slashMatch;
      return `${yearVal}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
    console.warn(`Unrecognized date format: ${dateStr}`);
    return null;
  } catch (error) {
    console.error(`Error parsing date "${dateStr}":`, error);
    return null;
  }
}

// Helper function to parse time in various formats
function parseSheetTime(timeStr: string): string | null {
  if (!timeStr || timeStr.trim() === '') return null;
  
  try {
    // Handle "4:30 PM", "8:00 AM" format
    const timeMatch = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (timeMatch) {
      let [, hours, minutes, ampm] = timeMatch;
      let hour24 = parseInt(hours);
      
      if (ampm.toUpperCase() === 'PM' && hour24 !== 12) {
        hour24 += 12;
      } else if (ampm.toUpperCase() === 'AM' && hour24 === 12) {
        hour24 = 0;
      }
      
      return `${hour24.toString().padStart(2, '0')}:${minutes}:00`;
    }
    
    // Handle "HH:MM" format
    if (/^\d{1,2}:\d{2}$/.test(timeStr)) {
      return `${timeStr}:00`;
    }
    
    // Handle "HH:MM:SS" format
    if (/^\d{1,2}:\d{2}:\d{2}$/.test(timeStr)) {
      return timeStr;
    }
    
    // Handle time ranges like "4pm - 6pm", "9-12:30 pm" - extract start time
    const rangeMatch = timeStr.match(/^(\d{1,2}(?::\d{2})?)\s*(?:am|pm)?/i);
    if (rangeMatch) {
      return parseSheetTime(rangeMatch[1] + (timeStr.includes('pm') ? ' PM' : ' AM'));
    }
    
    console.warn(`Unrecognized time format: ${timeStr}`);
    return null;
  } catch (error) {
    console.error(`Error parsing time "${timeStr}":`, error);
    return null;
  }
}

// Helper function to determine if a row represents an event or task
function categorizeRow(row: string[]): 'event' | 'task' | 'skip' {
  if (row.length < 2) return 'skip';
  
  const title = (row[0] || '').toLowerCase();
  const remarks = (row[4] || '').toLowerCase();
  
  // Skip empty or header rows
  if (!title || title === 'name' || title === 'title') return 'skip';
  
  // Events typically have specific time slots and are often meetings/classes
  const isEvent = (
    title.includes('lecture') ||
    title.includes('class') ||
    title.includes('meeting') ||
    title.includes('presentation') ||
    title.includes('exam') ||
    title.includes('quiz') ||
    remarks.includes('submission') ||
    remarks.includes('lecture')
  );
  
  // Everything else is treated as a task
  return isEvent ? 'event' : 'task';
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
      console.error('Google Sheets API key not found in environment variables');
      throw new Error('Google Sheets API key not configured. Please set GOOGLE_SHEETS_API_KEY in edge function secrets.');
    }
    
    console.log('Google Sheets API key found, proceeding with sync...');

    // Updated Google Sheet ID
    const spreadsheetId = '1-FuahakizPAMcPHsvcwVhs0OjBA1G8lAs3SurgZuXnY';
    
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
    let eventsProcessed = 0;
    let tasksProcessed = 0;

    try {
      // Fetch data from Sheet1 (the main sheet with all data)
      console.log('Fetching data from Sheet1...');
      const dataResponse = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A1:Z1200?key=${apiKey}`
      );

      if (!dataResponse.ok) {
        const errorText = await dataResponse.text();
        console.error('Sheets API Error:', errorText);
        throw new Error(`Failed to fetch sheet data: ${dataResponse.status} - ${errorText}`);
      }

      const sheetData = await dataResponse.json();
      console.log('Sheet data received with', sheetData.values?.length || 0, 'rows');

      if (sheetData.values && sheetData.values.length > 1) {
        const dataRows = sheetData.values.slice(1); // Skip header row
        console.log(`Processing ${dataRows.length} data rows...`);

        for (let i = 0; i < dataRows.length; i++) {
          const row = dataRows[i];
          
          // Skip empty rows
          if (!row || row.length < 2 || !row[0] || !row[1]) continue;
          
          // Parse the date
          const parsedDate = parseSheetDate(row[1]); // Date is in column B (index 1)
          if (!parsedDate) {
            console.warn(`Invalid date format in row ${i + 2}: ${row[1]}, skipping...`);
            continue;
          }
          
          // Determine if this is an event or task
          const category = categorizeRow(row);
          if (category === 'skip') continue;
          
          const parsedTime = parseSheetTime(row[2]); // Time is in column C (index 2)
          const status = row[3] || ''; // Status in column D (index 3)
          const remarks = row[4] || ''; // Remarks in column E (index 4)
          
          const baseData = {
            title: row[0] || 'Untitled',
            date: parsedDate,
            sheet_id: spreadsheetId,
            sheet_row_index: i + 2,
            user_id: null // Public items don't have a specific user
          };

          if (category === 'event') {
            // Process as event
            const eventData = {
              ...baseData,
              description: remarks || null,
              start_time: parsedTime || '09:00:00',
              end_time: parsedTime ? 
                (parsedTime.split(':')[0] === '23' ? '23:59:00' : 
                 `${(parseInt(parsedTime.split(':')[0]) + 1).toString().padStart(2, '0')}:${parsedTime.split(':')[1]}:00`) 
                : '10:00:00',
              is_online: remarks.toLowerCase().includes('online') || remarks.toLowerCase().includes('zoom'),
              location: remarks.toLowerCase().includes('online') ? null : 'Campus',
              meeting_link: null,
              notes: status ? `Status: ${status}` : null
            };

            console.log(`Processing event ${eventsProcessed + 1}:`, eventData.title);

            // Check if event already exists
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
                console.error(`Error updating event ${eventsProcessed + 1}:`, updateError);
              } else {
                totalItemsUpdated++;
                console.log(`Updated existing event: ${eventData.title}`);
              }
            } else {
              // Insert new event
              const { error: insertError } = await supabase
                .from('public_events')
                .insert(eventData);

              if (insertError) {
                console.error(`Error inserting event ${eventsProcessed + 1}:`, insertError);
              } else {
                totalItemsCreated++;
                console.log(`Created new event: ${eventData.title}`);
              }
            }
            
            eventsProcessed++;
          } else {
            // Process as task
            const taskData = {
              ...baseData,
              description: remarks || null,
              start_time: parsedTime,
              end_time: null,
              is_completed: status.toLowerCase().includes('complete') || status.toLowerCase() === 'done',
              priority: remarks.toLowerCase().includes('urgent') ? 'high' : 
                       remarks.toLowerCase().includes('important') ? 'high' : 'medium',
              notes: status ? `Status: ${status}` : null
            };

            console.log(`Processing task ${tasksProcessed + 1}:`, taskData.title);

            // Check if task already exists
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
                console.error(`Error updating task ${tasksProcessed + 1}:`, updateError);
              } else {
                totalItemsUpdated++;
                console.log(`Updated existing task: ${taskData.title}`);
              }
            } else {
              // Insert new task
              const { error: insertError } = await supabase
                .from('public_tasks')
                .insert(taskData);

              if (insertError) {
                console.error(`Error inserting task ${tasksProcessed + 1}:`, insertError);
              } else {
                totalItemsCreated++;
                console.log(`Created new task: ${taskData.title}`);
              }
            }
            
            tasksProcessed++;
          }

          totalItemsProcessed++;
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
          items_updated: totalItemsUpdated,
          metadata: { 
            spreadsheet_id: spreadsheetId, 
            events_processed: eventsProcessed,
            tasks_processed: tasksProcessed
          }
        })
        .eq('id', syncLog.id);

      console.log('Sync completed successfully');
      console.log(`Total processed: ${totalItemsProcessed}, Created: ${totalItemsCreated}, Updated: ${totalItemsUpdated}`);
      console.log(`Events: ${eventsProcessed}, Tasks: ${tasksProcessed}`);

      return new Response(
        JSON.stringify({
          success: true,
          items_processed: totalItemsProcessed,
          items_created: totalItemsCreated,
          items_updated: totalItemsUpdated,
          events_processed: eventsProcessed,
          tasks_processed: tasksProcessed,
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
})