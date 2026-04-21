-- Add flyer_image_url column to portfolio_events table
ALTER TABLE public.portfolio_events 
ADD COLUMN flyer_image_url TEXT;