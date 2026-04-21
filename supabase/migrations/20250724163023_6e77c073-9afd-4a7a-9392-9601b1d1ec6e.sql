-- Change start_time and end_time columns from time to text to support next-day times
ALTER TABLE public.user_availability 
ALTER COLUMN start_time TYPE text USING start_time::text,
ALTER COLUMN end_time TYPE text USING end_time::text;

-- Update existing time values to remove seconds for consistency
UPDATE public.user_availability 
SET start_time = SUBSTR(start_time, 1, 5),
    end_time = SUBSTR(end_time, 1, 5)
WHERE start_time LIKE '%:%:%' OR end_time LIKE '%:%:%';