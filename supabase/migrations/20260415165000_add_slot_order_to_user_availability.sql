ALTER TABLE public.user_availability
ADD COLUMN IF NOT EXISTS slot_order integer NOT NULL DEFAULT 0;

UPDATE public.user_availability
SET slot_order = 0
WHERE slot_order IS NULL;

DROP INDEX IF EXISTS public.user_availability_pattern_unique;
DROP INDEX IF EXISTS public.user_availability_date_specific_unique;

CREATE UNIQUE INDEX IF NOT EXISTS user_availability_pattern_unique
ON public.user_availability (user_id, day_of_week, slot_order)
WHERE is_pattern = true;

CREATE UNIQUE INDEX IF NOT EXISTS user_availability_date_specific_unique
ON public.user_availability (user_id, specific_date, slot_order)
WHERE is_pattern = false AND specific_date IS NOT NULL;
