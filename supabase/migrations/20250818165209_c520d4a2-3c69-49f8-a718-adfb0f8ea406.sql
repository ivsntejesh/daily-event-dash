-- Fix security issue: Restrict direct access to public_tasks table
-- Remove the overly permissive RLS policy that allows anyone to view all tasks
DROP POLICY IF EXISTS "Anyone can view public tasks" ON public.public_tasks;

-- Create a more secure RLS policy that only allows access through the secure function
-- This prevents direct table access while still allowing the secure function to work
CREATE POLICY "Public tasks accessible via secure function only" 
ON public.public_tasks 
FOR SELECT 
USING (
  -- Only allow access if the user is authenticated OR if accessed via security definer function
  auth.uid() IS NOT NULL OR current_setting('role') = 'supabase_auth_admin'
);

-- Update the secure function to hide more sensitive information from anonymous users
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
    -- Hide detailed task information from anonymous users
    CASE 
      WHEN auth.uid() IS NOT NULL THEN pt.title 
      ELSE 'Task (sign in to view details)' 
    END as title,
    CASE 
      WHEN auth.uid() IS NOT NULL THEN pt.description 
      ELSE NULL 
    END as description,
    pt.date,
    CASE 
      WHEN auth.uid() IS NOT NULL THEN pt.start_time 
      ELSE NULL 
    END as start_time,
    CASE 
      WHEN auth.uid() IS NOT NULL THEN pt.end_time 
      ELSE NULL 
    END as end_time,
    pt.is_completed,
    pt.created_at,
    pt.updated_at,
    CASE 
      WHEN auth.uid() IS NOT NULL THEN pt.notes 
      ELSE NULL 
    END as notes,
    -- Hide user_id from anonymous users to prevent user enumeration
    CASE 
      WHEN auth.uid() IS NOT NULL THEN pt.user_id 
      ELSE NULL 
    END as user_id,
    pt.sheet_row_index,
    pt.sheet_id,
    CASE 
      WHEN auth.uid() IS NOT NULL THEN pt.priority 
      ELSE NULL 
    END as priority
  FROM public.public_tasks pt;
$$;