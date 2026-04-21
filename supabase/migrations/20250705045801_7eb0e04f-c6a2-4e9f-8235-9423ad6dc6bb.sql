-- Clean up duplicate clients, keeping the most recent one for each user+venue combination
WITH ranked_clients AS (
  SELECT 
    *,
    ROW_NUMBER() OVER (
      PARTITION BY user_id, venue_name 
      ORDER BY created_at DESC, updated_at DESC
    ) as rn
  FROM public.clients
),
duplicates_to_delete AS (
  SELECT id FROM ranked_clients WHERE rn > 1
)
DELETE FROM public.clients 
WHERE id IN (SELECT id FROM duplicates_to_delete);

-- Now add the unique constraint to prevent future duplicates
ALTER TABLE public.clients 
ADD CONSTRAINT unique_venue_per_user 
UNIQUE (user_id, venue_name);