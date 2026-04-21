-- Add copy_from_first_item field to job_items table
ALTER TABLE public.job_items 
ADD COLUMN copy_from_first_item BOOLEAN NOT NULL DEFAULT false;