-- Add payment processing fee settings to invoice_settings table
ALTER TABLE invoice_settings 
ADD COLUMN pass_stripe_fees_to_payer BOOLEAN DEFAULT false,
ADD COLUMN stripe_fee_note TEXT DEFAULT 'A payment processing fee (1.75% + $0.30) and platform fee (1.6%) will be added at checkout to cover transaction costs.',
ADD COLUMN platform_fee_percent NUMERIC(5,2) DEFAULT 1.6;