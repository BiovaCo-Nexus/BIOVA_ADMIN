-- Knowledge Tracker table for system and market knowledge management
CREATE TABLE IF NOT EXISTS public.knowledge_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  category TEXT NOT NULL DEFAULT 'system',
  priority TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'pending',
  source TEXT DEFAULT '',
  validation_notes TEXT DEFAULT '',
  due_date TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.knowledge_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first (idempotent)
DROP POLICY IF EXISTS "Authenticated users can view knowledge items" ON public.knowledge_items;
DROP POLICY IF EXISTS "Authenticated users can insert knowledge items" ON public.knowledge_items;
DROP POLICY IF EXISTS "Authenticated users can update knowledge items" ON public.knowledge_items;
DROP POLICY IF EXISTS "Authenticated users can delete knowledge items" ON public.knowledge_items;

-- Allow authenticated users full CRUD
CREATE POLICY "Authenticated users can view knowledge items"
  ON public.knowledge_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert knowledge items"
  ON public.knowledge_items FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update knowledge items"
  ON public.knowledge_items FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete knowledge items"
  ON public.knowledge_items FOR DELETE
  TO authenticated
  USING (true);

-- Auto-update updated_at on row change
CREATE OR REPLACE FUNCTION public.update_knowledge_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_knowledge_items_updated_at ON public.knowledge_items;

CREATE TRIGGER trigger_update_knowledge_items_updated_at
  BEFORE UPDATE ON public.knowledge_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_knowledge_items_updated_at();
