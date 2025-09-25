import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Enhanced helper function to parse dates in various formats
function parseSheetDate(dateStr: string, defaultYear = 2025): string | null {
  if (!dateStr) return null;
  const raw = dateStr.trim().replace(/,/g, '');
  if (!raw) return null;

  try {
    // Fast path: ISO
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;

    // Month name map (3+ letters)
    const monthMap: Record<string, string> = {
      jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
      jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
    };

    const pad = (n: number) => n.toString().padStart(2, '0');
    const normYear = (y: number) => (y < 100 ? 2000 + y : y);

    // 1) Day-Month short name: "DD-MMM" or "DD MMM" (e.g., 11 Aug)
    let m = raw.match(/^(\d{1,2})[-\s]([A-Za-z]{3,})$/);
    if (m) {
      const day = parseInt(m[1], 10);
      const mon = monthMap[m[2].slice(0,3).toLowerCase()];
      if (mon) return `${defaultYear}-${mon}-${pad(day)}`;
    }

    // 2) Day-Month-Year with name: "DD MMM YYYY" or "DD MMM YY"
    m = raw.match(/^(\d{1,2})\s+([A-Za-z]{3,})\s+(\d{2,4})$/);
    if (m) {
      const day = parseInt(m[1], 10);
      const mon = monthMap[m[2].slice(0,3).toLowerCase()];
      const year = normYear(parseInt(m[3], 10));
      if (mon) return `${year}-${mon}-${pad(day)}`;
    }

    // 3) Month-Day (name first): "MMM DD" or "MMM DD YYYY"
    m = raw.match(/^([A-Za-z]{3,})\s+(\d{1,2})(?:\s+(\d{2,4}))?$/);
    if (m) {
      const mon = monthMap[m[1].slice(0,3).toLowerCase()];
      const day = parseInt(m[2], 10);
      const year = m[3] ? normYear(parseInt(m[3], 10)) : defaultYear;
      if (mon) return `${year}-${mon}-${pad(day)}`;
    }

    // 4) Slash or dash numeric dates: supports DD/MM/YY, DD/MM/YYYY, MM/DD/YYYY
    m = raw.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
    if (m) {
      let a = parseInt(m[1], 10); // day or month
      let b = parseInt(m[2], 10); // month or day
      const y = normYear(parseInt(m[3], 10));

      // Heuristic: if first > 12 => DD/MM; if second > 12 => MM/DD; else assume DD/MM
      let day: number, month: number;
      if (a > 12) { day = a; month = b; }
      else if (b > 12) { month = a; day = b; }
      else { day = a; month = b; }

      return `${y}-${pad(month)}-${pad(day)}`;
    }

    // 5) US-style MM/DD/YYYY already covered, but also handle e.g., 4/7 (assume current year, DD/MM)
    m = raw.match(/^(\d{1,2})[\/\-](\d{1,2})$/);
    if (m) {
      // Assume DD/MM
      const day = parseInt(m[1], 10);
      const month = parseInt(m[2], 10);
      return `${defaultYear}-${pad(month)}-${pad(day)}`;
    }

    console.warn(`Unrecognized date format: ${raw}`);
    return null;
  } catch (error) {
    console.error(`Error parsing date "${raw}":`, error);
    return null;
  }
}

