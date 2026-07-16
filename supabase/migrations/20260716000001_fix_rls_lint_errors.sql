-- Fix RLS disabled warnings for 6 public tables
-- Enables RLS and adds authenticated + anon read policies

-- 1. marketing_post_likes
ALTER TABLE public.marketing_post_likes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read marketing_post_likes" ON public.marketing_post_likes;
DROP POLICY IF EXISTS "Allow authenticated write marketing_post_likes" ON public.marketing_post_likes;
DROP POLICY IF EXISTS "Allow authenticated delete marketing_post_likes" ON public.marketing_post_likes;

CREATE POLICY "Allow public read marketing_post_likes"
  ON public.marketing_post_likes FOR SELECT USING (true);
CREATE POLICY "Allow authenticated write marketing_post_likes"
  ON public.marketing_post_likes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated delete marketing_post_likes"
  ON public.marketing_post_likes FOR DELETE TO authenticated USING (true);

-- 2. marketing_post_comments
ALTER TABLE public.marketing_post_comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read marketing_post_comments" ON public.marketing_post_comments;
DROP POLICY IF EXISTS "Allow authenticated write marketing_post_comments" ON public.marketing_post_comments;
DROP POLICY IF EXISTS "Allow authenticated delete marketing_post_comments" ON public.marketing_post_comments;

CREATE POLICY "Allow public read marketing_post_comments"
  ON public.marketing_post_comments FOR SELECT USING (true);
CREATE POLICY "Allow authenticated write marketing_post_comments"
  ON public.marketing_post_comments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated delete marketing_post_comments"
  ON public.marketing_post_comments FOR DELETE TO authenticated USING (true);

-- 3. database_usage_stats
ALTER TABLE public.database_usage_stats ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated read database_usage_stats" ON public.database_usage_stats;
DROP POLICY IF EXISTS "Allow authenticated write database_usage_stats" ON public.database_usage_stats;
DROP POLICY IF EXISTS "Allow authenticated update database_usage_stats" ON public.database_usage_stats;

CREATE POLICY "Allow authenticated read database_usage_stats"
  ON public.database_usage_stats FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated write database_usage_stats"
  ON public.database_usage_stats FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update database_usage_stats"
  ON public.database_usage_stats FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- 4. festival_posts
ALTER TABLE public.festival_posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read festival_posts" ON public.festival_posts;
DROP POLICY IF EXISTS "Allow authenticated write festival_posts" ON public.festival_posts;
DROP POLICY IF EXISTS "Allow authenticated update festival_posts" ON public.festival_posts;
DROP POLICY IF EXISTS "Allow authenticated delete festival_posts" ON public.festival_posts;

CREATE POLICY "Allow public read festival_posts"
  ON public.festival_posts FOR SELECT USING (true);
CREATE POLICY "Allow authenticated write festival_posts"
  ON public.festival_posts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update festival_posts"
  ON public.festival_posts FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated delete festival_posts"
  ON public.festival_posts FOR DELETE TO authenticated USING (true);

-- 5. post_comments
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read post_comments" ON public.post_comments;
DROP POLICY IF EXISTS "Allow public write post_comments" ON public.post_comments;
DROP POLICY IF EXISTS "Allow authenticated delete post_comments" ON public.post_comments;

CREATE POLICY "Allow public read post_comments"
  ON public.post_comments FOR SELECT USING (true);
CREATE POLICY "Allow public write post_comments"
  ON public.post_comments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow authenticated delete post_comments"
  ON public.post_comments FOR DELETE TO authenticated USING (true);

-- 6. visitors (contains sensitive session_id column)
ALTER TABLE public.visitors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon insert visitors" ON public.visitors;
DROP POLICY IF EXISTS "Allow authenticated read visitors" ON public.visitors;

CREATE POLICY "Allow anon insert visitors"
  ON public.visitors FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow authenticated read visitors"
  ON public.visitors FOR SELECT TO authenticated USING (true);
