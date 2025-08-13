-- Create a view for public events that excludes sensitive information for anonymous users
CREATE OR REPLACE VIEW public.public_events_safe AS 
SELECT 
  id,
  title,
  description,
  date,
  start_time,
  end_time,
  is_online,
  created_at,
  updated_at,
  CASE 
    WHEN auth.uid() IS NOT NULL THEN meeting_link 
    ELSE NULL 
  END as meeting_link,
  CASE 
    WHEN auth.uid() IS NOT NULL THEN location 
    ELSE CASE WHEN is_online THEN NULL ELSE 'Location available after sign in' END
  END as location,
  CASE 
    WHEN auth.uid() IS NOT NULL THEN notes 
    ELSE NULL 
  END as notes,
  user_id,
  sheet_row_index,
  sheet_id
FROM public.public_events;

-- Enable RLS on the view (inherits from the underlying table)
-- No additional policies needed as the view handles the logic

-- Update the existing policies to be more restrictive for sensitive fields
-- Keep the basic read policy but we'll update frontend to use the safe view for anonymous users

-- Grant access to the safe view
GRANT SELECT ON public.public_events_safe TO anon;
GRANT SELECT ON public.public_events_safe TO authenticated;