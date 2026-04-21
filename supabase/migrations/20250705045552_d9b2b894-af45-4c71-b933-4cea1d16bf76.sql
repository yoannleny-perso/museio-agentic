-- Add unique constraint to prevent duplicate clients for the same user
ALTER TABLE public.clients 
ADD CONSTRAINT unique_venue_per_user 
UNIQUE (user_id, venue_name);