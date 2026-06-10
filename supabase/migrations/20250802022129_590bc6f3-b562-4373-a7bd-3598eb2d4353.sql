-- Fix function search path for existing functions
ALTER FUNCTION public.generate_application_id() SET search_path = public;
-- ALTER FUNCTION public.update_updated_at_column() SET search_path = public;

-- Enable RLS on missing tables that were already created
-- ALTER TABLE public.visitor_stats ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;