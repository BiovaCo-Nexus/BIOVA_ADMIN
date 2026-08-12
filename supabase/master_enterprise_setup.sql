-- ====================================================================
-- BIOVACO NEXUS ENTERPRISE ERP - MASTER DATABASE SCHEMA SETUP
-- Modules Covered: IT & System, Documents, Finance, HRMS & My Workspace (Personal)
-- Safe & Idempotent SQL Script for Supabase SQL Editor
-- ====================================================================

-- Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- --------------------------------------------------------------------
-- 1. IT & SYSTEM MANAGEMENT TABLES
-- --------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.user_page_access (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_email TEXT NOT NULL UNIQUE,
    user_label TEXT,
    user_type TEXT DEFAULT 'Team Member',
    target_hours_per_day NUMERIC DEFAULT 8.0,
    logged_active_seconds NUMERIC DEFAULT 0,
    last_active_at TIMESTAMPTZ DEFAULT NOW(),
    allowed_pages TEXT[] DEFAULT '{}',
    default_tab TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.system_api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key_name TEXT NOT NULL,
    service_provider TEXT NOT NULL,
    api_key_masked TEXT NOT NULL,
    encrypted_secret TEXT,
    environment TEXT DEFAULT 'production',
    status TEXT DEFAULT 'Active',
    last_used TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.system_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    provider TEXT NOT NULL,
    type TEXT DEFAULT 'Webhook',
    status TEXT DEFAULT 'Connected',
    endpoint_url TEXT,
    last_ping_ms INT DEFAULT 35,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.admin_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_email TEXT NOT NULL,
    action_type TEXT NOT NULL,
    description TEXT,
    ip_address TEXT DEFAULT '127.0.0.1',
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- --------------------------------------------------------------------
-- 2. DOCUMENTS MODULE TABLES
-- --------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.document_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    placeholders JSONB DEFAULT '[]'::jsonb,
    format TEXT DEFAULT 'PDF',
    version TEXT DEFAULT 'v1.0',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.digital_signatures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    signer_name TEXT NOT NULL,
    signer_role TEXT,
    signature_data_url TEXT NOT NULL,
    is_verified BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.sop_library (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    author TEXT DEFAULT 'Executive Board',
    version TEXT DEFAULT 'v1.0',
    effective_date DATE DEFAULT CURRENT_DATE,
    acknowledged_count INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- --------------------------------------------------------------------
-- 3. FINANCE & ACCOUNTING TABLES
-- --------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.chart_of_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    account_type TEXT NOT NULL,
    sub_type TEXT,
    balance NUMERIC(15,2) DEFAULT 0.00,
    status TEXT DEFAULT 'Active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.journal_vouchers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    voucher_no TEXT NOT NULL UNIQUE,
    date DATE DEFAULT CURRENT_DATE,
    debit_account TEXT NOT NULL,
    credit_account TEXT NOT NULL,
    amount NUMERIC(15,2) NOT NULL,
    narration TEXT,
    posted_by TEXT DEFAULT 'Finance Controller',
    status TEXT DEFAULT 'Posted',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.department_budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    department TEXT NOT NULL,
    allocated_amount NUMERIC(15,2) NOT NULL,
    spent_amount NUMERIC(15,2) DEFAULT 0.00,
    budget_owner TEXT,
    fiscal_period TEXT DEFAULT 'FY 2026-27 Q2',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.fixed_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_tag TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    purchase_date DATE DEFAULT CURRENT_DATE,
    purchase_cost NUMERIC(15,2) NOT NULL,
    accumulated_depreciation NUMERIC(15,2) DEFAULT 0.00,
    net_book_value NUMERIC(15,2) NOT NULL,
    location TEXT DEFAULT 'Head Office',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Marketing Campaigns Table
CREATE TABLE IF NOT EXISTS public.marketing_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    channel TEXT DEFAULT 'Social Media',
    budget NUMERIC(15,2) DEFAULT 0.00,
    leads_generated INT DEFAULT 0,
    status TEXT DEFAULT 'Active',
    target_audience TEXT DEFAULT 'General Audience',
    start_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- --------------------------------------------------------------------
-- 4. MY WORKSPACE (PERSONAL) TABLES
-- --------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.personal_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_email TEXT DEFAULT 'nakul.m@biovaco.in',
    title TEXT NOT NULL,
    priority TEXT DEFAULT 'Medium',
    due_date DATE DEFAULT CURRENT_DATE,
    category TEXT DEFAULT 'General',
    completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.personal_calendar_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_email TEXT DEFAULT 'nakul.m@biovaco.in',
    title TEXT NOT NULL,
    event_date DATE DEFAULT CURRENT_DATE,
    start_time TIME DEFAULT '10:00',
    end_time TIME DEFAULT '11:00',
    location TEXT DEFAULT 'Conference Room A / Google Meet',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.personal_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_email TEXT DEFAULT 'nakul.m@biovaco.in',
    file_name TEXT NOT NULL,
    file_type TEXT DEFAULT 'PDF',
    file_url TEXT,
    category TEXT DEFAULT 'Personal Vault',
    upload_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.personal_attendance_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_email TEXT DEFAULT 'nakul.m@biovaco.in',
    log_date DATE DEFAULT CURRENT_DATE,
    check_in TIME DEFAULT '09:30',
    check_out TIME DEFAULT '18:30',
    status TEXT DEFAULT 'Present',
    work_location TEXT DEFAULT 'Head Office',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'Executive',
    department TEXT DEFAULT 'Executive Board',
    phone TEXT,
    bio TEXT,
    location TEXT DEFAULT 'Head Office',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- --------------------------------------------------------------------
-- 5. ROW LEVEL SECURITY (RLS) POLICIES (SAFE DROP & CREATE)
-- --------------------------------------------------------------------

ALTER TABLE public.user_page_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digital_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sop_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chart_of_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.department_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fixed_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_attendance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Safe Policy Replacements
DROP POLICY IF EXISTS "Allow All Access user_page_access" ON public.user_page_access;
CREATE POLICY "Allow All Access user_page_access" ON public.user_page_access FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow All Access system_api_keys" ON public.system_api_keys;
CREATE POLICY "Allow All Access system_api_keys" ON public.system_api_keys FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow All Access system_integrations" ON public.system_integrations;
CREATE POLICY "Allow All Access system_integrations" ON public.system_integrations FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow All Access admin_activity_logs" ON public.admin_activity_logs;
CREATE POLICY "Allow All Access admin_activity_logs" ON public.admin_activity_logs FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow All Access document_templates" ON public.document_templates;
CREATE POLICY "Allow All Access document_templates" ON public.document_templates FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow All Access digital_signatures" ON public.digital_signatures;
CREATE POLICY "Allow All Access digital_signatures" ON public.digital_signatures FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow All Access sop_library" ON public.sop_library;
CREATE POLICY "Allow All Access sop_library" ON public.sop_library FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow All Access chart_of_accounts" ON public.chart_of_accounts;
CREATE POLICY "Allow All Access chart_of_accounts" ON public.chart_of_accounts FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow All Access journal_vouchers" ON public.journal_vouchers;
CREATE POLICY "Allow All Access journal_vouchers" ON public.journal_vouchers FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow All Access department_budgets" ON public.department_budgets;
CREATE POLICY "Allow All Access department_budgets" ON public.department_budgets FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow All Access fixed_assets" ON public.fixed_assets;
CREATE POLICY "Allow All Access fixed_assets" ON public.fixed_assets FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow All Access marketing_campaigns" ON public.marketing_campaigns;
CREATE POLICY "Allow All Access marketing_campaigns" ON public.marketing_campaigns FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow All Access personal_tasks" ON public.personal_tasks;
CREATE POLICY "Allow All Access personal_tasks" ON public.personal_tasks FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow All Access personal_calendar_events" ON public.personal_calendar_events;
CREATE POLICY "Allow All Access personal_calendar_events" ON public.personal_calendar_events FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow All Access personal_documents" ON public.personal_documents;
CREATE POLICY "Allow All Access personal_documents" ON public.personal_documents FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow All Access personal_attendance_logs" ON public.personal_attendance_logs;
CREATE POLICY "Allow All Access personal_attendance_logs" ON public.personal_attendance_logs FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow All Access user_profiles" ON public.user_profiles;
CREATE POLICY "Allow All Access user_profiles" ON public.user_profiles FOR ALL USING (true) WITH CHECK (true);

-- --------------------------------------------------------------------
-- 6. SEED DATA (SAFE UPSERT & CONFLICT HANDLING)
-- --------------------------------------------------------------------

INSERT INTO public.chart_of_accounts (code, name, account_type, sub_type, balance)
VALUES 
    ('1000-101', 'HDFC Bank Operating Account', 'Asset', 'Current Asset / Bank', 1450000.00),
    ('1000-102', 'Petty Cash Reserve', 'Asset', 'Current Asset / Cash', 25000.00),
    ('1100-101', 'Accounts Receivable (Trade Debtors)', 'Asset', 'Current Asset', 380000.00),
    ('1500-101', 'R&D Testing Hardware & Lab Assets', 'Asset', 'Fixed Asset', 850000.00),
    ('2000-101', 'Accounts Payable (Trade Creditors)', 'Liability', 'Current Liability', 195000.00),
    ('2200-101', 'GST Output Tax Payable', 'Liability', 'Statutory Liability', 42000.00),
    ('3000-101', 'Founder Share Capital', 'Equity', 'Paid-up Capital', 2000000.00),
    ('4000-101', 'Electroculture Product Sales Revenue', 'Revenue', 'Operating Revenue', 1280000.00),
    ('5000-101', 'Raw Material Procurement COGS', 'Expense', 'Direct Cost', 420000.00),
    ('5100-101', 'Staff Payroll & Wages', 'Expense', 'Operating Expense', 340000.00)
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.personal_tasks (user_email, title, priority, due_date, category, completed)
VALUES 
    ('nakul.m@biovaco.in', 'Review Electroculture Bio-Trial Lab Batch #4 report', 'High', CURRENT_DATE + 1, 'R&D', false),
    ('nakul.m@biovaco.in', 'Approve July 2026 executive payroll disbursement vouchers', 'High', CURRENT_DATE, 'Finance', true),
    ('nakul.m@biovaco.in', 'Update GST GSTR-3B tax return reconciliation ledger', 'Medium', CURRENT_DATE + 3, 'Taxation', false),
    ('nakul.m@biovaco.in', 'Schedule quarterly performance review with Senior Field Engineers', 'Low', CURRENT_DATE + 7, 'HRMS', false)
ON CONFLICT DO NOTHING;

INSERT INTO public.user_profiles (email, name, role, department, phone, bio, location)
VALUES 
    ('nakul.m@biovaco.in', 'Dr. Nakul Mundhada', 'Chief Executive Officer / Founder', 'Executive Board & R&D Strategy', '+91 98765 43210', 'Leading BiovaCo Nexus electroculture agricultural research, enterprise ERP engineering, and corporate operations.', 'Amravati / Head Office')
ON CONFLICT (email) DO NOTHING;

INSERT INTO public.marketing_campaigns (name, channel, budget, leads_generated, status, target_audience, start_date)
VALUES
    ('Electroculture Bio-Kit Monsoon Farmer Outreach', 'Meta & YouTube Ads', 150000.00, 340, 'Active', 'Maharashtra & Gujarat Cotton/Spices Farmers', CURRENT_DATE - 15),
    ('Enterprise AgTech B2B Distributor Campaign', 'LinkedIn & Direct Email', 80000.00, 45, 'Active', 'Agri-fertilizer Dealers & Wholesalers', CURRENT_DATE - 10)
ON CONFLICT DO NOTHING;
