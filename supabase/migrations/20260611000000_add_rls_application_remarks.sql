-- Add sender_type column if it doesn't exist
ALTER TABLE public.application_remarks ADD COLUMN IF NOT EXISTS sender_type TEXT;

-- Enable RLS on application_remarks table
ALTER TABLE public.application_remarks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "allow_insert_application_remarks" ON public.application_remarks;
DROP POLICY IF EXISTS "allow_read_application_remarks" ON public.application_remarks;
DROP POLICY IF EXISTS "allow_anon_insert_application_remarks" ON public.application_remarks;
DROP POLICY IF EXISTS "allow_anon_read_application_remarks" ON public.application_remarks;

-- Allow authenticated users to insert
CREATE POLICY "allow_insert_application_remarks" 
  ON public.application_remarks 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

-- Allow authenticated users to read
CREATE POLICY "allow_read_application_remarks" 
  ON public.application_remarks 
  FOR SELECT 
  TO authenticated 
  USING (true);

-- Allow anonymous users to insert (for public applications)
CREATE POLICY "allow_anon_insert_application_remarks" 
  ON public.application_remarks 
  FOR INSERT 
  TO anon 
  WITH CHECK (true);

-- Allow anonymous users to read
CREATE POLICY "allow_anon_read_application_remarks" 
  ON public.application_remarks 
  FOR SELECT 
  TO anon 
  USING (true);
