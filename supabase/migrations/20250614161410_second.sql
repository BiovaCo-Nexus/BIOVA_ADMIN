
-- Step 1: Create table for storing admin remarks/messages to applicants
CREATE TABLE public.application_remarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id TEXT NOT NULL,
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  admin_name TEXT,
  sender_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- (Optional) Index for faster lookup by application_id
CREATE INDEX idx_application_remarks_application_id ON public.application_remarks(application_id);

-- (Optional) Index for faster lookup by to_email
CREATE INDEX idx_application_remarks_to_email ON public.application_remarks(to_email);

