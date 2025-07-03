
-- Create enum for sync status
CREATE TYPE public.sync_status AS ENUM ('pending', 'success', 'failed', 'skipped');

-- Create sync_log table to track sync operations
CREATE TABLE public.sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_type TEXT NOT NULL, -- 'sheets-sync'
  status sync_status NOT NULL DEFAULT 'pending',
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  items_processed INTEGER DEFAULT 0,
  items_created INTEGER DEFAULT 0,
  items_updated INTEGER DEFAULT 0,
  error_message TEXT,
  metadata JSONB
);

-- Add sheet_id column to public_tasks to track sheet origin
ALTER TABLE public.public_tasks 
ADD COLUMN sheet_id TEXT,
ADD COLUMN sheet_row_index INTEGER;

-- Add sheet_id column to public_events to track sheet origin
ALTER TABLE public.public_events 
ADD COLUMN sheet_id TEXT,
ADD COLUMN sheet_row_index INTEGER;

-- Create unique indexes to prevent duplicate sheet imports
CREATE UNIQUE INDEX idx_public_tasks_sheet_unique 
ON public.public_tasks (sheet_id, sheet_row_index) 
WHERE sheet_id IS NOT NULL;

CREATE UNIQUE INDEX idx_public_events_sheet_unique 
ON public.public_events (sheet_id, sheet_row_index) 
WHERE sheet_id IS NOT NULL;

-- Enable pg_cron extension for scheduling
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;

-- RLS policies for sync_log table
ALTER TABLE public.sync_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all sync logs" 
  ON public.sync_log 
  FOR SELECT 
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert sync logs" 
  ON public.sync_log 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "System can update sync logs" 
  ON public.sync_log 
  FOR UPDATE 
  USING (true);
