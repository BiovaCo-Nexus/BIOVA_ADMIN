-- Update ceo_md_timetable table to support date-wise events and user assignment
ALTER TABLE ceo_md_timetable ADD COLUMN IF NOT EXISTS event_date DATE;
ALTER TABLE ceo_md_timetable ADD COLUMN IF NOT EXISTS assigned_email TEXT;
ALTER TABLE ceo_md_timetable ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Pending';

-- Optional: You can also update RLS policies if needed, but since it's admin controlled, the existing ones might be sufficient.
