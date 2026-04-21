-- Update all portfolio content tables to populate username field from profiles table

-- Update portfolio_videos
UPDATE portfolio_videos 
SET username = profiles.username
FROM profiles 
WHERE portfolio_videos.user_id = profiles.id 
  AND portfolio_videos.username IS NULL
  AND profiles.username IS NOT NULL;

-- Update portfolio_music_releases  
UPDATE portfolio_music_releases 
SET username = profiles.username
FROM profiles 
WHERE portfolio_music_releases.user_id = profiles.id 
  AND portfolio_music_releases.username IS NULL
  AND profiles.username IS NOT NULL;

-- Update portfolio_events
UPDATE portfolio_events 
SET username = profiles.username
FROM profiles 
WHERE portfolio_events.user_id = profiles.id 
  AND portfolio_events.username IS NULL
  AND profiles.username IS NOT NULL;

-- Update portfolio_featured_cards
UPDATE portfolio_featured_cards 
SET username = profiles.username
FROM profiles 
WHERE portfolio_featured_cards.user_id = profiles.id 
  AND portfolio_featured_cards.username IS NULL
  AND profiles.username IS NOT NULL;