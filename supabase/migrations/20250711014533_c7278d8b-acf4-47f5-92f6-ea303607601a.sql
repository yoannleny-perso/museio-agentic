-- Add super fund details columns to bank_details table
ALTER TABLE public.bank_details 
ADD COLUMN fund_name TEXT,
ADD COLUMN member_number TEXT,
ADD COLUMN fund_abn TEXT,
ADD COLUMN fund_usi TEXT;