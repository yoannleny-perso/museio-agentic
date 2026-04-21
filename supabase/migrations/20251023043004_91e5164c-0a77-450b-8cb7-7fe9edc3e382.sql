-- Add absorb_payment_fees column to invoice_settings table
ALTER TABLE public.invoice_settings 
ADD COLUMN absorb_payment_fees boolean NOT NULL DEFAULT false;

-- Backfill existing records to have the default value
UPDATE public.invoice_settings 
SET absorb_payment_fees = false 
WHERE absorb_payment_fees IS NULL;