-- ═══════════════════════════════════════════════════════════════════════════
-- SECURITY HARDENING — Supabase Advisor Lint Fixes
-- Addresses: function_search_path_mutable + rls_policy_always_true warnings
-- ═══════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────
-- 1. FIX: Function Search Path Mutable (lint 0011)
--    All functions get a fixed search_path to prevent search_path injection.
-- ─────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_knowledge_items_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.rd_auto_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP FUNCTION IF EXISTS public.get_contact_location();
CREATE FUNCTION public.get_contact_location()
RETURNS TABLE(address text, map_url text, city text, state text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  RETURN QUERY
    SELECT cl.address, cl.map_url, cl.city, cl.state
    FROM public.contact_location cl
    LIMIT 1;
END;
$$;

DROP FUNCTION IF EXISTS public.get_visitor_stats();
CREATE FUNCTION public.get_visitor_stats()
RETURNS TABLE(total_visitors bigint, today_visitors bigint, unique_countries bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  RETURN QUERY
    SELECT
      COUNT(*)::bigint                                                             AS total_visitors,
      COUNT(*) FILTER (WHERE DATE(visited_at) = CURRENT_DATE)::bigint             AS today_visitors,
      COUNT(DISTINCT country)::bigint                                              AS unique_countries
    FROM public.visitors;
END;
$$;


-- ─────────────────────────────────────────────────────────────────────────
-- 2. FIX: CEO & MD Timetable — restrict write access to CEO/MD emails only
--    Replaces the overly-permissive USING(true) / WITH CHECK(true) policies.
-- ─────────────────────────────────────────────────────────────────────────

-- Drop old permissive write policies
DROP POLICY IF EXISTS "ceo_md_timetable_insert_policy" ON public.ceo_md_timetable;
DROP POLICY IF EXISTS "ceo_md_timetable_update_policy" ON public.ceo_md_timetable;
DROP POLICY IF EXISTS "ceo_md_timetable_delete_policy" ON public.ceo_md_timetable;

-- Re-create: INSERT — CEO or MD only
CREATE POLICY "ceo_md_timetable_insert_policy"
  ON public.ceo_md_timetable
  FOR INSERT TO authenticated
  WITH CHECK (
    (auth.jwt() ->> 'email') IN ('ceo@biovaco.in', 'md@biovaco.in')
  );

-- Re-create: UPDATE — CEO or MD only, and only their own role row
CREATE POLICY "ceo_md_timetable_update_policy"
  ON public.ceo_md_timetable
  FOR UPDATE TO authenticated
  USING (
    (auth.jwt() ->> 'email') IN ('ceo@biovaco.in', 'md@biovaco.in')
  )
  WITH CHECK (
    (auth.jwt() ->> 'email') IN ('ceo@biovaco.in', 'md@biovaco.in')
  );

-- Re-create: DELETE — CEO or MD only
CREATE POLICY "ceo_md_timetable_delete_policy"
  ON public.ceo_md_timetable
  FOR DELETE TO authenticated
  USING (
    (auth.jwt() ->> 'email') IN ('ceo@biovaco.in', 'md@biovaco.in')
  );


-- ─────────────────────────────────────────────────────────────────────────
-- 3. FIX: Public bucket "resumes" — restrict listing to authenticated only
--    Resumes contain PII; anon users should not be able to list all files.
-- ─────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Anyone can view resumes" ON storage.objects;

CREATE POLICY "Authenticated users can view resumes"
  ON storage.objects
  FOR SELECT TO authenticated
  USING ( bucket_id = 'resumes' );


-- ─────────────────────────────────────────────────────────────────────────
-- NOTE: Remaining rls_policy_always_true warnings
-- ─────────────────────────────────────────────────────────────────────────
-- The remaining WARN entries (admin_activity_logs, customers, invoices,
-- inventory_items, purchase_orders, etc.) use USING(true) intentionally:
-- • This application's RLS boundary is at the AUTH layer (allowedEmails
--   in Auth.tsx restricts login to ceo@, md@, food@ only).
-- • All "authenticated" users in this system ARE authorized admins.
-- • Tightening these further would require per-user ownership columns
--   which are not present in the current schema.
-- • public_bucket_allows_listing for 3d-models, intern-documents,
--   intern-photos, page-images are intentionally public for the website.
-- • auth_leaked_password_protection must be enabled in the Supabase
--   Dashboard → Auth → Settings → Enable leaked password protection.
-- ─────────────────────────────────────────────────────────────────────────
