-- 1. Add assignment and ownership columns
ALTER TABLE public.knowledge_items 
ADD COLUMN IF NOT EXISTS created_by TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS assigned_to TEXT DEFAULT '';

-- 2. Update RLS policies for strict assignment security
ALTER TABLE public.knowledge_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view knowledge items" ON public.knowledge_items;
DROP POLICY IF EXISTS "Authenticated users can insert knowledge items" ON public.knowledge_items;
DROP POLICY IF EXISTS "Authenticated users can update knowledge items" ON public.knowledge_items;
DROP POLICY IF EXISTS "Authenticated users can delete knowledge items" ON public.knowledge_items;

-- CEO and MD can see everything. 
-- Regular users (like food@biovaco.in) can only see items they created or items explicitly assigned to them.
CREATE POLICY "knowledge_select_policy" 
  ON public.knowledge_items FOR SELECT 
  TO authenticated 
  USING (
    (auth.jwt() ->> 'email' = 'ceo@biovaco.in') OR 
    (auth.jwt() ->> 'email' = 'md@biovaco.in') OR 
    (created_by = auth.jwt() ->> 'email') OR 
    (assigned_to = auth.jwt() ->> 'email')
  );

-- Anyone authenticated can insert, but they must be logged in.
CREATE POLICY "knowledge_insert_policy" 
  ON public.knowledge_items FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

-- CEO and MD can update anything.
-- Regular users can only update items they created or are assigned to them.
CREATE POLICY "knowledge_update_policy" 
  ON public.knowledge_items FOR UPDATE 
  TO authenticated 
  USING (
    (auth.jwt() ->> 'email' = 'ceo@biovaco.in') OR 
    (auth.jwt() ->> 'email' = 'md@biovaco.in') OR 
    (created_by = auth.jwt() ->> 'email') OR 
    (assigned_to = auth.jwt() ->> 'email')
  )
  WITH CHECK (true);

-- Only CEO, MD, or the creator can delete.
CREATE POLICY "knowledge_delete_policy" 
  ON public.knowledge_items FOR DELETE 
  TO authenticated 
  USING (
    (auth.jwt() ->> 'email' = 'ceo@biovaco.in') OR 
    (auth.jwt() ->> 'email' = 'md@biovaco.in') OR 
    (created_by = auth.jwt() ->> 'email')
  );
