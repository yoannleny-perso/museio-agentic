-- Add global discount field to jobs table
ALTER TABLE public.jobs 
ADD COLUMN discount_percent NUMERIC DEFAULT 0 CHECK (discount_percent >= 0 AND discount_percent <= 100);