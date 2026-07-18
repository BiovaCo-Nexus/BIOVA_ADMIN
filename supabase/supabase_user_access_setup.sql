-- ================================================================
-- USER PAGE ACCESS MANAGEMENT TABLE
-- Run this SQL in your Supabase SQL Editor (Dashboard > SQL Editor)
-- ================================================================

-- 1. Create the table
CREATE TABLE IF NOT EXISTS public.user_page_access (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email TEXT NOT NULL,
  user_label TEXT NOT NULL DEFAULT '',           -- Friendly name like "Food Tech", "R&D Head"
  allowed_pages TEXT[] NOT NULL DEFAULT '{}',    -- Array of page tab IDs
  default_tab TEXT DEFAULT NULL,                 -- Which tab to open by default
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_email)
);

-- 2. Enable RLS
ALTER TABLE public.user_page_access ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies — Only CEO/MD can manage, all authenticated can read their own
CREATE POLICY "CEO and MD can manage all access rules"
  ON public.user_page_access
  FOR ALL
  USING (
    (SELECT auth.jwt() ->> 'email') IN ('ceo@biovaco.in', 'md@biovaco.in')
  )
  WITH CHECK (
    (SELECT auth.jwt() ->> 'email') IN ('ceo@biovaco.in', 'md@biovaco.in')
  );

CREATE POLICY "Users can read their own access"
  ON public.user_page_access
  FOR SELECT
  USING (
    user_email = (SELECT auth.jwt() ->> 'email')
  );

-- 4. Seed existing access rules (migrate from hardcoded logic)
INSERT INTO public.user_page_access (user_email, user_label, allowed_pages, default_tab) VALUES
  ('food@biovaco.in', 'Food Tech', ARRAY['rdlab', 'knowledge', 'shared_files'], 'rdlab')
ON CONFLICT (user_email) DO NOTHING;

-- 5. Auto-update timestamp trigger
CREATE OR REPLACE FUNCTION public.update_user_page_access_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_user_page_access_timestamp
  BEFORE UPDATE ON public.user_page_access
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_page_access_updated_at();

-- Done! Now CEO/MD can manage access from the admin panel.
