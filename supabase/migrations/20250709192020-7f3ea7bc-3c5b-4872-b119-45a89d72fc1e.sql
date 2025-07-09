-- Remove duplicate public events, keeping the oldest one for each duplicate group
WITH duplicate_events AS (
  SELECT id, title, description, date, start_time, end_time,
         ROW_NUMBER() OVER (PARTITION BY title, COALESCE(description, ''), date, start_time, end_time ORDER BY created_at) as rn
  FROM public_events
)
DELETE FROM public_events 
WHERE id IN (
  SELECT id FROM duplicate_events WHERE rn > 1
);

-- Remove duplicate public tasks, keeping the oldest one for each duplicate group  
WITH duplicate_tasks AS (
  SELECT id, title, description, date, start_time, end_time,
         ROW_NUMBER() OVER (PARTITION BY title, COALESCE(description, ''), date, COALESCE(start_time::text, ''), COALESCE(end_time::text, '') ORDER BY created_at) as rn
  FROM public_tasks
)
DELETE FROM public_tasks 
WHERE id IN (
  SELECT id FROM duplicate_tasks WHERE rn > 1
);