BEGIN;

-- Disable RLS temporarily to prevent deadlocks
ALTER TABLE public.knowledge_items DISABLE ROW LEVEL SECURITY;

-- Drop existing policies safely
DROP POLICY IF EXISTS "knowledge_select_policy" ON public.knowledge_items;
DROP POLICY IF EXISTS "knowledge_insert_policy" ON public.knowledge_items;
DROP POLICY IF EXISTS "knowledge_update_policy" ON public.knowledge_items;
DROP POLICY IF EXISTS "knowledge_delete_policy" ON public.knowledge_items;

-- Create correct policies that support comma-separated assigned_to field and give admins full access
CREATE POLICY "knowledge_select_policy" 
  ON public.knowledge_items FOR SELECT 
  TO authenticated 
  USING (
    (auth.jwt() ->> 'email' IN ('ceo@biovaco.in', 'md@biovaco.in')) OR
    (created_by = auth.jwt() ->> 'email') OR 
    (assigned_to LIKE '%' || (auth.jwt() ->> 'email') || '%')
  );

CREATE POLICY "knowledge_insert_policy" 
  ON public.knowledge_items FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

CREATE POLICY "knowledge_update_policy" 
  ON public.knowledge_items FOR UPDATE 
  TO authenticated 
  USING (
    (auth.jwt() ->> 'email' IN ('ceo@biovaco.in', 'md@biovaco.in')) OR
    (created_by = auth.jwt() ->> 'email') OR 
    (assigned_to LIKE '%' || (auth.jwt() ->> 'email') || '%')
  )
  WITH CHECK (true);

CREATE POLICY "knowledge_delete_policy" 
  ON public.knowledge_items FOR DELETE 
  TO authenticated 
  USING (
    (auth.jwt() ->> 'email' IN ('ceo@biovaco.in', 'md@biovaco.in')) OR
    (created_by = auth.jwt() ->> 'email')
  );

-- Re-enable RLS
ALTER TABLE public.knowledge_items ENABLE ROW LEVEL SECURITY;

COMMIT;
