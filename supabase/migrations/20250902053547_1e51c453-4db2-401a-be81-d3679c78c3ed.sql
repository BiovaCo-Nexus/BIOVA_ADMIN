-- Create storage bucket for 3D models
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('3d-models', '3d-models', true, 52428800, ARRAY['model/gltf-binary', 'model/gltf+json', 'application/octet-stream', 'model/stl', 'model/step', 'model/obj']);

-- Create 3D models table
CREATE TABLE public.model_3d (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  thumbnail_url TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.model_3d ENABLE ROW LEVEL SECURITY;

-- Create policies for 3D models
CREATE POLICY "Anyone can view active 3D models" 
ON public.model_3d 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Authenticated users can manage 3D models" 
ON public.model_3d 
FOR ALL 
USING (auth.uid() IS NOT NULL);



-- Create storage policies for 3D models bucket
CREATE POLICY "3D models are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = '3d-models');

CREATE POLICY "Authenticated users can upload 3D models" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = '3d-models' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update 3D models" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = '3d-models' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete 3D models" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = '3d-models' AND auth.uid() IS NOT NULL);

-- Create trigger for updated_at
CREATE TRIGGER update_model_3d_updated_at
BEFORE UPDATE ON public.model_3d
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();