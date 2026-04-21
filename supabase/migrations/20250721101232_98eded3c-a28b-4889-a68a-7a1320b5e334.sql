
-- Add order field to existing social_links data in portfolio_settings
-- This will set default order values for existing social links based on a predefined sequence

UPDATE portfolio_settings 
SET social_links = (
  SELECT jsonb_agg(
    CASE 
      WHEN link->>'platform' = 'instagram' THEN jsonb_set(link, '{order}', '0')
      WHEN link->>'platform' = 'facebook' THEN jsonb_set(link, '{order}', '1')
      WHEN link->>'platform' = 'soundcloud' THEN jsonb_set(link, '{order}', '2')
      WHEN link->>'platform' = 'tiktok' THEN jsonb_set(link, '{order}', '3')
      WHEN link->>'platform' = 'youtube' THEN jsonb_set(link, '{order}', '4')
      WHEN link->>'platform' = 'spotify' THEN jsonb_set(link, '{order}', '5')
      WHEN link->>'platform' = 'apple-music' THEN jsonb_set(link, '{order}', '6')
      WHEN link->>'platform' = 'twitter' THEN jsonb_set(link, '{order}', '7')
      WHEN link->>'platform' = 'bandcamp' THEN jsonb_set(link, '{order}', '8')
      WHEN link->>'platform' = 'email' THEN jsonb_set(link, '{order}', '9')
      WHEN link->>'platform' = 'linkedin' THEN jsonb_set(link, '{order}', '10')
      WHEN link->>'platform' = 'discord' THEN jsonb_set(link, '{order}', '11')
      WHEN link->>'platform' = 'twitch' THEN jsonb_set(link, '{order}', '12')
      WHEN link->>'platform' = 'patreon' THEN jsonb_set(link, '{order}', '13')
      WHEN link->>'platform' = 'mixcloud' THEN jsonb_set(link, '{order}', '14')
      WHEN link->>'platform' = 'beatport' THEN jsonb_set(link, '{order}', '15')
      ELSE jsonb_set(link, '{order}', '999')
    END
  )
  FROM jsonb_array_elements(social_links) AS link
)
WHERE social_links IS NOT NULL 
AND jsonb_array_length(social_links) > 0
AND NOT EXISTS (
  SELECT 1 
  FROM jsonb_array_elements(social_links) AS link 
  WHERE link ? 'order'
);
