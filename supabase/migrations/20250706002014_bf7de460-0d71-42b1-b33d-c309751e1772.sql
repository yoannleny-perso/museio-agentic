-- Add client_id foreign key to jobs table (backward compatible)
-- Keep existing client info fields for backward compatibility
ALTER TABLE public.jobs 
ADD COLUMN client_id UUID REFERENCES public.clients(id);

-- Create index for better performance on joins
CREATE INDEX idx_jobs_client_id ON public.jobs(client_id);