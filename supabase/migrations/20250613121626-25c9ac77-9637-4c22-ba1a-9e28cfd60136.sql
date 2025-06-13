
-- First create the function for updating updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create public_events table for events visible to all users
CREATE TABLE public.public_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_online BOOLEAN NOT NULL DEFAULT false,
  meeting_link TEXT,
  location TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security but allow all authenticated users to read
ALTER TABLE public.public_events ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all authenticated users to view public events
CREATE POLICY "Anyone can view public events" 
  ON public.public_events 
  FOR SELECT 
  TO authenticated
  USING (true);

-- Create the updated_at trigger for public_events
CREATE TRIGGER update_public_events_updated_at 
  BEFORE UPDATE ON public.public_events 
  FOR EACH ROW 
  EXECUTE PROCEDURE update_updated_at_column();

-- Insert some sample public events
INSERT INTO public.public_events (title, description, date, start_time, end_time, is_online, meeting_link, location, notes) VALUES
('Company All-Hands Meeting', 'Monthly company-wide meeting to discuss updates and goals', '2024-06-20', '10:00', '11:00', true, 'https://zoom.us/j/123456789', null, 'Mandatory attendance for all employees'),
('Team Building Workshop', 'Interactive workshop to improve team collaboration and communication', '2024-06-25', '14:00', '17:00', false, null, 'Conference Room A, 3rd Floor', 'Casual dress code encouraged'),
('Product Launch Event', 'Official launch event for our new product line', '2024-06-30', '18:00', '20:00', false, null, 'Main Auditorium', 'Light refreshments will be provided');
