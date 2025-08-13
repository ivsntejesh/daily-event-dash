-- Create a secure function for public tasks as well
CREATE OR REPLACE FUNCTION public.get_public_tasks_safe()
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  date date,
  start_time time,
  end_time time,
  is_completed boolean,
  created_at timestamptz,
  updated_at timestamptz,
  notes text,
  user_id uuid,
  sheet_row_index integer,
  sheet_id text,
  priority text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    pt.id,
    pt.title,
    pt.description,
    pt.date,
    pt.start_time,
    pt.end_time,
    pt.is_completed,
    pt.created_at,
    pt.updated_at,
    CASE 
      WHEN auth.uid() IS NOT NULL THEN pt.notes 
      ELSE NULL 
    END as notes,
    pt.user_id,
    pt.sheet_row_index,
    pt.sheet_id,
    pt.priority
  FROM public.public_tasks pt;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_public_tasks_safe() TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_tasks_safe() TO authenticated;