-- Manufacturing Module Schema

-- Machines
CREATE TABLE IF NOT EXISTS public.mfg_machines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    serial_number TEXT,
    status TEXT DEFAULT 'Operational', -- Operational, Under Maintenance, Broken
    last_maintenance DATE,
    next_maintenance DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bill of Materials (BOM)
CREATE TABLE IF NOT EXISTS public.mfg_bom (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_name TEXT NOT NULL,
    version TEXT DEFAULT '1.0',
    status TEXT DEFAULT 'Draft', -- Draft, Approved, Archived
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- BOM Items
CREATE TABLE IF NOT EXISTS public.mfg_bom_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bom_id UUID REFERENCES public.mfg_bom(id) ON DELETE CASCADE,
    material_name TEXT NOT NULL,
    quantity NUMERIC NOT NULL,
    unit TEXT NOT NULL,
    cost_per_unit NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Production Orders
CREATE TABLE IF NOT EXISTS public.mfg_production_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT UNIQUE NOT NULL,
    bom_id UUID REFERENCES public.mfg_bom(id),
    target_quantity NUMERIC NOT NULL,
    status TEXT DEFAULT 'Planned', -- Planned, In Progress, Completed, Cancelled
    start_date DATE,
    end_date DATE,
    assigned_machine_id UUID REFERENCES public.mfg_machines(id),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quality Checks
CREATE TABLE IF NOT EXISTS public.mfg_quality_checks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    production_order_id UUID REFERENCES public.mfg_production_orders(id) ON DELETE CASCADE,
    check_date TIMESTAMPTZ DEFAULT NOW(),
    inspector_name TEXT,
    status TEXT DEFAULT 'Pending', -- Passed, Failed, Pending
    comments TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Apply RLS
ALTER TABLE public.mfg_machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mfg_bom ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mfg_bom_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mfg_production_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mfg_quality_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated access to mfg_machines" ON public.mfg_machines FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated access to mfg_bom" ON public.mfg_bom FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated access to mfg_bom_items" ON public.mfg_bom_items FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated access to mfg_production_orders" ON public.mfg_production_orders FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated access to mfg_quality_checks" ON public.mfg_quality_checks FOR ALL USING (auth.role() = 'authenticated');