// Helper function to parse time in various formats
function parseSheetTime(timeStr: string): { startTime: string | null, endTime: string | null } {
  if (!timeStr || timeStr.trim() === '') return { startTime: null, endTime: null };
  
  const cleanTimeStr = timeStr.trim();
  
  try {
    // Handle time ranges like "9:00 AM - 10:30 AM", "9-10:30 AM", "4pm - 6pm"
    const rangePatterns = [
      /^(\d{1,2}):(\d{2})\s*(AM|PM)\s*[-–]\s*(\d{1,2}):(\d{2})\s*(AM|PM)$/i, // Full range with minutes
      /^(\d{1,2})\s*(AM|PM)\s*[-–]\s*(\d{1,2}):(\d{2})\s*(AM|PM)$/i, // Start hour only, end with minutes
      /^(\d{1,2})\s*(AM|PM)\s*[-–]\s*(\d{1,2})\s*(AM|PM)$/i, // Both hours only
      /^(\d{1,2}):(\d{2})\s*[-–]\s*(\d{1,2}):(\d{2})$/i // 24-hour format range
    ];
    
    for (const pattern of rangePatterns) {
      const match = cleanTimeStr.match(pattern);
      if (match) {
        let startTime, endTime;
        
        if (pattern === rangePatterns[0]) { // Full range with AM/PM
          const [, startHour, startMin, startAmPm, endHour, endMin, endAmPm] = match;
          startTime = convertTo24Hour(startHour, startMin, startAmPm);
          endTime = convertTo24Hour(endHour, endMin, endAmPm);
        } else if (pattern === rangePatterns[1]) { // Start hour only
          const [, startHour, startAmPm, endHour, endMin, endAmPm] = match;
          startTime = convertTo24Hour(startHour, '00', startAmPm);
          endTime = convertTo24Hour(endHour, endMin, endAmPm);
        } else if (pattern === rangePatterns[2]) { // Both hours only
          const [, startHour, startAmPm, endHour, endAmPm] = match;
          startTime = convertTo24Hour(startHour, '00', startAmPm);
          endTime = convertTo24Hour(endHour, '00', endAmPm);
        } else { // 24-hour format
          const [, startHour, startMin, endHour, endMin] = match;
          startTime = `${startHour.padStart(2, '0')}:${startMin}:00`;
          endTime = `${endHour.padStart(2, '0')}:${endMin}:00`;
        }
        
        return { startTime, endTime };
      }
    }
    
    // Handle single time formats (tasks)
    // "4:30 PM", "8:00 AM" format
    const timeMatch = cleanTimeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (timeMatch) {
      const [, hours, minutes, ampm] = timeMatch;
      const startTime = convertTo24Hour(hours, minutes, ampm);
      return { startTime, endTime: null };
    }
    
    // "9 AM", "4 PM" format (hour only)
    const hourMatch = cleanTimeStr.match(/^(\d{1,2})\s*(AM|PM)$/i);
    if (hourMatch) {
      const [, hours, ampm] = hourMatch;
      const startTime = convertTo24Hour(hours, '00', ampm);
      return { startTime, endTime: null };
    }
    
    // Handle "HH:MM" format (24-hour)
    if (/^\d{1,2}:\d{2}$/.test(cleanTimeStr)) {
      const [hours, minutes] = cleanTimeStr.split(':');
      return { startTime: `${hours.padStart(2, '0')}:${minutes}:00`, endTime: null };
    }
    
    // Handle "HH:MM:SS" format
    if (/^\d{1,2}:\d{2}:\d{2}$/.test(cleanTimeStr)) {
      return { startTime: cleanTimeStr, endTime: null };
    }
    
    console.warn(`Unrecognized time format: ${cleanTimeStr}`);
    return { startTime: null, endTime: null };
  } catch (error) {
    console.error(`Error parsing time "${cleanTimeStr}":`, error);
    return { startTime: null, endTime: null };
  }
}

