-- ═══════════════════════════════════════════════════════════════════
-- Shared Files & Document Management Portal — Database Schema
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.shared_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  file_type TEXT NOT NULL DEFAULT 'drive_link', -- 'drive_link', 'investor_doc', 'contact_sheet', 'specification', 'other'
  url TEXT DEFAULT '',
  investor_name TEXT DEFAULT '',
  contact_number TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  uploaded_by TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.shared_files ENABLE ROW LEVEL SECURITY;

-- Open CRUD access for ALL authenticated portal users (CEO, MD, Food Tech, Interns)
CREATE POLICY "authenticated_select_shared_files" ON public.shared_files
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "authenticated_insert_shared_files" ON public.shared_files
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "authenticated_update_shared_files" ON public.shared_files
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "authenticated_delete_shared_files" ON public.shared_files
  FOR DELETE TO authenticated
  USING (true);

-- Auto-update trigger for updated_at
DROP TRIGGER IF EXISTS trg_updated_at_shared_files ON public.shared_files;
CREATE TRIGGER trg_updated_at_shared_files BEFORE UPDATE ON public.shared_files
  FOR EACH ROW EXECUTE FUNCTION public.rd_auto_updated_at();
