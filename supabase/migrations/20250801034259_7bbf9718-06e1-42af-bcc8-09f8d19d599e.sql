-- Create table for managing website videos
CREATE TABLE public.website_videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  title TEXT NOT NULL,
  embed_url TEXT NOT NULL,
  video_type TEXT NOT NULL DEFAULT 'story', -- 'hero', 'story', 'intro'
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  description TEXT
);

-- Enable RLS
ALTER TABLE public.website_videos ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Videos are viewable by everyone" 
ON public.website_videos 
FOR SELECT 
USING (is_active = true);

-- Create policies for admin management (no auth required for demo)
CREATE POLICY "Anyone can manage videos" 
ON public.website_videos 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create function for updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_website_videos_updated_at
  BEFORE UPDATE ON public.website_videos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();