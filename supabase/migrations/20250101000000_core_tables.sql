-- Create core tables missing from the later migrations

CREATE TABLE IF NOT EXISTS public.job_applications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id text UNIQUE,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  role text NOT NULL,
  experience_years integer NOT NULL,
  skills text,
  cover_letter text,
  resume_url text,
  pdf_url text,
  status text DEFAULT 'submitted',
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.application_status_history (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id text NOT NULL REFERENCES public.job_applications(application_id) ON DELETE CASCADE,
  status text NOT NULL,
  notes text,
  changed_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.marketing_posts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  content text NOT NULL,
  image_url text,
  tags text[],
  is_published boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);


CREATE TABLE IF NOT EXISTS public.newsletter_subscriptions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text UNIQUE NOT NULL,
  confirmed boolean DEFAULT false NOT NULL,
  confirmation_token text,
  subscribed_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.contact_location (
  id serial PRIMARY KEY,
  address text NOT NULL,
  city text NOT NULL,
  state text NOT NULL,
  country text NOT NULL,
  postal_code text,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);


CREATE TABLE IF NOT EXISTS public.maintenance_settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  is_maintenance_mode boolean DEFAULT false,
  maintenance_title text,
  maintenance_message text,
  estimated_completion timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Note: The generate_application_id function was missing which caused errors in a later migration.
CREATE OR REPLACE FUNCTION public.generate_application_id()
RETURNS trigger AS $$
BEGIN
  -- Simple ID generation: APP-YYYYMMDD-XXXX
  NEW.application_id := 'APP-' || to_char(now(), 'YYYYMMDD') || '-' || lpad(floor(random() * 10000)::text, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_generate_application_id ON public.job_applications;
CREATE TRIGGER tr_generate_application_id
  BEFORE INSERT ON public.job_applications
  FOR EACH ROW
  WHEN (NEW.application_id IS NULL)
  EXECUTE FUNCTION public.generate_application_id();
