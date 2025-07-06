
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Setting up cron job for sheets sync...');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    
    if (!supabaseUrl || !anonKey) {
      throw new Error('Missing required environment variables');
    }

    // Create cron job that runs 4 times daily (every 6 hours)
    const { data, error } = await supabase.rpc('sql', {
      query: `
        SELECT cron.schedule(
          'sheets-sync-4-times-daily',
          '0 */6 * * *', -- Every 6 hours (00:00, 06:00, 12:00, 18:00)
          $$
          SELECT net.http_post(
            url := '${supabaseUrl}/functions/v1/sheets-sync',
            headers := '{"Content-Type": "application/json", "Authorization": "Bearer ${anonKey}"}'::jsonb,
            body := '{"scheduled": true}'::jsonb
          ) as request_id;
          $$
        );
      `
    });

    if (error) {
      console.error('Failed to setup cron job:', error);
      throw error;
    }

    console.log('Cron job setup successfully', data);
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Cron job setup successfully - will run every 6 hours',
      data: data
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Setup cron error:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
