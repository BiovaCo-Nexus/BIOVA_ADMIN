-- ============================================================================
-- BIOVACO NEXUS ENTERPRISE ERP - MY WORKSPACE (PERSONAL) DATABASE SCHEMA
-- ============================================================================
-- Modules Covered:
-- 1. personal_tasks (My Tasks & Action Items)
-- 2. personal_calendar_events (My Calendar, Meetings & Focus Blocks)
-- 3. personal_documents (My Personal Documents & Encrypted Notes Vault)
-- 4. personal_attendance (My Daily Punch Logs, Working Hours & Leave Requests)
-- 5. personal_performance_goals (My OKRs, KPIs & Milestone Progress)
-- 6. personal_appraisals (My Quarterly Self-Appraisal Submissions)
-- 7. personal_notifications (My Direct Alerts & Deliverable Notifications)
-- 8. user_profiles (My Profile, Executive Credentials, Bio & Contact Details)
-- ============================================================================

-- 1. PERSONAL TASKS TABLE
CREATE TABLE IF NOT EXISTS public.personal_tasks (
    id TEXT PRIMARY KEY DEFAULT ('task_' || floor(extract(epoch from now()) * 1000)::text || '_' || substr(md5(random()::text), 1, 6)),
    user_email TEXT NOT NULL,
    title TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'Medium', -- 'High', 'Medium', 'Low'
    due_date DATE DEFAULT CURRENT_DATE,
    category TEXT DEFAULT 'General',
    completed BOOLEAN DEFAULT FALSE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_personal_tasks_email ON public.personal_tasks (user_email);
CREATE INDEX IF NOT EXISTS idx_personal_tasks_completed ON public.personal_tasks (completed);

-- 2. PERSONAL CALENDAR & SCHEDULE TABLE
CREATE TABLE IF NOT EXISTS public.personal_calendar_events (
    id TEXT PRIMARY KEY DEFAULT ('cal_' || floor(extract(epoch from now()) * 1000)::text || '_' || substr(md5(random()::text), 1, 6)),
    user_email TEXT NOT NULL,
    title TEXT NOT NULL,
    event_date DATE NOT NULL DEFAULT CURRENT_DATE,
    event_time TEXT NOT NULL DEFAULT '10:00 AM',
    event_type TEXT NOT NULL DEFAULT 'Meeting', -- 'Meeting', 'Focus Block', 'Review', 'Personal Reminder'
    priority TEXT DEFAULT 'Medium',
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_personal_cal_email ON public.personal_calendar_events (user_email);
CREATE INDEX IF NOT EXISTS idx_personal_cal_date ON public.personal_calendar_events (event_date);

-- 3. PERSONAL DOCUMENTS & VAULT TABLE
CREATE TABLE IF NOT EXISTS public.personal_documents (
    id TEXT PRIMARY KEY DEFAULT ('doc_' || floor(extract(epoch from now()) * 1000)::text || '_' || substr(md5(random()::text), 1, 6)),
    user_email TEXT NOT NULL,
    name TEXT NOT NULL,
    file_type TEXT DEFAULT 'Private Document',
    file_size TEXT DEFAULT '1 KB',
    category TEXT DEFAULT 'General Notes',
    content TEXT,
    file_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_personal_docs_email ON public.personal_documents (user_email);

-- 4. PERSONAL ATTENDANCE & PUNCH LOGS TABLE
CREATE TABLE IF NOT EXISTS public.personal_attendance (
    id TEXT PRIMARY KEY DEFAULT ('att_' || floor(extract(epoch from now()) * 1000)::text || '_' || substr(md5(random()::text), 1, 6)),
    user_email TEXT NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    check_in TEXT DEFAULT '--:--',
    check_out TEXT DEFAULT '--:--',
    status TEXT NOT NULL DEFAULT 'Present',
    total_hours TEXT DEFAULT '0h',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_date_punch UNIQUE (user_email, date)
);

CREATE INDEX IF NOT EXISTS idx_personal_att_email ON public.personal_attendance (user_email);
CREATE INDEX IF NOT EXISTS idx_personal_att_date ON public.personal_attendance (date);

-- 5. PERSONAL PERFORMANCE & OKR GOALS TABLE
CREATE TABLE IF NOT EXISTS public.personal_performance_goals (
    id TEXT PRIMARY KEY DEFAULT ('goal_' || floor(extract(epoch from now()) * 1000)::text || '_' || substr(md5(random()::text), 1, 6)),
    user_email TEXT NOT NULL,
    title TEXT NOT NULL,
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    target TEXT DEFAULT '100%',
    status TEXT DEFAULT 'In Progress', -- 'On Track', 'Exceeding', 'In Progress', 'Completed'
    quarter TEXT DEFAULT 'Q3 2026',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_personal_perf_email ON public.personal_performance_goals (user_email);

-- 6. PERSONAL SELF-APPRAISALS TABLE
CREATE TABLE IF NOT EXISTS public.personal_appraisals (
    id TEXT PRIMARY KEY DEFAULT ('appr_' || floor(extract(epoch from now()) * 1000)::text || '_' || substr(md5(random()::text), 1, 6)),
    user_email TEXT NOT NULL,
    quarter TEXT NOT NULL DEFAULT 'Q3 2026',
    accomplishments TEXT NOT NULL,
    feedback_notes TEXT,
    rating TEXT DEFAULT 'Pending Review',
    submitted_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_personal_appr_email ON public.personal_appraisals (user_email);

-- 7. PERSONAL NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.personal_notifications (
    id TEXT PRIMARY KEY DEFAULT ('notif_' || floor(extract(epoch from now()) * 1000)::text || '_' || substr(md5(random()::text), 1, 6)),
    user_email TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    time_label TEXT DEFAULT 'Just now',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_personal_notif_email ON public.personal_notifications (user_email);
CREATE INDEX IF NOT EXISTS idx_personal_notif_read ON public.personal_notifications (is_read);

-- 8. USER PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id TEXT PRIMARY KEY DEFAULT ('usr_' || floor(extract(epoch from now()) * 1000)::text || '_' || substr(md5(random()::text), 1, 6)),
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT,
    department TEXT,
    phone TEXT,
    employee_id TEXT,
    bio TEXT,
    location TEXT DEFAULT 'Head Office',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles (email);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) & ACCESS POLICIES
-- ============================================================================

ALTER TABLE public.personal_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_performance_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_appraisals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Permissive workspace policies for enterprise portal operations
DO $$ 
BEGIN
    -- personal_tasks
    DROP POLICY IF EXISTS "Workspace access on personal_tasks" ON public.personal_tasks;
    CREATE POLICY "Workspace access on personal_tasks" ON public.personal_tasks FOR ALL USING (true) WITH CHECK (true);

    -- personal_calendar_events
    DROP POLICY IF EXISTS "Workspace access on personal_calendar_events" ON public.personal_calendar_events;
    CREATE POLICY "Workspace access on personal_calendar_events" ON public.personal_calendar_events FOR ALL USING (true) WITH CHECK (true);

    -- personal_documents
    DROP POLICY IF EXISTS "Workspace access on personal_documents" ON public.personal_documents;
    CREATE POLICY "Workspace access on personal_documents" ON public.personal_documents FOR ALL USING (true) WITH CHECK (true);

    -- personal_attendance
    DROP POLICY IF EXISTS "Workspace access on personal_attendance" ON public.personal_attendance;
    CREATE POLICY "Workspace access on personal_attendance" ON public.personal_attendance FOR ALL USING (true) WITH CHECK (true);

    -- personal_performance_goals
    DROP POLICY IF EXISTS "Workspace access on personal_performance_goals" ON public.personal_performance_goals;
    CREATE POLICY "Workspace access on personal_performance_goals" ON public.personal_performance_goals FOR ALL USING (true) WITH CHECK (true);

    -- personal_appraisals
    DROP POLICY IF EXISTS "Workspace access on personal_appraisals" ON public.personal_appraisals;
    CREATE POLICY "Workspace access on personal_appraisals" ON public.personal_appraisals FOR ALL USING (true) WITH CHECK (true);

    -- personal_notifications
    DROP POLICY IF EXISTS "Workspace access on personal_notifications" ON public.personal_notifications;
    CREATE POLICY "Workspace access on personal_notifications" ON public.personal_notifications FOR ALL USING (true) WITH CHECK (true);

    -- user_profiles
    DROP POLICY IF EXISTS "Workspace access on user_profiles" ON public.user_profiles;
    CREATE POLICY "Workspace access on user_profiles" ON public.user_profiles FOR ALL USING (true) WITH CHECK (true);
END $$;
