
-- Drop existing policies if they exist and recreate them to ensure consistency
DROP POLICY IF EXISTS "Anyone can view public events" ON public.public_events;
DROP POLICY IF EXISTS "Authenticated users can create public events" ON public.public_events;
DROP POLICY IF EXISTS "Authenticated users can update public events" ON public.public_events;
DROP POLICY IF EXISTS "Authenticated users can delete public events" ON public.public_events;

-- Create policy to allow anonymous users to view public events
CREATE POLICY "Anyone can view public events" 
  ON public.public_events 
  FOR SELECT 
  TO anon, authenticated
  USING (true);

-- Create policy to allow authenticated users to create public events
CREATE POLICY "Authenticated users can create public events" 
  ON public.public_events 
  FOR INSERT 
  TO authenticated
  WITH CHECK (true);

-- Create policy to allow authenticated users to update public events
CREATE POLICY "Authenticated users can update public events" 
  ON public.public_events 
  FOR UPDATE 
  TO authenticated
  USING (true);

-- Create policy to allow authenticated users to delete public events
CREATE POLICY "Authenticated users can delete public events" 
  ON public.public_events 
  FOR DELETE 
  TO authenticated
  USING (true);
