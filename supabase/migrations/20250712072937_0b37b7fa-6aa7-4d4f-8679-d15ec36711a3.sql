-- Add RLS policies for portfolio_photos table to fix immediate photo display issue

-- Policy for users to manage their own photos (all operations)
CREATE POLICY "Users can manage their own photos" 
ON public.portfolio_photos 
FOR ALL 
USING (auth.uid() = user_id);

-- Policy for public viewing of photos when portfolio is published
CREATE POLICY "Public can view published photos" 
ON public.portfolio_photos 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM portfolio_settings 
  WHERE portfolio_settings.user_id = portfolio_photos.user_id 
  AND portfolio_settings.is_public = true
));