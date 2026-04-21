-- Create job_items table for storing individual line items
CREATE TABLE public.job_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL,
  item_name TEXT NOT NULL,
  unit_cost NUMERIC NOT NULL CHECK (unit_cost >= 0),
  quantity NUMERIC NOT NULL DEFAULT 1 CHECK (quantity > 0),
  discount_percent NUMERIC DEFAULT 0 CHECK (discount_percent >= 0 AND discount_percent <= 100),
  is_taxable BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add foreign key constraint to jobs table
ALTER TABLE public.job_items 
ADD CONSTRAINT job_items_job_id_fkey 
FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE CASCADE;

-- Create index for better query performance
CREATE INDEX idx_job_items_job_id ON public.job_items(job_id);
CREATE INDEX idx_job_items_sort_order ON public.job_items(job_id, sort_order);

-- Enable Row Level Security
ALTER TABLE public.job_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for job_items
CREATE POLICY "Users can view their own job items" 
ON public.job_items 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.jobs 
    WHERE jobs.id = job_items.job_id 
    AND jobs.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create job items for their own jobs" 
ON public.job_items 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.jobs 
    WHERE jobs.id = job_items.job_id 
    AND jobs.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own job items" 
ON public.job_items 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.jobs 
    WHERE jobs.id = job_items.job_id 
    AND jobs.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own job items" 
ON public.job_items 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.jobs 
    WHERE jobs.id = job_items.job_id 
    AND jobs.user_id = auth.uid()
  )
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_job_items_updated_at
BEFORE UPDATE ON public.job_items
FOR EACH ROW
EXECUTE FUNCTION public.update_modified_column();