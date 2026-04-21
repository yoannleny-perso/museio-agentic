
-- Drop production tables
DROP TABLE IF EXISTS public.portfolio_settings_prod CASCADE;
DROP TABLE IF EXISTS public.portfolio_events_prod CASCADE;
DROP TABLE IF EXISTS public.portfolio_photos_prod CASCADE;
DROP TABLE IF EXISTS public.portfolio_videos_prod CASCADE;
DROP TABLE IF EXISTS public.portfolio_featured_cards_prod CASCADE;
DROP TABLE IF EXISTS public.portfolio_music_releases_prod CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS public.publish_portfolio_to_production(uuid);
DROP FUNCTION IF EXISTS public.check_portfolio_changes(uuid);

-- Remove is_live and last_published_at columns from portfolio_settings
ALTER TABLE public.portfolio_settings 
DROP COLUMN IF EXISTS is_live,
DROP COLUMN IF EXISTS last_published_at;

-- Update RLS policies for live access using working tables
DROP POLICY IF EXISTS "Public can view published events" ON public.portfolio_events;
DROP POLICY IF EXISTS "Public can view published photos" ON public.portfolio_photos;
DROP POLICY IF EXISTS "Public can view published videos" ON public.portfolio_videos;
DROP POLICY IF EXISTS "Public can view published featured cards" ON public.portfolio_featured_cards;
DROP POLICY IF EXISTS "Public can view published music releases" ON public.portfolio_music_releases;
DROP POLICY IF EXISTS "Public can view published smart links" ON public.smart_links;

-- Create new RLS policies for public access when is_public is true
CREATE POLICY "Public can view live events" ON public.portfolio_events
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.portfolio_settings 
    WHERE portfolio_settings.user_id = portfolio_events.user_id 
    AND portfolio_settings.is_public = true
  )
);

CREATE POLICY "Public can view live photos" ON public.portfolio_photos
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.portfolio_settings 
    WHERE portfolio_settings.user_id = portfolio_photos.user_id 
    AND portfolio_settings.is_public = true
  )
);

CREATE POLICY "Public can view live videos" ON public.portfolio_videos
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.portfolio_settings 
    WHERE portfolio_settings.user_id = portfolio_videos.user_id 
    AND portfolio_settings.is_public = true
  )
);

CREATE POLICY "Public can view live featured cards" ON public.portfolio_featured_cards
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.portfolio_settings 
    WHERE portfolio_settings.user_id = portfolio_featured_cards.user_id 
    AND portfolio_settings.is_public = true
  )
);

CREATE POLICY "Public can view live music releases" ON public.portfolio_music_releases
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.portfolio_settings 
    WHERE portfolio_settings.user_id = portfolio_music_releases.user_id 
    AND portfolio_settings.is_public = true
  )
);

CREATE POLICY "Public can view live smart links" ON public.smart_links
FOR SELECT USING (
  is_visible = true AND EXISTS (
    SELECT 1 FROM public.portfolio_settings 
    WHERE portfolio_settings.user_id = smart_links.user_id 
    AND portfolio_settings.is_public = true
  )
);

-- Add RLS policy for portfolio_settings to allow public read when is_public is true
CREATE POLICY "Public can view live portfolio settings" ON public.portfolio_settings
FOR SELECT USING (is_public = true);
