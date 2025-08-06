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

    console.log('Setting up automatic sync cron job...');

    // Generate the SQL command for setting up cron job
    const cronSQL = `
      SELECT cron.schedule(
        'sync-sheets-every-6-hours',
        '0 */6 * * *',
        $$
        SELECT net.http_post(
          url := 'https://enlpugyqiitjycedpdya.supabase.co/functions/v1/sheets-sync',
          headers := '{"Content-Type": "application/json", "Authorization": "Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}"}'::jsonb,
          body := '{"scheduled": true}'::jsonb
        ) as request_id;
        $$
      );
    `;

    console.log('Generated cron SQL:', cronSQL);

    // Return instructions for manual setup since pg_cron requires special setup
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Automatic sync setup instructions provided',
        instructions: {
          step1: 'Enable pg_cron extension',
          step2: 'Enable pg_net extension', 
          step3: 'Run the provided SQL command',
          sql_command: cronSQL,
          manual_steps: [
            '1. Go to your Supabase project dashboard',
            '2. Navigate to Database > Extensions',
            '3. Enable "pg_cron" extension',
            '4. Enable "pg_net" extension',
            '5. Go to SQL Editor and run the provided SQL command',
            '6. The sync will then run automatically every 6 hours'
          ],
          alternative: 'You can also continue using the Manual Sync button to sync on-demand'
        },
        cron_schedule: '0 */6 * * * (every 6 hours at minute 0)',
        target_function: 'https://enlpugyqiitjycedpdya.supabase.co/functions/v1/sheets-sync'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Setup cron error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to setup automatic sync',
        details: error.message,
        instructions: {
          manual_setup: 'Please enable pg_cron and pg_net extensions in your Supabase project, then use the Manual Sync button as needed.'
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});