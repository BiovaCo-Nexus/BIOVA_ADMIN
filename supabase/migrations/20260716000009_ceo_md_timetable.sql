-- ═══════════════════════════════════════════════════════════════════
-- CEO and MD Custom Timetable — Database Schema
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.ceo_md_timetable (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role TEXT NOT NULL CHECK (role IN ('ceo', 'md')),
  day_of_week TEXT NOT NULL CHECK (day_of_week IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')),
  start_time TEXT NOT NULL, -- format "HH:MM" e.g., "09:00"
  end_time TEXT NOT NULL, -- format "HH:MM" e.g., "10:00"
  task_title TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'Meeting' CHECK (category IN ('Meeting', 'Review', 'Strategic Planning', 'Operations', 'Personal', 'Other', 'Site Visit', 'Client Call')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ceo_md_timetable ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to view the schedules
CREATE POLICY "ceo_md_timetable_select_policy" ON public.ceo_md_timetable
  FOR SELECT TO authenticated USING (true);

-- Allow authenticated users to manage schedules (CEO and MD can edit, other staff might view)
CREATE POLICY "ceo_md_timetable_insert_policy" ON public.ceo_md_timetable
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "ceo_md_timetable_update_policy" ON public.ceo_md_timetable
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "ceo_md_timetable_delete_policy" ON public.ceo_md_timetable
  FOR DELETE TO authenticated USING (true);
