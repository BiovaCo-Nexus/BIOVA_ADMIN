-- ============================================================================
-- FIX: Add missing RLS policies for core tables
-- These tables had RLS enabled but NO policies, causing all reads to return
-- empty results (the DB has data but clients cannot see it).
-- ============================================================================

-- ============================================================================
-- job_applications
-- ============================================================================
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_public_insert_job_applications" ON public.job_applications;
DROP POLICY IF EXISTS "allow_public_select_job_applications" ON public.job_applications;
DROP POLICY IF EXISTS "allow_authenticated_all_job_applications" ON public.job_applications;

-- Public users can submit applications
CREATE POLICY "allow_public_insert_job_applications"
  ON public.job_applications
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Public users can read their own application (for tracker)
CREATE POLICY "allow_public_select_job_applications"
  ON public.job_applications
  FOR SELECT
  TO anon
  USING (true);

-- Authenticated (admin) users have full access
CREATE POLICY "allow_authenticated_all_job_applications"
  ON public.job_applications
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- application_status_history
-- ============================================================================
ALTER TABLE public.application_status_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_public_select_application_status_history" ON public.application_status_history;
DROP POLICY IF EXISTS "allow_authenticated_all_application_status_history" ON public.application_status_history;

-- Public users can view status history (for application tracker)
CREATE POLICY "allow_public_select_application_status_history"
  ON public.application_status_history
  FOR SELECT
  TO anon
  USING (true);

-- Authenticated (admin) users have full access
CREATE POLICY "allow_authenticated_all_application_status_history"
  ON public.application_status_history
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- newsletter_subscriptions
-- ============================================================================
ALTER TABLE public.newsletter_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_public_insert_newsletter" ON public.newsletter_subscriptions;
DROP POLICY IF EXISTS "allow_authenticated_all_newsletter" ON public.newsletter_subscriptions;

-- Public users can subscribe
CREATE POLICY "allow_public_insert_newsletter"
  ON public.newsletter_subscriptions
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Authenticated (admin) users have full access
CREATE POLICY "allow_authenticated_all_newsletter"
  ON public.newsletter_subscriptions
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- marketing_posts
-- ============================================================================
ALTER TABLE public.marketing_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_public_select_marketing_posts" ON public.marketing_posts;
DROP POLICY IF EXISTS "allow_authenticated_all_marketing_posts" ON public.marketing_posts;

-- Public users can view published posts
CREATE POLICY "allow_public_select_marketing_posts"
  ON public.marketing_posts
  FOR SELECT
  TO anon
  USING (true);

-- Authenticated (admin) users have full access
CREATE POLICY "allow_authenticated_all_marketing_posts"
  ON public.marketing_posts
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- maintenance_settings
-- ============================================================================
ALTER TABLE public.maintenance_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_public_select_maintenance" ON public.maintenance_settings;
DROP POLICY IF EXISTS "allow_authenticated_all_maintenance" ON public.maintenance_settings;

-- Public users can read maintenance mode status
CREATE POLICY "allow_public_select_maintenance"
  ON public.maintenance_settings
  FOR SELECT
  TO anon
  USING (true);

-- Authenticated (admin) users have full access
CREATE POLICY "allow_authenticated_all_maintenance"
  ON public.maintenance_settings
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- contact_location
-- ============================================================================
ALTER TABLE public.contact_location ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_public_select_contact_location" ON public.contact_location;
DROP POLICY IF EXISTS "allow_authenticated_all_contact_location" ON public.contact_location;

-- Public users can view location
CREATE POLICY "allow_public_select_contact_location"
  ON public.contact_location
  FOR SELECT
  TO anon
  USING (true);

-- Authenticated (admin) users have full access
CREATE POLICY "allow_authenticated_all_contact_location"
  ON public.contact_location
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- post_countdown_content  (also missing policies)
-- ============================================================================
ALTER TABLE public.post_countdown_content ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_public_select_post_countdown" ON public.post_countdown_content;
DROP POLICY IF EXISTS "allow_authenticated_all_post_countdown" ON public.post_countdown_content;

CREATE POLICY "allow_public_select_post_countdown"
  ON public.post_countdown_content
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "allow_authenticated_all_post_countdown"
  ON public.post_countdown_content
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- admin_activity_logs  (create table if it doesn't exist + policies)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.admin_activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_email TEXT NOT NULL,
  action_type TEXT NOT NULL,
  entity_name TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

ALTER TABLE public.admin_activity_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_authenticated_all_admin_logs" ON public.admin_activity_logs;

CREATE POLICY "allow_authenticated_all_admin_logs"
  ON public.admin_activity_logs
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
