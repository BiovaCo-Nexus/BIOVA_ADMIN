-- ═══════════════════════════════════════════════════════════════════
-- Market Research & Business Development — Database Schema
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.rd_market_research (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'market_opportunity', -- 'competitor_intel', 'market_opportunity', 'consulting_advice', 'strategic_idea'
  source_or_consultant TEXT DEFAULT '',
  description TEXT DEFAULT '',
  competitors_pricing TEXT DEFAULT '',
  key_takeaways JSONB NOT NULL DEFAULT '[]'::jsonb,
  action_plan TEXT DEFAULT '',
  estimated_roi TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'under_review', -- 'under_review', 'approved', 'in_progress', 'implemented', 'archived'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.rd_market_research ENABLE ROW LEVEL SECURITY;

-- CEO and MD only access condition
-- Note: MD and CEO can access. Interns/Food managers are excluded from strategic Market Research.
CREATE POLICY "auth_select_market_research" ON public.rd_market_research
  FOR SELECT TO authenticated
  USING (auth.jwt() ->> 'email' = 'ceo@biovaco.in' OR auth.jwt() ->> 'email' = 'md@biovaco.in');

CREATE POLICY "auth_insert_market_research" ON public.rd_market_research
  FOR INSERT TO authenticated
  WITH CHECK (auth.jwt() ->> 'email' = 'ceo@biovaco.in' OR auth.jwt() ->> 'email' = 'md@biovaco.in');

CREATE POLICY "auth_update_market_research" ON public.rd_market_research
  FOR UPDATE TO authenticated
  USING (auth.jwt() ->> 'email' = 'ceo@biovaco.in' OR auth.jwt() ->> 'email' = 'md@biovaco.in')
  WITH CHECK (auth.jwt() ->> 'email' = 'ceo@biovaco.in' OR auth.jwt() ->> 'email' = 'md@biovaco.in');

CREATE POLICY "auth_delete_market_research" ON public.rd_market_research
  FOR DELETE TO authenticated
  USING (auth.jwt() ->> 'email' = 'ceo@biovaco.in' OR auth.jwt() ->> 'email' = 'md@biovaco.in');

-- Auto-update trigger for updated_at
DROP TRIGGER IF EXISTS trg_updated_at_market_research ON public.rd_market_research;
CREATE TRIGGER trg_updated_at_market_research BEFORE UPDATE ON public.rd_market_research
  FOR EACH ROW EXECUTE FUNCTION public.rd_auto_updated_at();
