-- Expense Records Table
CREATE TABLE IF NOT EXISTS public.expense_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    expense_id TEXT UNIQUE NOT NULL,
    date DATE NOT NULL,
    category TEXT NOT NULL,
    sub_category TEXT,
    description TEXT NOT NULL,
    amount NUMERIC(15, 2) NOT NULL,
    gst_amount NUMERIC(15, 2) DEFAULT 0,
    total_amount NUMERIC(15, 2) NOT NULL,
    payment_mode TEXT NOT NULL,
    paid_by_role TEXT NOT NULL,
    paid_by_name TEXT NOT NULL,
    beneficiary_name TEXT,
    vendor_name TEXT,
    invoice_number TEXT,
    bill_url TEXT,
    project_department TEXT,
    remarks TEXT,
    reimbursement_status TEXT DEFAULT 'Pending',
    approval_date DATE,
    reimbursement_date DATE,
    approved_by TEXT,
    transaction_ref_number TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Capital Contributions Table
CREATE TABLE IF NOT EXISTS public.capital_contributions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    founder_name TEXT NOT NULL,
    capital_contributed NUMERIC(15, 2) NOT NULL,
    date DATE NOT NULL,
    equity_percentage NUMERIC(5, 2),
    capital_type TEXT,
    authorized_capital_allocation NUMERIC(15, 2),
    paid_up_capital_allocation NUMERIC(15, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Set up Row Level Security (RLS)
ALTER TABLE public.expense_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.capital_contributions ENABLE ROW LEVEL SECURITY;

-- Create Policies for Authenticated Users (Admins)
CREATE POLICY "Allow authenticated users to read expense records" ON public.expense_records FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to insert expense records" ON public.expense_records FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated users to update expense records" ON public.expense_records FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to delete expense records" ON public.expense_records FOR DELETE TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read capital contributions" ON public.capital_contributions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to insert capital contributions" ON public.capital_contributions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated users to update capital contributions" ON public.capital_contributions FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to delete capital contributions" ON public.capital_contributions FOR DELETE TO authenticated USING (true);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE expense_records;
ALTER PUBLICATION supabase_realtime ADD TABLE capital_contributions;
