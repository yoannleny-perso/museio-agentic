-- Optimize RLS policies by consolidating multiple permissive policies
-- This eliminates performance issues from redundant policy evaluation

-- Portfolio Events Table
DROP POLICY IF EXISTS "Public can view live events" ON public.portfolio_events;
DROP POLICY IF EXISTS "Users can manage their own events" ON public.portfolio_events;

CREATE POLICY "Users can view events (own or public portfolios)" 
ON public.portfolio_events 
FOR SELECT 
USING (
  ((SELECT auth.uid()) = user_id) OR 
  (EXISTS (SELECT 1 FROM portfolio_settings 
           WHERE portfolio_settings.user_id = portfolio_events.user_id 
           AND portfolio_settings.is_public = true))
);

CREATE POLICY "Users can create their own events" 
ON public.portfolio_events 
FOR INSERT 
WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update their own events" 
ON public.portfolio_events 
FOR UPDATE 
USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete their own events" 
ON public.portfolio_events 
FOR DELETE 
USING ((SELECT auth.uid()) = user_id);

-- Portfolio Featured Cards Table
DROP POLICY IF EXISTS "Public can view live featured cards" ON public.portfolio_featured_cards;
DROP POLICY IF EXISTS "Users can manage their own featured cards" ON public.portfolio_featured_cards;

CREATE POLICY "Users can view featured cards (own or public portfolios)" 
ON public.portfolio_featured_cards 
FOR SELECT 
USING (
  ((SELECT auth.uid()) = user_id) OR 
  (EXISTS (SELECT 1 FROM portfolio_settings 
           WHERE portfolio_settings.user_id = portfolio_featured_cards.user_id 
           AND portfolio_settings.is_public = true))
);

CREATE POLICY "Users can create their own featured cards" 
ON public.portfolio_featured_cards 
FOR INSERT 
WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update their own featured cards" 
ON public.portfolio_featured_cards 
FOR UPDATE 
USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete their own featured cards" 
ON public.portfolio_featured_cards 
FOR DELETE 
USING ((SELECT auth.uid()) = user_id);

-- Portfolio Music Releases Table
DROP POLICY IF EXISTS "Public can view live music releases" ON public.portfolio_music_releases;
DROP POLICY IF EXISTS "Users can manage their own music releases" ON public.portfolio_music_releases;

CREATE POLICY "Users can view music releases (own or public portfolios)" 
ON public.portfolio_music_releases 
FOR SELECT 
USING (
  ((SELECT auth.uid()) = user_id) OR 
  (EXISTS (SELECT 1 FROM portfolio_settings 
           WHERE portfolio_settings.user_id = portfolio_music_releases.user_id 
           AND portfolio_settings.is_public = true))
);

CREATE POLICY "Users can create their own music releases" 
ON public.portfolio_music_releases 
FOR INSERT 
WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update their own music releases" 
ON public.portfolio_music_releases 
FOR UPDATE 
USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete their own music releases" 
ON public.portfolio_music_releases 
FOR DELETE 
USING ((SELECT auth.uid()) = user_id);

-- Portfolio Photos Table
DROP POLICY IF EXISTS "Public can view live photos" ON public.portfolio_photos;
DROP POLICY IF EXISTS "Users can manage their own photos" ON public.portfolio_photos;

CREATE POLICY "Users can view photos (own or public portfolios)" 
ON public.portfolio_photos 
FOR SELECT 
USING (
  ((SELECT auth.uid()) = user_id) OR 
  (EXISTS (SELECT 1 FROM portfolio_settings 
           WHERE portfolio_settings.user_id = portfolio_photos.user_id 
           AND portfolio_settings.is_public = true))
);

CREATE POLICY "Users can create their own photos" 
ON public.portfolio_photos 
FOR INSERT 
WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update their own photos" 
ON public.portfolio_photos 
FOR UPDATE 
USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete their own photos" 
ON public.portfolio_photos 
FOR DELETE 
USING ((SELECT auth.uid()) = user_id);

-- Portfolio Videos Table
DROP POLICY IF EXISTS "Public can view live videos" ON public.portfolio_videos;
DROP POLICY IF EXISTS "Users can manage their own videos" ON public.portfolio_videos;

CREATE POLICY "Users can view videos (own or public portfolios)" 
ON public.portfolio_videos 
FOR SELECT 
USING (
  ((SELECT auth.uid()) = user_id) OR 
  (EXISTS (SELECT 1 FROM portfolio_settings 
           WHERE portfolio_settings.user_id = portfolio_videos.user_id 
           AND portfolio_settings.is_public = true))
);

CREATE POLICY "Users can create their own videos" 
ON public.portfolio_videos 
FOR INSERT 
WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update their own videos" 
ON public.portfolio_videos 
FOR UPDATE 
USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete their own videos" 
ON public.portfolio_videos 
FOR DELETE 
USING ((SELECT auth.uid()) = user_id);