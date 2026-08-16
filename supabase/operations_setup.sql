-- ====================================================================
-- BIOVACO NEXUS — OPERATIONS MODULE DATABASE SCHEMA
-- Tables: ops_projects, ops_tasks, ops_meetings, ops_calendar_events,
--         ops_approvals, ops_announcements, ops_activity_log
-- Safe & Idempotent SQL Script for Supabase SQL Editor
-- ====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- --------------------------------------------------------------------
-- 1. OPS_PROJECTS — Project Registry
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ops_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT UNIQUE,
    description TEXT,
    department TEXT DEFAULT 'General',
    owner TEXT DEFAULT 'Project Manager',
    priority TEXT DEFAULT 'Medium',
    status TEXT DEFAULT 'Planning',
    start_date DATE DEFAULT CURRENT_DATE,
    end_date DATE,
    budget NUMERIC(15,2) DEFAULT 0.00,
    spent NUMERIC(15,2) DEFAULT 0.00,
    progress INT DEFAULT 0,
    tags TEXT[] DEFAULT '{}',
    created_by TEXT DEFAULT 'system',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.ops_projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow All Access ops_projects" ON public.ops_projects;
CREATE POLICY "Allow All Access ops_projects" ON public.ops_projects FOR ALL USING (true) WITH CHECK (true);

-- --------------------------------------------------------------------
-- 2. OPS_TASKS — Tasks linked to Projects
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ops_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    project_id UUID REFERENCES public.ops_projects(id) ON DELETE SET NULL,
    assignee TEXT,
    priority TEXT DEFAULT 'Medium',
    status TEXT DEFAULT 'Todo',
    due_date DATE,
    estimated_hours NUMERIC(6,1) DEFAULT 0,
    actual_hours NUMERIC(6,1) DEFAULT 0,
    labels TEXT[] DEFAULT '{}',
    created_by TEXT DEFAULT 'system',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.ops_tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow All Access ops_tasks" ON public.ops_tasks;
CREATE POLICY "Allow All Access ops_tasks" ON public.ops_tasks FOR ALL USING (true) WITH CHECK (true);

