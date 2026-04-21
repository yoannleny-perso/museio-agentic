-- Remove payment processing fee settings from invoice_settings table
-- These settings are now hardcoded in the edge function for consistency
ALTER TABLE invoice_settings 
DROP COLUMN IF EXISTS pass_stripe_fees_to_payer,
DROP COLUMN IF EXISTS stripe_fee_note,
DROP COLUMN IF EXISTS platform_fee_percent;