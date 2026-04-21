-- Add start_date and end_date columns to job_items table and remove the old item_date column
ALTER TABLE public.job_items 
ADD COLUMN item_start_date DATE,
ADD COLUMN item_end_date DATE;

-- Remove the old item_date column since it has no data
ALTER TABLE public.job_items 
DROP COLUMN item_date;