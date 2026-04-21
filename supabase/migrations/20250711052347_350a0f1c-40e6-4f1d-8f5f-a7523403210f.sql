-- Add include_super_in_invoices column to bank_details table
ALTER TABLE public.bank_details 
ADD COLUMN include_super_in_invoices BOOLEAN NOT NULL DEFAULT false;

-- Add comment to describe the column
COMMENT ON COLUMN public.bank_details.include_super_in_invoices IS 'Controls whether super fund details appear on invoices';