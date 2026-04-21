-- Add columns to support both pattern-based and date-specific availability
ALTER TABLE public.user_availability 
ADD COLUMN specific_date DATE NULL,
ADD COLUMN is_pattern BOOLEAN DEFAULT false;

-- Update existing records to be treated as patterns
UPDATE public.user_availability 
SET is_pattern = true 
WHERE specific_date IS NULL;

-- Add index for better performance when querying date-specific availability
CREATE INDEX idx_user_availability_specific_date ON public.user_availability(user_id, specific_date) 
WHERE specific_date IS NOT NULL;

-- Add index for pattern-based availability queries
CREATE INDEX idx_user_availability_patterns ON public.user_availability(user_id, day_of_week) 
WHERE is_pattern = true;