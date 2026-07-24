-- Organization Tables Setup
-- This script creates the core organizational structure tables.

CREATE TABLE IF NOT EXISTS company_profile (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name TEXT NOT NULL,
    registration_number TEXT,
    tax_id TEXT,
    email TEXT,
    phone TEXT,
    website TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    country TEXT,
    postal_code TEXT,
    industry TEXT,
    founded_year INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    head_name TEXT,
    head_email TEXT,
    budget_allocation NUMERIC,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT DEFAULT 'office', -- office, warehouse, retail
    location TEXT,
    city TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    branch_manager TEXT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
    leader_name TEXT,
    leader_email TEXT,
    description TEXT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert Default Company Profile if empty
INSERT INTO company_profile (company_name, email, phone, website, city, country, industry)
SELECT 'BiovaCo Nexus', 'contact@biovaco.in', '+91 9876543210', 'www.biovaco.in', 'Pune', 'India', 'AgriTech & Biotechnology'
WHERE NOT EXISTS (SELECT 1 FROM company_profile);

-- Enable RLS
ALTER TABLE company_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON company_profile;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON departments;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON branches;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON teams;

-- Create Policies (Admin full access) for ALL operations
CREATE POLICY "Enable all access for authenticated users" ON company_profile 
FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable all access for authenticated users" ON departments 
FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable all access for authenticated users" ON branches 
FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable all access for authenticated users" ON teams 
FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Org Chart View (Combines Departments and Teams for easy fetching)
CREATE OR REPLACE VIEW organization_hierarchy AS
SELECT 
    d.id as department_id,
    d.name as department_name,
    d.head_name as department_head,
    t.id as team_id,
    t.name as team_name,
    t.leader_name as team_leader
FROM departments d
LEFT JOIN teams t ON d.id = t.department_id;
