-- ==============================================================================
-- BIOVACO NEXUS ENTERPRISE ERP - PAYROLL & SALARY DISBURSEMENT SCHEMA (SAFE MIGRATION)
-- ==============================================================================

-- 1. Ensure Table Exists
CREATE TABLE IF NOT EXISTS public.payroll_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    month TEXT NOT NULL,
    year INTEGER NOT NULL,
    basic_salary NUMERIC(10, 2) NOT NULL DEFAULT 0,
    net_salary NUMERIC(10, 2) NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Add All Required Columns If Missing (Guaranteed to work even if old table exists)
ALTER TABLE public.payroll_records 
    ADD COLUMN IF NOT EXISTS user_email TEXT,
    ADD COLUMN IF NOT EXISTS user_name TEXT,
    ADD COLUMN IF NOT EXISTS employee_id UUID,
    ADD COLUMN IF NOT EXISTS intern_id UUID,
    ADD COLUMN IF NOT EXISTS role_department TEXT,
    ADD COLUMN IF NOT EXISTS is_intern BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS reward_points NUMERIC(10, 2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS reward_bonus NUMERIC(10, 2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS allowances NUMERIC(10, 2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS deductions NUMERIC(10, 2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'UPI',
    ADD COLUMN IF NOT EXISTS payment_details TEXT,
    ADD COLUMN IF NOT EXISTS transaction_id TEXT,
    ADD COLUMN IF NOT EXISTS paid_date TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS admin_notes TEXT,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

-- 3. Set default values for any legacy null entries
UPDATE public.payroll_records 
SET user_email = 'team@biovaco.in' 
WHERE user_email IS NULL;

UPDATE public.payroll_records 
SET user_name = 'Team Member' 
WHERE user_name IS NULL;

-- 4. Create Indexes
CREATE INDEX IF NOT EXISTS idx_payroll_records_user_email ON public.payroll_records (lower(user_email));
CREATE INDEX IF NOT EXISTS idx_payroll_records_month_year ON public.payroll_records (year, month);
CREATE INDEX IF NOT EXISTS idx_payroll_records_status ON public.payroll_records (status);
CREATE INDEX IF NOT EXISTS idx_payroll_records_created_at ON public.payroll_records (created_at DESC);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.payroll_records ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any to prevent collision
DROP POLICY IF EXISTS "Users can view own payroll or executives view all" ON public.payroll_records;
DROP POLICY IF EXISTS "Executives can insert payroll records" ON public.payroll_records;
DROP POLICY IF EXISTS "Executives can update payroll records" ON public.payroll_records;
DROP POLICY IF EXISTS "Executives can delete payroll records" ON public.payroll_records;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.payroll_records;

-- Full Access for Authenticated App Users & Executives
CREATE POLICY "Enable all access for authenticated users"
    ON public.payroll_records
    FOR ALL
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- 6. Trigger for updated_at
CREATE OR REPLACE FUNCTION public.handle_payroll_records_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_payroll_records_updated_at ON public.payroll_records;
CREATE TRIGGER trg_payroll_records_updated_at
    BEFORE UPDATE ON public.payroll_records
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_payroll_records_updated_at();
