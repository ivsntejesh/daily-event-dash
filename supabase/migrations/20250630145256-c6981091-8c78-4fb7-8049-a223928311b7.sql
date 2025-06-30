
-- Create private tasks table (similar to events table)
CREATE TABLE public.tasks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  date date NOT NULL,
  start_time time without time zone,
  end_time time without time zone,
  is_completed boolean NOT NULL DEFAULT false,
  priority text CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create public tasks table (similar to public_events table)
CREATE TABLE public.public_tasks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid,
  title text NOT NULL,
  description text,
  date date NOT NULL,
  start_time time without time zone,
  end_time time without time zone,
  is_completed boolean NOT NULL DEFAULT false,
  priority text CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable Row Level Security for private tasks
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for private tasks (users can only access their own tasks)
CREATE POLICY "Users can view their own tasks" 
  ON public.tasks 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tasks" 
  ON public.tasks 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks" 
  ON public.tasks 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tasks" 
  ON public.tasks 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Enable Row Level Security for public tasks
ALTER TABLE public.public_tasks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for public tasks (everyone can view, only creators can modify)
CREATE POLICY "Anyone can view public tasks" 
  ON public.public_tasks 
  FOR SELECT 
  USING (true);

CREATE POLICY "Authenticated users can create public tasks" 
  ON public.public_tasks 
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own public tasks" 
  ON public.public_tasks 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own public tasks" 
  ON public.public_tasks 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Add updated_at triggers for both tables
CREATE TRIGGER update_tasks_updated_at 
  BEFORE UPDATE ON public.tasks 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_public_tasks_updated_at 
  BEFORE UPDATE ON public.public_tasks 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
