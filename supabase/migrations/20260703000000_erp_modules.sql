-- Supabase Schema for ERP Modules: Inventory, Purchasing, and Invoicing

-- 1. Inventory Items Table
CREATE TABLE IF NOT EXISTS public.inventory_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    item_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    hsn_code VARCHAR(50),
    quantity INTEGER DEFAULT 0,
    unit_price DECIMAL(12, 2) DEFAULT 0.00,
    low_stock_threshold INTEGER DEFAULT 10,
    damaged_quantity INTEGER DEFAULT 0,
    last_restocked_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Purchase Orders Table
CREATE TABLE IF NOT EXISTS public.purchase_orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    po_number VARCHAR(50) UNIQUE NOT NULL,
    supplier_name VARCHAR(255) NOT NULL,
    order_date DATE NOT NULL,
    expected_delivery_date DATE,
    total_amount DECIMAL(12, 2) NOT NULL,
    amount_paid DECIMAL(12, 2) DEFAULT 0.00,
    due_amount DECIMAL(12, 2) GENERATED ALWAYS AS (total_amount - amount_paid) STORED,
    payment_status VARCHAR(50) DEFAULT 'Pending', -- Pending, Partial, Paid
    order_status VARCHAR(50) DEFAULT 'Draft', -- Draft, Sent, Received, Cancelled
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Invoices Table
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    invoice_type VARCHAR(50) NOT NULL, -- Sales, Purchase, Credit Note
    client_name VARCHAR(255) NOT NULL,
    issue_date DATE NOT NULL,
    due_date DATE,
    subtotal DECIMAL(12, 2) NOT NULL,
    gst_amount DECIMAL(12, 2) DEFAULT 0.00,
    total_amount DECIMAL(12, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'Unpaid', -- Unpaid, Paid, Overdue, Cancelled
    pdf_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security (RLS) configuration

ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Allow read/write access for authenticated users (Admin access)
CREATE POLICY "Allow full access to authenticated users for inventory" ON public.inventory_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access to authenticated users for purchases" ON public.purchase_orders FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access to authenticated users for invoices" ON public.invoices FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Allow public read access to inventory if needed on frontend (optional)
-- CREATE POLICY "Allow public read access for inventory" ON public.inventory_items FOR SELECT TO anon USING (true);

-- 4. Customers Table
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    gst_number VARCHAR(50),
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Suppliers Table
CREATE TABLE IF NOT EXISTS public.suppliers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    gst_number VARCHAR(50),
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow full access to authenticated users for customers" ON public.customers FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access to authenticated users for suppliers" ON public.suppliers FOR ALL TO authenticated USING (true) WITH CHECK (true);
