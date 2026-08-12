-- =====================================================================
-- COMPLETE SUPABASE SQL MIGRATION FOR MARKETING MODULES & STORAGE
-- Copy and run this script in the Supabase SQL Editor (SQL Editor -> New Query)
-- =====================================================================

-- 1. Marketing Ideas & Notepad Table
CREATE TABLE IF NOT EXISTS public.marketing_ideas (
    id TEXT PRIMARY KEY,
    intern_name TEXT NOT NULL,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    target_audience TEXT,
    platform TEXT,
    content TEXT NOT NULL,
    priority TEXT DEFAULT 'Medium',
    status TEXT DEFAULT 'Draft',
    tags TEXT[],
    estimated_budget NUMERIC DEFAULT 0,
    is_pinned BOOLEAN DEFAULT FALSE,
    color TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.marketing_ideas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow All Access marketing_ideas" ON public.marketing_ideas;
CREATE POLICY "Allow All Access marketing_ideas" ON public.marketing_ideas FOR ALL USING (true) WITH CHECK (true);

-- 2. Legacy Marketing Campaigns Table
CREATE TABLE IF NOT EXISTS public.marketing_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    channel TEXT,
    budget NUMERIC DEFAULT 0,
    leads_generated NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'Active',
    target_audience TEXT,
    start_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.marketing_campaigns ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow All Access marketing_campaigns" ON public.marketing_campaigns;
CREATE POLICY "Allow All Access marketing_campaigns" ON public.marketing_campaigns FOR ALL USING (true) WITH CHECK (true);

-- 3. Marketing Posts Table
CREATE TABLE IF NOT EXISTS public.marketing_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    image_url TEXT,
    tags TEXT[],
    is_published BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.marketing_posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow All Access marketing_posts" ON public.marketing_posts;
CREATE POLICY "Allow All Access marketing_posts" ON public.marketing_posts FOR ALL USING (true) WITH CHECK (true);

-- 4. Strategy Campaigns Table (mkt_campaigns)
CREATE TABLE IF NOT EXISTS public.mkt_campaigns (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    goal TEXT,
    target_audience TEXT,
    content_pillars TEXT[],
    platforms TEXT[],
    key_messages TEXT,
    kpis TEXT[],
    start_date DATE,
    end_date DATE,
    budget NUMERIC DEFAULT 0,
    priority TEXT DEFAULT 'Medium',
    status TEXT DEFAULT 'Active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.mkt_campaigns ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow All Access mkt_campaigns" ON public.mkt_campaigns;
CREATE POLICY "Allow All Access mkt_campaigns" ON public.mkt_campaigns FOR ALL USING (true) WITH CHECK (true);

-- 5. Content Calendar Items Table (mkt_content_items)
CREATE TABLE IF NOT EXISTS public.mkt_content_items (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    date DATE,
    platform TEXT NOT NULL,
    content_type TEXT NOT NULL,
    campaign_id TEXT,
    content_pillar TEXT,
    content_idea TEXT,
    caption TEXT,
    cta TEXT,
    assigned_person TEXT,
    status TEXT DEFAULT 'Draft',
    creative_asset_id TEXT,
    approval_status TEXT DEFAULT 'Pending',
    publishing_date DATE,
    reach NUMERIC DEFAULT 0,
    impressions NUMERIC DEFAULT 0,
    engagement NUMERIC DEFAULT 0,
    clicks NUMERIC DEFAULT 0,
    conversions NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.mkt_content_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow All Access mkt_content_items" ON public.mkt_content_items;
CREATE POLICY "Allow All Access mkt_content_items" ON public.mkt_content_items FOR ALL USING (true) WITH CHECK (true);

-- 6. Creative Assets Library Table (mkt_creative_assets)
CREATE TABLE IF NOT EXISTS public.mkt_creative_assets (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    preview_url TEXT,
    asset_type TEXT NOT NULL,
    campaign_id TEXT,
    product TEXT,
    version TEXT DEFAULT 'v1',
    created_by TEXT,
    upload_date DATE DEFAULT CURRENT_DATE,
    status TEXT DEFAULT 'Approved',
    used_in_content_ids TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.mkt_creative_assets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow All Access mkt_creative_assets" ON public.mkt_creative_assets;
CREATE POLICY "Allow All Access mkt_creative_assets" ON public.mkt_creative_assets FOR ALL USING (true) WITH CHECK (true);

-- 7. Newsletter Subscriptions Table
CREATE TABLE IF NOT EXISTS public.newsletter_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    confirmed BOOLEAN DEFAULT TRUE,
    subscribed_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.newsletter_subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow All Access newsletter_subscriptions" ON public.newsletter_subscriptions;
CREATE POLICY "Allow All Access newsletter_subscriptions" ON public.newsletter_subscriptions FOR ALL USING (true) WITH CHECK (true);

-- 8. Supabase Storage Bucket for 'marketing_assets'
INSERT INTO storage.buckets (id, name, public)
VALUES ('marketing_assets', 'marketing_assets', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public Read marketing_assets" ON storage.objects;
CREATE POLICY "Public Read marketing_assets" ON storage.objects FOR SELECT USING (bucket_id = 'marketing_assets');

DROP POLICY IF EXISTS "Public Upload marketing_assets" ON storage.objects;
CREATE POLICY "Public Upload marketing_assets" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'marketing_assets');

DROP POLICY IF EXISTS "Public Update marketing_assets" ON storage.objects;
CREATE POLICY "Public Update marketing_assets" ON storage.objects FOR UPDATE WITH CHECK (bucket_id = 'marketing_assets');
