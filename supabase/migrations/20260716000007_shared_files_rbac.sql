-- ═══════════════════════════════════════════════════════════════════
-- Shared Files & Document Management Portal — RBAC Assignment Policies
-- ═══════════════════════════════════════════════════════════════════

-- 1. Add assignment and ownership columns
ALTER TABLE public.shared_files
ADD COLUMN IF NOT EXISTS created_by TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS assigned_to TEXT DEFAULT '';

-- 2. Update RLS policies for strict assignment security
ALTER TABLE public.shared_files ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated_select_shared_files" ON public.shared_files;
DROP POLICY IF EXISTS "authenticated_insert_shared_files" ON public.shared_files;
DROP POLICY IF EXISTS "authenticated_update_shared_files" ON public.shared_files;
DROP POLICY IF EXISTS "authenticated_delete_shared_files" ON public.shared_files;

-- Select: Admins (CEO/MD) can see all. Other users see what they created or what is explicitly assigned to them.
CREATE POLICY "shared_files_select_policy" 
  ON public.shared_files FOR SELECT 
  TO authenticated 
  USING (
    (auth.jwt() ->> 'email' IN ('ceo@biovaco.in', 'md@biovaco.in')) OR
    (created_by = auth.jwt() ->> 'email') OR 
    (assigned_to LIKE '%' || (auth.jwt() ->> 'email') || '%')
  );

-- Insert: Any authenticated user can insert.
CREATE POLICY "shared_files_insert_policy" 
  ON public.shared_files FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

-- Update: Admins can update. Other users can only update what they created or are assigned to them.
CREATE POLICY "shared_files_update_policy" 
  ON public.shared_files FOR UPDATE 
  TO authenticated 
  USING (
    (auth.jwt() ->> 'email' IN ('ceo@biovaco.in', 'md@biovaco.in')) OR
    (created_by = auth.jwt() ->> 'email') OR 
    (assigned_to LIKE '%' || (auth.jwt() ->> 'email') || '%')
  )
  WITH CHECK (true);

-- Delete: Admins or the creator can delete the resource.
CREATE POLICY "shared_files_delete_policy" 
  ON public.shared_files FOR DELETE 
  TO authenticated 
  USING (
    (auth.jwt() ->> 'email' IN ('ceo@biovaco.in', 'md@biovaco.in')) OR
    (created_by = auth.jwt() ->> 'email')
  );
