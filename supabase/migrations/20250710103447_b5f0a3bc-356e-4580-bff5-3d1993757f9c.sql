-- Add optional pricing_mode column to jobs table for backward compatibility
ALTER TABLE public.jobs 
ADD COLUMN pricing_mode TEXT DEFAULT NULL;

-- Add check constraint to ensure only valid values when not null
ALTER TABLE public.jobs 
ADD CONSTRAINT jobs_pricing_mode_check 
CHECK (pricing_mode IS NULL OR pricing_mode IN ('simple', 'itemized'));

-- Add comment for documentation
COMMENT ON COLUMN public.jobs.pricing_mode IS 'Pricing mode: simple (single rate) or itemized (job items). NULL for backward compatibility with existing jobs.';