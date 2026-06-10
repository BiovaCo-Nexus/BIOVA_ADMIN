
-- Create table for countdown timer settings
CREATE TABLE public.countdown_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  target_date TIMESTAMP WITH TIME ZONE NOT NULL,
  title TEXT NOT NULL DEFAULT 'Launch Countdown',
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for job positions
CREATE TABLE public.job_positions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  role_key TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  department TEXT NOT NULL,
  location TEXT NOT NULL,
  job_type TEXT NOT NULL DEFAULT 'Full-time',
  description TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.countdown_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_positions ENABLE ROW LEVEL SECURITY;

-- Create policies for countdown_settings
CREATE POLICY "Anyone can view countdown settings" 
  ON public.countdown_settings 
  FOR SELECT 
  USING (true);

CREATE POLICY "Anyone can manage countdown settings" 
  ON public.countdown_settings 
  FOR ALL 
  USING (true);

-- Create policies for job_positions
CREATE POLICY "Anyone can view active job positions" 
  ON public.job_positions 
  FOR SELECT 
  USING (true);

CREATE POLICY "Anyone can manage job positions" 
  ON public.job_positions 
  FOR ALL 
  USING (true);

-- Insert default countdown setting
INSERT INTO public.countdown_settings (target_date, title, description) 
VALUES ('2025-08-22T00:00:00+00:00', 'Launch Countdown', 'MittiMitra launching soon');

-- Insert default job positions
INSERT INTO public.job_positions (role_key, title, department, location, job_type, description, display_order) VALUES
('embedded_system', 'Embedded System Engineer', 'Engineering', 'Nagpur, Maharashtra', 'Full-time', 'Design and develop embedded systems for agricultural IoT devices.', 1),
('software_developer', 'Software Developer', 'Engineering', 'Remote', 'Full-time', 'Build scalable web applications and mobile solutions.', 2),
('iot_handler', 'IoT Handler', 'Technology', 'Nagpur, Maharashtra', 'Full-time', 'Manage IoT infrastructure and data processing systems.', 3),
('circuit_designer', 'Circuit Designer', 'Hardware', 'Nagpur, Maharashtra', 'Full-time', 'Design electrical circuits for agricultural enhancement systems.', 4),
('3d_modeler', '3D Modeler', 'Design', 'Remote', 'Contract', 'Create 3D models and prototypes for product development.', 5),
('graphic_designer', 'Graphic Designer', 'Marketing', 'Remote', 'Part-time', 'Design visual content for marketing and product materials.', 6);

-- Add triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_countdown_settings_updated_at 
    BEFORE UPDATE ON countdown_settings 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_job_positions_updated_at 
    BEFORE UPDATE ON job_positions 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
