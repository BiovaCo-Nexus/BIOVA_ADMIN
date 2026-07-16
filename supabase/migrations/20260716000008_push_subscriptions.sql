-- ═══════════════════════════════════════════════════════════════════
-- Push Notifications Subscription — Database Schema
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  subscription JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to manage their push subscriptions
CREATE POLICY "push_subscriptions_select_policy" ON public.push_subscriptions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "push_subscriptions_insert_policy" ON public.push_subscriptions
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "push_subscriptions_update_policy" ON public.push_subscriptions
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "push_subscriptions_delete_policy" ON public.push_subscriptions
  FOR DELETE TO authenticated USING (true);
