-- Migration: Create clients from existing jobs and link them
-- This migration extracts unique client information from jobs and creates proper client records

-- First, create clients from unique job client names per user
INSERT INTO public.clients (user_id, venue_name, contact_name, email_address, location, phone)
SELECT DISTINCT ON (user_id, LOWER(TRIM(client)))
  user_id,
  TRIM(client) as venue_name,
  COALESCE(NULLIF(TRIM(contact_name), ''), NULL) as contact_name,
  COALESCE(NULLIF(TRIM(contact_email), ''), NULL) as email_address,
  COALESCE(NULLIF(TRIM(location), ''), NULL) as location,
  COALESCE(NULLIF(TRIM(contact_phone), ''), NULL) as phone
FROM public.jobs 
WHERE user_id IS NOT NULL 
  AND TRIM(client) != ''
  AND NOT EXISTS (
    SELECT 1 FROM public.clients c 
    WHERE c.user_id = jobs.user_id 
    AND LOWER(TRIM(c.venue_name)) = LOWER(TRIM(jobs.client))
  )
ORDER BY user_id, LOWER(TRIM(client)), created_at DESC;

-- Update jobs table to link with the newly created clients
UPDATE public.jobs 
SET client_id = c.id
FROM public.clients c
WHERE jobs.user_id = c.user_id 
  AND LOWER(TRIM(jobs.client)) = LOWER(TRIM(c.venue_name))
  AND jobs.client_id IS NULL;