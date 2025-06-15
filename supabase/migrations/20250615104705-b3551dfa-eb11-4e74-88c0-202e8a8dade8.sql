
-- Add user_id column to public_events table to track who created each event
ALTER TABLE public.public_events 
ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update existing public events to have a null user_id (since we don't know who created them)
-- New events will have the proper user_id set

-- Create RLS policy to allow users to update only their own public events
CREATE POLICY "Users can update their own public events" 
  ON public.public_events 
  FOR UPDATE 
  TO authenticated
  USING (auth.uid() = user_id);

-- Update the existing insert policy to ensure user_id is set correctly
DROP POLICY IF EXISTS "Authenticated users can create public events" ON public.public_events;
CREATE POLICY "Authenticated users can create public events" 
  ON public.public_events 
  FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to delete their own public events
CREATE POLICY "Users can delete their own public events" 
  ON public.public_events 
  FOR DELETE 
  TO authenticated
  USING (auth.uid() = user_id);
