-- Fix existing music releases with null username
UPDATE portfolio_music_releases 
SET username = (
  SELECT profiles.username 
  FROM profiles 
  WHERE profiles.id = portfolio_music_releases.user_id
)
WHERE username IS NULL;