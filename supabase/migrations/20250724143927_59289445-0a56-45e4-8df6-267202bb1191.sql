-- Fix user_availability constraints to allow both pattern and date-specific records

-- First, drop the existing unique constraint that prevents having both pattern and date-specific records
ALTER TABLE public.user_availability DROP CONSTRAINT IF EXISTS user_availability_user_id_day_of_week_key;

-- Add partial unique constraints to properly separate pattern and date-specific records
-- This allows both pattern records and date-specific records for the same user/day combination

-- Unique constraint for pattern records (recurring weekly availability)
CREATE UNIQUE INDEX IF NOT EXISTS user_availability_pattern_unique 
ON public.user_availability (user_id, day_of_week) 
WHERE is_pattern = true;

-- Unique constraint for date-specific records (one-time availability for specific dates)
CREATE UNIQUE INDEX IF NOT EXISTS user_availability_date_specific_unique 
ON public.user_availability (user_id, specific_date) 
WHERE is_pattern = false AND specific_date IS NOT NULL;

-- Add constraint to ensure data integrity: pattern records should not have specific_date
ALTER TABLE public.user_availability 
ADD CONSTRAINT check_pattern_no_specific_date 
CHECK ((is_pattern = true AND specific_date IS NULL) OR (is_pattern = false));

-- Add constraint to ensure date-specific records have a specific_date
ALTER TABLE public.user_availability 
ADD CONSTRAINT check_date_specific_has_date 
CHECK ((is_pattern = false AND specific_date IS NOT NULL) OR (is_pattern = true));