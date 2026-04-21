
-- Add RLS policy to allow public access to profiles of users with public portfolios
CREATE POLICY "Public can view profiles with public portfolios" 
ON profiles FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM portfolio_settings 
    WHERE portfolio_settings.user_id = profiles.id 
    AND portfolio_settings.is_public = true
  )
);
