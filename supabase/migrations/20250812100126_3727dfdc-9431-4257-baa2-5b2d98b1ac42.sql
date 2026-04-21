
-- Add a column to store the last quoted price for a booking request
ALTER TABLE public.booking_requests
ADD COLUMN IF NOT EXISTS quoted_price numeric;