-- --------------------------------------------------------------------
-- 3. OPS_MEETINGS — Enhanced Meetings for Operations
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ops_meetings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject TEXT NOT NULL,
    meeting_type TEXT DEFAULT 'Review',
    meeting_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    duration_minutes INT DEFAULT 30,
    location TEXT DEFAULT 'Google Meet',
    organizer TEXT DEFAULT 'system',
    attendees TEXT[] DEFAULT '{}',
    agenda TEXT,
    minutes TEXT,
    project_id UUID REFERENCES public.ops_projects(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'Scheduled',
    created_by TEXT DEFAULT 'system',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.ops_meetings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow All Access ops_meetings" ON public.ops_meetings;
CREATE POLICY "Allow All Access ops_meetings" ON public.ops_meetings FOR ALL USING (true) WITH CHECK (true);

-- --------------------------------------------------------------------
-- 4. OPS_CALENDAR_EVENTS — Company-wide Calendar
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ops_calendar_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    event_type TEXT DEFAULT 'Meeting',
    event_date DATE NOT NULL DEFAULT CURRENT_DATE,
    start_time TIME DEFAULT '10:00',
    end_time TIME DEFAULT '11:00',
    is_all_day BOOLEAN DEFAULT false,
    description TEXT,
    project_id UUID REFERENCES public.ops_projects(id) ON DELETE SET NULL,
    created_by TEXT DEFAULT 'system',
    color TEXT DEFAULT '#4B49AC',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.ops_calendar_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow All Access ops_calendar_events" ON public.ops_calendar_events;
CREATE POLICY "Allow All Access ops_calendar_events" ON public.ops_calendar_events FOR ALL USING (true) WITH CHECK (true);

-- --------------------------------------------------------------------
-- 5. OPS_APPROVALS — Approval Workflow Engine
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ops_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_type TEXT NOT NULL DEFAULT 'General',
    title TEXT NOT NULL,
    description TEXT,
    requested_by TEXT NOT NULL,
    approver TEXT NOT NULL,
    amount NUMERIC(15,2),
    status TEXT DEFAULT 'Pending',
    comments TEXT,
    entity_type TEXT,
    entity_id UUID,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.ops_approvals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow All Access ops_approvals" ON public.ops_approvals;
CREATE POLICY "Allow All Access ops_approvals" ON public.ops_approvals FOR ALL USING (true) WITH CHECK (true);

-- --------------------------------------------------------------------
-- 6. OPS_ANNOUNCEMENTS — Company Announcements
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ops_announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    author TEXT DEFAULT 'Admin',
    priority TEXT DEFAULT 'Info',
    target_departments TEXT[] DEFAULT '{}',
    is_pinned BOOLEAN DEFAULT false,
    expires_at TIMESTAMPTZ,
    read_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.ops_announcements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow All Access ops_announcements" ON public.ops_announcements;
CREATE POLICY "Allow All Access ops_announcements" ON public.ops_announcements FOR ALL USING (true) WITH CHECK (true);

-- --------------------------------------------------------------------
-- 7. OPS_ACTIVITY_LOG — Cross-module Audit Trail
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ops_activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor TEXT NOT NULL DEFAULT 'system',
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    entity_name TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.ops_activity_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow All Access ops_activity_log" ON public.ops_activity_log;
CREATE POLICY "Allow All Access ops_activity_log" ON public.ops_activity_log FOR ALL USING (true) WITH CHECK (true);

-- --------------------------------------------------------------------
-- SEED DATA
-- --------------------------------------------------------------------

INSERT INTO public.ops_projects (name, code, description, department, owner, priority, status, start_date, end_date, budget, spent, progress, tags, created_by)
VALUES
    ('BiovaCo Bio-Kit v4 Launch', 'PRJ-001', 'Next-generation bio-formulation kit packaging, testing, and go-to-market launch for Maharashtra & Gujarat farmer network.', 'R&D', 'Dr. Nakul Mundhada', 'High', 'In Progress', '2026-07-01', '2026-09-30', 1500000, 680000, 45, ARRAY['Product Launch', 'R&D', 'Q3'], 'ceo@biovaco.in'),
    ('Enterprise ERP Portal v2.0', 'PRJ-002', 'Full-stack BiovaCo Nexus enterprise admin portal with HRMS, Finance, CRM, and Operations modules.', 'IT', 'IT Systems Lead', 'High', 'In Progress', '2026-06-15', '2026-10-31', 800000, 320000, 60, ARRAY['IT', 'Engineering', 'Portal'], 'ceo@biovaco.in'),
    ('Monsoon Farmer Outreach Campaign', 'PRJ-003', 'Multi-channel digital marketing campaign targeting cotton and spice farmers across western India.', 'Marketing', 'Marketing Head', 'Medium', 'In Progress', '2026-08-01', '2026-09-15', 250000, 95000, 35, ARRAY['Marketing', 'Campaign', 'Monsoon'], 'md@biovaco.in'),
    ('Warehouse Inventory Automation', 'PRJ-004', 'Barcode scanning and automated stock management system for Amravati warehouse.', 'Operations', 'Operations VP', 'Medium', 'Planning', '2026-09-01', '2026-11-30', 400000, 0, 0, ARRAY['Operations', 'Automation'], 'ceo@biovaco.in')
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.ops_approvals (request_type, title, description, requested_by, approver, amount, status, submitted_at)
VALUES
    ('Expense', 'Lab Equipment Purchase — Spectrophotometer', 'UV-Vis spectrophotometer for R&D batch quality analysis.', 'rd@biovaco.in', 'ceo@biovaco.in', 185000.00, 'Pending', NOW() - interval '1 day'),
    ('Leave', 'Annual Leave — 20-24 Aug', '5 days annual leave for family function.', 'hr@biovaco.in', 'md@biovaco.in', NULL, 'Approved', NOW() - interval '3 days'),
    ('Purchase', 'Marketing Campaign Ad Spend — Meta Ads', 'Monthly Meta Ads budget allocation for monsoon farmer campaign.', 'marketing@biovaco.in', 'ceo@biovaco.in', 75000.00, 'Pending', NOW())
ON CONFLICT DO NOTHING;

INSERT INTO public.ops_announcements (title, content, author, priority, target_departments, is_pinned, expires_at)
VALUES
    ('Independence Day Holiday — 15th August', 'The office will remain closed on 15th August 2026 on account of Independence Day. Wishing everyone a Happy Independence Day!', 'HR Department', 'Important', ARRAY['All'], true, '2026-08-16 00:00:00+05:30'),
    ('New Bio-Kit v4 Lab Results Available', 'The latest batch #4 bio-formulation lab results are now available in the R&D shared drive. All team members are requested to review and provide feedback by Friday.', 'Dr. Nakul Mundhada', 'Info', ARRAY['R&D', 'Quality'], false, NULL),
    ('System Maintenance — Portal Update Tonight', 'The BiovaCo Nexus portal will undergo a scheduled maintenance update tonight between 11 PM - 1 AM IST. Please save all work before 10:45 PM.', 'IT Department', 'Urgent', ARRAY['All'], true, NOW() + interval '1 day')
ON CONFLICT DO NOTHING;

INSERT INTO public.ops_calendar_events (title, event_type, event_date, start_time, end_time, is_all_day, description, color, created_by)
VALUES
    ('Independence Day', 'Holiday', '2026-08-15', '00:00', '23:59', true, 'National Holiday — Office Closed', '#22c55e', 'hr@biovaco.in'),
    ('Monthly All-Hands Review', 'Review', CURRENT_DATE + 5, '10:00', '11:30', false, 'Monthly company-wide review of goals, KPIs, and department progress.', '#f59e0b', 'ceo@biovaco.in'),
    ('Bio-Kit v4 Lab Deadline', 'Deadline', CURRENT_DATE + 14, '18:00', '18:00', false, 'Final deadline for Bio-Kit v4 formulation sign-off.', '#ef4444', 'ceo@biovaco.in'),
    ('Q3 Strategy Board Meeting', 'Meeting', CURRENT_DATE + 10, '14:00', '16:00', false, 'Quarterly strategy review with executive board.', '#4B49AC', 'ceo@biovaco.in')
ON CONFLICT DO NOTHING;
