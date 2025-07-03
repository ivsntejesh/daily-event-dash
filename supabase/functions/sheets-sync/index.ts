
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SheetRow {
  submission: string;
  date: string;
  time: string;
  status: string;
  remarks: string;
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const SHEET_ID = '1-FuahakizPAMcPHsvcwVhs0OjBA1G8lAs3SurgZuXnY';
const SHEET_RANGE = 'A:E'; // Assuming columns A-E contain the data

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('Starting Google Sheets sync...');
  
  // Create sync log entry
  const { data: syncLog, error: syncLogError } = await supabase
    .from('sync_log')
    .insert({
      sync_type: 'sheets-sync',
      status: 'pending',
      metadata: { sheet_id: SHEET_ID }
    })
    .select()
    .single();

  if (syncLogError) {
    console.error('Failed to create sync log:', syncLogError);
    return new Response(JSON.stringify({ error: 'Failed to start sync' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    // Fetch data from Google Sheets
    const apiKey = Deno.env.get('GOOGLE_SHEETS_API_KEY');
    if (!apiKey) {
      throw new Error('Google Sheets API key not configured');
    }

    const sheetsUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${SHEET_RANGE}?key=${apiKey}`;
    const response = await fetch(sheetsUrl);
    
    if (!response.ok) {
      throw new Error(`Google Sheets API error: ${response.status}`);
    }

    const data = await response.json();
    const rows = data.values || [];
    
    console.log(`Fetched ${rows.length} rows from Google Sheets`);

    // Skip header row
    const dataRows = rows.slice(1);
    let itemsProcessed = 0;
    let itemsCreated = 0;
    let itemsUpdated = 0;

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      if (!row || row.length < 3) continue; // Skip empty or incomplete rows

      const rowData: SheetRow = {
        submission: row[0] || '',
        date: row[1] || '',
        time: row[2] || '',
        status: row[3] || '',
        remarks: row[4] || ''
      };

      if (!rowData.submission || !rowData.date) continue; // Skip rows without essential data

      try {
        const result = await processSheetRow(rowData, i + 2); // +2 because we skip header and array is 0-indexed
        if (result.created) itemsCreated++;
        if (result.updated) itemsUpdated++;
        itemsProcessed++;
      } catch (error) {
        console.error(`Error processing row ${i + 2}:`, error);
      }
    }

    // Update sync log with success
    await supabase
      .from('sync_log')
      .update({
        status: 'success',
        completed_at: new Date().toISOString(),
        items_processed: itemsProcessed,
        items_created: itemsCreated,
        items_updated: itemsUpdated
      })
      .eq('id', syncLog.id);

    console.log(`Sync completed successfully. Processed: ${itemsProcessed}, Created: ${itemsCreated}, Updated: ${itemsUpdated}`);

    return new Response(JSON.stringify({
      success: true,
      itemsProcessed,
      itemsCreated,
      itemsUpdated
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Sync failed:', error);
    
    // Update sync log with failure
    await supabase
      .from('sync_log')
      .update({
        status: 'failed',
        completed_at: new Date().toISOString(),
        error_message: error.message
      })
      .eq('id', syncLog.id);

    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function processSheetRow(rowData: SheetRow, rowIndex: number) {
  const parsedDate = parseDate(rowData.date);
  if (!parsedDate) {
    console.warn(`Invalid date format: ${rowData.date}`);
    return { created: false, updated: false };
  }

  const timeInfo = parseTime(rowData.time);
  const isEvent = timeInfo.startTime && timeInfo.endTime;
  
  const commonData = {
    sheet_id: SHEET_ID,
    sheet_row_index: rowIndex,
    title: rowData.submission,
    description: rowData.status ? `Status: ${rowData.status}` : null,
    date: parsedDate,
    notes: rowData.remarks || null,
    user_id: null // Public items don't need user_id
  };

  if (isEvent) {
    return await createOrUpdateEvent({
      ...commonData,
      start_time: timeInfo.startTime,
      end_time: timeInfo.endTime,
      is_online: false,
      meeting_link: null,
      location: null
    });
  } else {
    return await createOrUpdateTask({
      ...commonData,
      start_time: timeInfo.startTime,
      end_time: null,
      is_completed: false,
      priority: 'medium'
    });
  }
}

async function createOrUpdateEvent(eventData: any) {
  // Check if event already exists
  const { data: existing } = await supabase
    .from('public_events')
    .select('id')
    .eq('sheet_id', SHEET_ID)
    .eq('sheet_row_index', eventData.sheet_row_index)
    .single();

  if (existing) {
    // Update existing event
    const { error } = await supabase
      .from('public_events')
      .update(eventData)
      .eq('id', existing.id);
    
    if (error) throw error;
    return { created: false, updated: true };
  } else {
    // Create new event
    const { error } = await supabase
      .from('public_events')
      .insert(eventData);
    
    if (error) throw error;
    return { created: true, updated: false };
  }
}

async function createOrUpdateTask(taskData: any) {
  // Check if task already exists
  const { data: existing } = await supabase
    .from('public_tasks')
    .select('id')
    .eq('sheet_id', SHEET_ID)
    .eq('sheet_row_index', taskData.sheet_row_index)
    .single();

  if (existing) {
    // Update existing task
    const { error } = await supabase
      .from('public_tasks')
      .update(taskData)
      .eq('id', existing.id);
    
    if (error) throw error;
    return { created: false, updated: true };
  } else {
    // Create new task
    const { error } = await supabase
      .from('public_tasks')
      .insert(taskData);
    
    if (error) throw error;
    return { created: true, updated: false };
  }
}

function parseDate(dateStr: string): string | null {
  try {
    // Handle formats like "6 July", "7 Jul", "8 July", etc.
    const currentYear = new Date().getFullYear();
    const cleanDateStr = dateStr.trim().replace(/\s+/g, ' ');
    
    // Try different date formats
    const formats = [
      `${cleanDateStr} ${currentYear}`,
      `${cleanDateStr}, ${currentYear}`
    ];
    
    for (const format of formats) {
      const date = new Date(format);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0]; // Return YYYY-MM-DD format
      }
    }
    
    return null;
  } catch (error) {
    console.error('Date parsing error:', error);
    return null;
  }
}

function parseTime(timeStr: string): { startTime: string | null; endTime: string | null } {
  if (!timeStr) return { startTime: null, endTime: null };
  
  const cleanTimeStr = timeStr.trim();
  
  // Check for time ranges (e.g., "7:00 PM - 8:00 PM")
  const rangeMatch = cleanTimeStr.match(/^(.+?)\s*-\s*(.+?)$/);
  if (rangeMatch) {
    const startTime = convertTo24Hour(rangeMatch[1].trim());
    const endTime = convertTo24Hour(rangeMatch[2].trim());
    return { startTime, endTime };
  }
  
  // Single time (e.g., "11:00 PM")
  const singleTime = convertTo24Hour(cleanTimeStr);
  return { startTime: singleTime, endTime: null };
}

function convertTo24Hour(timeStr: string): string | null {
  try {
    const time = timeStr.toLowerCase().trim();
    
    // Extract hours, minutes, and AM/PM
    const match = time.match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/i);
    if (!match) return null;
    
    let hours = parseInt(match[1]);
    const minutes = match[2];
    const period = match[3].toLowerCase();
    
    if (period === 'pm' && hours !== 12) {
      hours += 12;
    } else if (period === 'am' && hours === 12) {
      hours = 0;
    }
    
    return `${hours.toString().padStart(2, '0')}:${minutes}:00`;
  } catch (error) {
    console.error('Time conversion error:', error);
    return null;
  }
}
