ALTER TABLE public.booking_requests
ADD COLUMN IF NOT EXISTS event_end_date DATE;

UPDATE public.booking_requests
SET event_end_date = event_date
WHERE event_end_date IS NULL;

CREATE INDEX IF NOT EXISTS idx_booking_requests_portfolio_date_range
ON public.booking_requests (portfolio_user_id, event_date, event_end_date);
