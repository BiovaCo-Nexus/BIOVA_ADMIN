-- Create profiles table for user management
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL UNIQUE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'admin',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles (only allow specific email)
CREATE POLICY "Only specific email can access profiles" 
ON public.profiles 
FOR ALL 
USING (email = 'electroculture22@gmail.com');

-- Create interns table
CREATE TABLE public.interns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  contact TEXT,
  college TEXT,
  branch TEXT,
  year TEXT,
  project_department TEXT,
  joining_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Completed', 'Terminated')),
  offer_letter_url TEXT,
  id_proof_url TEXT,
  photo_url TEXT,
  position TEXT DEFAULT 'Intern',
  bio TEXT,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on interns
ALTER TABLE public.interns ENABLE ROW LEVEL SECURITY;

-- Create policies for interns
CREATE POLICY "Anyone can view interns" 
ON public.interns 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can manage interns" 
ON public.interns 
FOR ALL 
USING (auth.uid() IS NOT NULL);

-- Create tasks table
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  intern_id UUID REFERENCES public.interns(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  deadline DATE,
  status TEXT DEFAULT 'To-do' CHECK (status IN ('To-do', 'In Progress', 'Completed')),
  priority TEXT DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High')),
  attachment_url TEXT,
  comments TEXT,
  assigned_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on tasks
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Create policies for tasks
CREATE POLICY "Anyone can view tasks" 
ON public.tasks 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can manage tasks" 
ON public.tasks 
FOR ALL 
USING (auth.uid() IS NOT NULL);

-- Create page_content table for dynamic content
CREATE TABLE public.page_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_name TEXT NOT NULL UNIQUE,
  title TEXT,
  description TEXT,
  content JSONB,
  images JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on page_content
ALTER TABLE public.page_content ENABLE ROW LEVEL SECURITY;

-- Create policies for page_content
CREATE POLICY "Anyone can view page content" 
ON public.page_content 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can manage page content" 
ON public.page_content 
FOR ALL 
USING (auth.uid() IS NOT NULL);

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('intern-documents', 'intern-documents', true),
  ('intern-photos', 'intern-photos', true),
  ('page-images', 'page-images', true);

-- Create storage policies
CREATE POLICY "Anyone can view intern documents" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'intern-documents');

CREATE POLICY "Authenticated users can upload intern documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'intern-documents' AND auth.uid() IS NOT NULL);

CREATE POLICY "Anyone can view intern photos" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'intern-photos');

CREATE POLICY "Authenticated users can upload intern photos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'intern-photos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Anyone can view page images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'page-images');

CREATE POLICY "Authenticated users can upload page images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'page-images' AND auth.uid() IS NOT NULL);

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_interns_updated_at
BEFORE UPDATE ON public.interns
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
BEFORE UPDATE ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_page_content_updated_at
BEFORE UPDATE ON public.page_content
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial data for our-story page
INSERT INTO public.page_content (page_name, title, description, content) 
VALUES (
  'our-story',
  'Our Story',
  'Discover the journey behind ElectroCulture and the passionate team making it happen.',
  '{"sections": [{"type": "story", "title": "Our Journey", "content": "ElectroCulture was founded with a vision to revolutionize agriculture through innovative technology."}, {"type": "story", "title": "Innovation in Agriculture", "content": "We believe that the future of agriculture lies in the perfect harmony between technology and nature."}]}'
);