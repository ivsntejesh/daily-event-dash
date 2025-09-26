-- First, add the sync_key column without constraints
ALTER TABLE public.public_events 
ADD COLUMN IF NOT EXISTS sync_key text;

ALTER TABLE public.public_tasks 
ADD COLUMN IF NOT EXISTS sync_key text;

-- Function to generate sync key from title, date, and time
CREATE OR REPLACE FUNCTION public.generate_sync_key(
  p_title text,
  p_date date,
  p_start_time time DEFAULT NULL,
  p_end_time time DEFAULT NULL
) RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- Create a consistent key from title + date + time components
  -- Use lower case and trim for consistency
  RETURN lower(trim(p_title)) || '|' || 
         p_date::text || '|' || 
         COALESCE(p_start_time::text, '') || '|' || 
         COALESCE(p_end_time::text, '');
END;
$$;

-- Update all records to have sync keys
UPDATE public.public_events 
SET sync_key = public.generate_sync_key(title, date, start_time, end_time)
WHERE sync_key IS NULL;

UPDATE public.public_tasks 
SET sync_key = public.generate_sync_key(title, date, start_time, end_time)
WHERE sync_key IS NULL;

-- Remove duplicates by keeping the most recent record for each sync_key
-- For events
DELETE FROM public.public_events 
WHERE id NOT IN (
  SELECT DISTINCT ON (sync_key) id
  FROM public.public_events
  ORDER BY sync_key, updated_at DESC
);

-- For tasks  
DELETE FROM public.public_tasks 
WHERE id NOT IN (
  SELECT DISTINCT ON (sync_key) id
  FROM public.public_tasks
  ORDER BY sync_key, updated_at DESC
);

-- Now create unique indexes on the sync_key
CREATE UNIQUE INDEX IF NOT EXISTS public_events_sync_key_idx 
ON public.public_events(sync_key) 
WHERE sync_key IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS public_tasks_sync_key_idx 
ON public.public_tasks(sync_key) 
WHERE sync_key IS NOT NULL;