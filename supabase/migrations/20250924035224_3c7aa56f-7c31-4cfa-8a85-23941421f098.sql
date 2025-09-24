-- Add performance indexes for sheet sync operations
CREATE INDEX IF NOT EXISTS idx_public_events_sheet_sync 
ON public.public_events (sheet_id, sheet_row_index) 
WHERE sheet_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_public_tasks_sheet_sync 
ON public.public_tasks (sheet_id, sheet_row_index) 
WHERE sheet_id IS NOT NULL;

-- Add date indexes for faster chronological queries
CREATE INDEX IF NOT EXISTS idx_public_events_date 
ON public.public_events (date);

CREATE INDEX IF NOT EXISTS idx_public_tasks_date 
ON public.public_tasks (date);

-- Add unique constraint to prevent duplicate sheet rows (only if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_sheet_row_events') THEN
        ALTER TABLE public.public_events 
        ADD CONSTRAINT unique_sheet_row_events 
        UNIQUE (sheet_id, sheet_row_index);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_sheet_row_tasks') THEN
        ALTER TABLE public.public_tasks 
        ADD CONSTRAINT unique_sheet_row_tasks 
        UNIQUE (sheet_id, sheet_row_index);
    END IF;
END $$;

-- Create sync configuration table for dynamic settings
CREATE TABLE IF NOT EXISTS public.sync_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key TEXT UNIQUE NOT NULL,
  config_value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on sync_config
ALTER TABLE public.sync_config ENABLE ROW LEVEL SECURITY;

-- Only admins can manage sync config
CREATE POLICY "Admins can manage sync config" ON public.sync_config
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert default sheet ID
INSERT INTO public.sync_config (config_key, config_value, description) 
VALUES (
  'default_sheet_id', 
  '1-FuahakizPAMcPHsvcwVhs0OjBA1G8lAs3SurgZuXnY',
  'Default Google Sheets ID for sync operations'
) ON CONFLICT (config_key) DO NOTHING;

-- Add trigger for sync_config updated_at
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_sync_config_updated_at') THEN
        CREATE TRIGGER update_sync_config_updated_at
        BEFORE UPDATE ON public.sync_config
        FOR EACH ROW
        EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
END $$;