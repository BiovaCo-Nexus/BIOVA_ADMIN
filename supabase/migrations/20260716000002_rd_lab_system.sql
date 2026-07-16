-- ═══════════════════════════════════════════════════════════════════
-- R&D Lab & Manufacturing Management System — Database Schema
-- 12 tables with RLS, triggers, and relationships
-- ═══════════════════════════════════════════════════════════════════

-- ─── 1. Recipes ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.rd_recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_name TEXT NOT NULL,
  version TEXT NOT NULL DEFAULT 'V1.0',
  category TEXT NOT NULL DEFAULT 'Seasoning',
  batch_size TEXT DEFAULT '',
  ingredients JSONB NOT NULL DEFAULT '[]'::jsonb,
  steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  mixing_sequence TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  cost_per_batch NUMERIC(12,2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── 2. Batch Trials ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.rd_batch_trials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trial_no TEXT NOT NULL,
  recipe_id UUID REFERENCES public.rd_recipes(id) ON DELETE SET NULL,
  recipe_version TEXT DEFAULT '',
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  made_by TEXT NOT NULL DEFAULT '',
  taste_score INTEGER DEFAULT 0 CHECK (taste_score >= 0 AND taste_score <= 10),
  aroma_score INTEGER DEFAULT 0 CHECK (aroma_score >= 0 AND aroma_score <= 10),
  color_score INTEGER DEFAULT 0 CHECK (color_score >= 0 AND color_score <= 10),
  texture_score INTEGER DEFAULT 0 CHECK (texture_score >= 0 AND texture_score <= 10),
  problems TEXT DEFAULT '',
  final_decision TEXT DEFAULT 'pending',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── 3. Raw Materials ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.rd_raw_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  supplier TEXT DEFAULT '',
  cost_per_kg NUMERIC(10,2) DEFAULT 0,
  moq TEXT DEFAULT '',
  shelf_life TEXT DEFAULT '',
  fssai_category TEXT DEFAULT '',
  coa_url TEXT DEFAULT '',
  specifications JSONB NOT NULL DEFAULT '{}'::jsonb,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── 4. Ingredient Inventory ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.rd_ingredient_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id UUID REFERENCES public.rd_raw_materials(id) ON DELETE CASCADE,
  material_name TEXT NOT NULL,
  available_qty NUMERIC(10,2) DEFAULT 0,
  unit TEXT DEFAULT 'kg',
  reorder_level NUMERIC(10,2) DEFAULT 0,
  expiry_date DATE,
  batch_number TEXT DEFAULT '',
  supplier TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── 5. Product Testing ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.rd_product_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_name TEXT NOT NULL,
  batch_trial_id UUID REFERENCES public.rd_batch_trials(id) ON DELETE SET NULL,
  taste INTEGER DEFAULT 0 CHECK (taste >= 0 AND taste <= 10),
  aroma INTEGER DEFAULT 0 CHECK (aroma >= 0 AND aroma <= 10),
  color INTEGER DEFAULT 0 CHECK (color >= 0 AND color <= 10),
  mouthfeel INTEGER DEFAULT 0 CHECK (mouthfeel >= 0 AND mouthfeel <= 10),
  dissolution INTEGER DEFAULT 0 CHECK (dissolution >= 0 AND dissolution <= 10),
  coating_quality INTEGER DEFAULT 0 CHECK (coating_quality >= 0 AND coating_quality <= 10),
  tester TEXT DEFAULT '',
  test_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── 6. Shelf Life Testing ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.rd_shelf_life_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product TEXT NOT NULL,
  batch TEXT DEFAULT '',
  packaging TEXT DEFAULT '',
  temperature TEXT DEFAULT '',
  humidity TEXT DEFAULT '',
  observations JSONB NOT NULL DEFAULT '{}'::jsonb,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'running',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── 7. QC Checklists ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.rd_qc_checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id TEXT NOT NULL,
  product_name TEXT DEFAULT '',
  moisture BOOLEAN DEFAULT false,
  weight_check BOOLEAN DEFAULT false,
  seal_quality BOOLEAN DEFAULT false,
  metal_detection BOOLEAN DEFAULT false,
  label_check BOOLEAN DEFAULT false,
  batch_code_check BOOLEAN DEFAULT false,
  mfg_date_check BOOLEAN DEFAULT false,
  expiry_check BOOLEAN DEFAULT false,
  inspector TEXT DEFAULT '',
  inspection_date DATE NOT NULL DEFAULT CURRENT_DATE,
  passed BOOLEAN DEFAULT false,
  remarks TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── 8. Manufacturing SOPs ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.rd_manufacturing_sops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product TEXT NOT NULL,
  version TEXT DEFAULT 'V1.0',
  steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'draft',
  approved_by TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── 9. Suppliers ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.rd_suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  material TEXT DEFAULT '',
  rate NUMERIC(10,2) DEFAULT 0,
  lead_time_days INTEGER DEFAULT 0,
  rating INTEGER DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  documents_url TEXT DEFAULT '',
  contact TEXT DEFAULT '',
  email TEXT DEFAULT '',
  gst_no TEXT DEFAULT '',
  address TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── 10. Samples ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.rd_samples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer TEXT NOT NULL,
  product TEXT DEFAULT '',
  quantity TEXT DEFAULT '',
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  courier TEXT DEFAULT '',
  tracking_no TEXT DEFAULT '',
  feedback TEXT DEFAULT '',
  status TEXT DEFAULT 'sent',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── 11. Cost Calculations ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.rd_cost_calculations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product TEXT NOT NULL,
  recipe_id UUID REFERENCES public.rd_recipes(id) ON DELETE SET NULL,
  ingredient_cost NUMERIC(10,2) DEFAULT 0,
  packaging_cost NUMERIC(10,2) DEFAULT 0,
  labour_cost NUMERIC(10,2) DEFAULT 0,
  manufacturing_cost NUMERIC(10,2) DEFAULT 0,
  logistics_cost NUMERIC(10,2) DEFAULT 0,
  other_cost NUMERIC(10,2) DEFAULT 0,
  total_cost NUMERIC(12,2) DEFAULT 0,
  margin_percent NUMERIC(5,2) DEFAULT 0,
  selling_price NUMERIC(12,2) DEFAULT 0,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── 12. Documents ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.rd_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Other',
  file_url TEXT DEFAULT '',
  file_type TEXT DEFAULT '',
  uploaded_by TEXT DEFAULT '',
  related_product TEXT DEFAULT '',
  tags TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ═══════════════════════════════════════════════════════════════════
-- RLS Policies — All tables: Authenticated CRUD only
-- ═══════════════════════════════════════════════════════════════════

DO $$ 
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'rd_recipes', 'rd_batch_trials', 'rd_raw_materials', 'rd_ingredient_inventory',
    'rd_product_tests', 'rd_shelf_life_tests', 'rd_qc_checklists', 'rd_manufacturing_sops',
    'rd_suppliers', 'rd_samples', 'rd_cost_calculations', 'rd_documents'
  ] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);
    
    EXECUTE format('DROP POLICY IF EXISTS "auth_select_%s" ON public.%I', tbl, tbl);
    EXECUTE format('DROP POLICY IF EXISTS "auth_insert_%s" ON public.%I', tbl, tbl);
    EXECUTE format('DROP POLICY IF EXISTS "auth_update_%s" ON public.%I', tbl, tbl);
    EXECUTE format('DROP POLICY IF EXISTS "auth_delete_%s" ON public.%I', tbl, tbl);
    
    EXECUTE format('CREATE POLICY "auth_select_%s" ON public.%I FOR SELECT TO authenticated USING (true)', tbl, tbl);
    EXECUTE format('CREATE POLICY "auth_insert_%s" ON public.%I FOR INSERT TO authenticated WITH CHECK (true)', tbl, tbl);
    EXECUTE format('CREATE POLICY "auth_update_%s" ON public.%I FOR UPDATE TO authenticated USING (true) WITH CHECK (true)', tbl, tbl);
    EXECUTE format('CREATE POLICY "auth_delete_%s" ON public.%I FOR DELETE TO authenticated USING (true)', tbl, tbl);
  END LOOP;
END $$;


-- ═══════════════════════════════════════════════════════════════════
-- Auto-update triggers for updated_at
-- ═══════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.rd_auto_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ 
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'rd_recipes', 'rd_batch_trials', 'rd_raw_materials', 'rd_ingredient_inventory',
    'rd_product_tests', 'rd_shelf_life_tests', 'rd_qc_checklists', 'rd_manufacturing_sops',
    'rd_suppliers', 'rd_samples', 'rd_cost_calculations', 'rd_documents'
  ] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_updated_at_%s ON public.%I', tbl, tbl);
    EXECUTE format('CREATE TRIGGER trg_updated_at_%s BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.rd_auto_updated_at()', tbl, tbl);
  END LOOP;
END $$;
