-- ==============================================================================
-- BIOVACO NEXUS ENTERPRISE ERP - PAYROLL & SALARY DISBURSEMENT SCHEMA
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.payroll_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_email TEXT NOT NULL,
    user_name TEXT NOT NULL,
    employee_id UUID,
    intern_id UUID,
    role_department TEXT,
    is_intern BOOLEAN DEFAULT false,
    
    month TEXT NOT NULL,                    -- e.g. 'August'
    year INTEGER NOT NULL,                  -- e.g. 2026
    
    basic_salary NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (basic_salary >= 0),
    reward_points NUMERIC(10, 2) NOT NULL DEFAULT 0,
    reward_bonus NUMERIC(10, 2) NOT NULL DEFAULT 0,  -- 1 Pt = 1 INR
    allowances NUMERIC(10, 2) NOT NULL DEFAULT 0,
    deductions NUMERIC(10, 2) NOT NULL DEFAULT 0,
    net_salary NUMERIC(10, 2) NOT NULL CHECK (net_salary >= 0),
    
    status TEXT NOT NULL DEFAULT 'pending'  -- 'draft' | 'pending' | 'approved' | 'paid' | 'on_hold'
        CHECK (status IN ('draft', 'pending', 'approved', 'paid', 'on_hold')),
    
    payment_method TEXT DEFAULT 'UPI',      -- 'UPI' | 'Bank IMPS' | 'Bank NEFT' | 'Cash' | 'Cheque'
    payment_details TEXT,                   -- UPI ID or Account/IFSC
    transaction_id TEXT,                    -- UTR / Bank Reference No
    paid_date TIMESTAMPTZ,                  -- When payment was disbursed
    admin_notes TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    
    -- Ensure single record per user per month & year
    CONSTRAINT uq_user_payroll_month_year UNIQUE (user_email, month, year)
);

-- Indexes for lightning fast lookups
CREATE INDEX IF NOT EXISTS idx_payroll_records_user_email ON public.payroll_records (lower(user_email));
CREATE INDEX IF NOT EXISTS idx_payroll_records_month_year ON public.payroll_records (year, month);
CREATE INDEX IF NOT EXISTS idx_payroll_records_status ON public.payroll_records (status);
CREATE INDEX IF NOT EXISTS idx_payroll_records_created_at ON public.payroll_records (created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.payroll_records ENABLE ROW LEVEL SECURITY;

-- 1. Members can view their own payroll records; Executives can view all
CREATE POLICY "Users can view own payroll or executives view all"
    ON public.payroll_records
    FOR SELECT
    USING (
        auth.jwt() ->> 'email' = lower(user_email)
        OR auth.jwt() ->> 'email' IN ('ceo@biovaco.in', 'md@biovaco.in', 'nakul@biovaco.in', 'admin@biovaco.in')
    );

-- 2. Executives can insert payroll records
CREATE POLICY "Executives can insert payroll records"
    ON public.payroll_records
    FOR INSERT
    WITH CHECK (
        auth.jwt() ->> 'email' IN ('ceo@biovaco.in', 'md@biovaco.in', 'nakul@biovaco.in', 'admin@biovaco.in')
    );

-- 3. Executives can update payroll records
CREATE POLICY "Executives can update payroll records"
    ON public.payroll_records
    FOR UPDATE
    USING (
        auth.jwt() ->> 'email' IN ('ceo@biovaco.in', 'md@biovaco.in', 'nakul@biovaco.in', 'admin@biovaco.in')
    );

-- 4. Executives can delete payroll records
CREATE POLICY "Executives can delete payroll records"
    ON public.payroll_records
    FOR DELETE
    USING (
        auth.jwt() ->> 'email' IN ('ceo@biovaco.in', 'md@biovaco.in', 'nakul@biovaco.in', 'admin@biovaco.in')
    );

-- Trigger for auto updated_at
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