// Helper function to convert 12-hour to 24-hour format
function convertTo24Hour(hours: string, minutes: string, ampm: string): string {
  let hour24 = parseInt(hours);
  
  if (ampm.toUpperCase() === 'PM' && hour24 !== 12) {
    hour24 += 12;
  } else if (ampm.toUpperCase() === 'AM' && hour24 === 12) {
    hour24 = 0;
  }
  
  return `${hour24.toString().padStart(2, '0')}:${minutes}:00`;
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

    // Get sheet ID from config or fallback to default
    let spreadsheetId = '1-FuahakizPAMcPHsvcwVhs0OjBA1G8lAs3SurgZuXnY';
    try {
      const { data: configData } = await supabase
        .from('sync_config')
        .select('config_value')
        .eq('config_key', 'default_sheet_id')
        .maybeSingle();
      
      if (configData?.config_value) {
        spreadsheetId = configData.config_value;
      }
    } catch (configError) {
      console.warn('Could not fetch sheet ID from config, using default:', configError);
    }
    
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
      // First, get sheet metadata to determine the actual data range
      console.log('Getting sheet metadata...');
      const metadataResponse = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?key=${apiKey}&fields=sheets.properties`
      );

      let maxRange = 'A1:Z1200'; // fallback
      if (metadataResponse.ok) {
        const metadata = await metadataResponse.json();
        const sheet = metadata.sheets?.find((s: any) => s.properties?.title === 'Sheet1');
        if (sheet?.properties?.gridProperties?.rowCount) {
          const rowCount = Math.min(sheet.properties.gridProperties.rowCount, 5000); // Cap at 5k for safety
          maxRange = `A1:Z${rowCount}`;
          console.log(`Detected ${rowCount} rows, using range: ${maxRange}`);
        }
      }

      // Fetch data from Sheet1 with dynamic range
      console.log('Fetching data from Sheet1...');
      const dataResponse = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!${maxRange}?key=${apiKey}`
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

        // Prepare arrays for bulk operations
        const eventsToUpsert: any[] = [];
        const tasksToUpsert: any[] = [];

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
          
          const timeData = parseSheetTime(row[2]); // Time is in column C (index 2)
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
            // Process as event - use provided times or defaults
            const eventData = {
              ...baseData,
              description: remarks || null,
              start_time: timeData.startTime || '09:00:00',
              end_time: timeData.endTime || (timeData.startTime ? 
                (timeData.startTime.split(':')[0] === '23' ? '23:59:00' : 
                 `${(parseInt(timeData.startTime.split(':')[0]) + 1).toString().padStart(2, '0')}:${timeData.startTime.split(':')[1]}:00`) 
                : '10:00:00'),
              is_online: remarks.toLowerCase().includes('online') || remarks.toLowerCase().includes('zoom'),
              location: remarks.toLowerCase().includes('online') ? null : 'Campus',
              meeting_link: null,
              notes: status ? `Status: ${status}` : null
            };

            eventsToUpsert.push(eventData);
            eventsProcessed++;
          } else {
            // Process as task - only use start time, no end time for tasks
            const taskData = {
              ...baseData,
              description: remarks || null,
              start_time: timeData.startTime,
              end_time: null, // Tasks don't have end times
              is_completed: status.toLowerCase().includes('complete') || status.toLowerCase() === 'done',
              priority: remarks.toLowerCase().includes('urgent') ? 'high' : 
                       remarks.toLowerCase().includes('important') ? 'high' : 'medium',
              notes: status ? `Status: ${status}` : null
            };

            tasksToUpsert.push(taskData);
            tasksProcessed++;
          }

          totalItemsProcessed++;
        }

        // Bulk upsert events in batches
        if (eventsToUpsert.length > 0) {
          console.log(`Upserting ${eventsToUpsert.length} events in batches...`);
          const eventBatchSize = 100;
          for (let i = 0; i < eventsToUpsert.length; i += eventBatchSize) {
            const batch = eventsToUpsert.slice(i, i + eventBatchSize);
            const { data: upsertedEvents, error: eventUpsertError } = await supabase
              .from('public_events')
              .upsert(batch, {
                onConflict: 'sheet_id,sheet_row_index',
                ignoreDuplicates: false
              })
              .select('id');

            if (eventUpsertError) {
              console.error(`Error upserting events batch ${i / eventBatchSize + 1}:`, eventUpsertError);
              // Try individual inserts/updates as fallback
              for (const eventData of batch) {
                try {
                  const { data: existing } = await supabase
                    .from('public_events')
                    .select('id')
                    .eq('sheet_id', eventData.sheet_id)
                    .eq('sheet_row_index', eventData.sheet_row_index)
                    .maybeSingle();

                  if (existing) {
                    await supabase.from('public_events').update(eventData).eq('id', existing.id);
                    totalItemsUpdated++;
                  } else {
                    await supabase.from('public_events').insert(eventData);
                    totalItemsCreated++;
                  }
                } catch (fallbackError) {
                  console.error('Fallback event operation failed:', fallbackError);
                }
              }
            } else {
              // Count as updates since upsert was used
              totalItemsUpdated += batch.length;
              console.log(`Successfully upserted events batch ${i / eventBatchSize + 1}`);
            }
          }
        }

        // Bulk upsert tasks in batches
        if (tasksToUpsert.length > 0) {
          console.log(`Upserting ${tasksToUpsert.length} tasks in batches...`);
          const taskBatchSize = 100;
          for (let i = 0; i < tasksToUpsert.length; i += taskBatchSize) {
            const batch = tasksToUpsert.slice(i, i + taskBatchSize);
            const { data: upsertedTasks, error: taskUpsertError } = await supabase
              .from('public_tasks')
              .upsert(batch, {
                onConflict: 'sheet_id,sheet_row_index',
                ignoreDuplicates: false
              })
              .select('id');

            if (taskUpsertError) {
              console.error(`Error upserting tasks batch ${i / taskBatchSize + 1}:`, taskUpsertError);
              // Try individual inserts/updates as fallback
              for (const taskData of batch) {
                try {
                  const { data: existing } = await supabase
                    .from('public_tasks')
                    .select('id')
                    .eq('sheet_id', taskData.sheet_id)
                    .eq('sheet_row_index', taskData.sheet_row_index)
                    .maybeSingle();

                  if (existing) {
                    await supabase.from('public_tasks').update(taskData).eq('id', existing.id);
                    totalItemsUpdated++;
                  } else {
                    await supabase.from('public_tasks').insert(taskData);
                    totalItemsCreated++;
                  }
                } catch (fallbackError) {
                  console.error('Fallback task operation failed:', fallbackError);
                }
              }
            } else {
              // Count as updates since upsert was used
              totalItemsUpdated += batch.length;
              console.log(`Successfully upserted tasks batch ${i / taskBatchSize + 1}`);
            }
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
          items_updated: totalItemsUpdated,
          metadata: { 
            spreadsheet_id: spreadsheetId, 
            events_processed: eventsProcessed,
            tasks_processed: tasksProcessed,
            range_used: maxRange
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
          error_message: (syncError as Error).message,
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
        error: (error as Error).message,
        details: (error as Error).stack
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
})