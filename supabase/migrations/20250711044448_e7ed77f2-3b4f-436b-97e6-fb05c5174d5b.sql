-- Remove date and time columns from job_items table
ALTER TABLE public.job_items 
DROP COLUMN IF EXISTS item_start_date,
DROP COLUMN IF EXISTS item_end_date,
DROP COLUMN IF EXISTS item_start_time,
DROP COLUMN IF EXISTS item_end_time,
DROP COLUMN IF EXISTS copy_from_first_item;