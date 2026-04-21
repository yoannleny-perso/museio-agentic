-- Update existing portfolio_photos to populate username field from profiles table
UPDATE portfolio_photos 
SET username = profiles.username
FROM profiles 
WHERE portfolio_photos.user_id = profiles.id 
  AND portfolio_photos.username IS NULL
  AND profiles.username IS NOT NULL;