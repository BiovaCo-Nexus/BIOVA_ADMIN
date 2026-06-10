-- Add the selected_countdown_id column to post_countdown_content table
ALTER TABLE public.post_countdown_content 
ADD COLUMN IF NOT EXISTS selected_countdown_id UUID;