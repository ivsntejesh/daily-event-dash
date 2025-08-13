-- Drop the problematic view and recreate it properly
DROP VIEW IF EXISTS public.public_events_safe;

-- Create a proper function to safely expose public events
CREATE OR REPLACE FUNCTION public.get_public_events_safe()
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  date date,
  start_time time,
  end_time time,
  is_online boolean,
  created_at timestamptz,
  updated_at timestamptz,
  meeting_link text,
  location text,
  notes text,
  user_id uuid,
  sheet_row_index integer,
  sheet_id text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    pe.id,
    pe.title,
    pe.description,
    pe.date,
    pe.start_time,
    pe.end_time,
    pe.is_online,
    pe.created_at,
    pe.updated_at,
    CASE 
      WHEN auth.uid() IS NOT NULL THEN pe.meeting_link 
      ELSE NULL 
    END as meeting_link,
    CASE 
      WHEN auth.uid() IS NOT NULL THEN pe.location 
      ELSE CASE WHEN pe.is_online THEN NULL ELSE 'Location available after sign in' END
    END as location,
    CASE 
      WHEN auth.uid() IS NOT NULL THEN pe.notes 
      ELSE NULL 
    END as notes,
    pe.user_id,
    pe.sheet_row_index,
    pe.sheet_id
  FROM public.public_events pe;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_public_events_safe() TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_events_safe() TO authenticated;