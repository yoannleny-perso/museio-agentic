-- Add username field to all portfolio tables for direct username-based queries

-- Add username column to portfolio_settings
ALTER TABLE public.portfolio_settings 
ADD COLUMN username TEXT;

-- Add username column to portfolio_photos
ALTER TABLE public.portfolio_photos 
ADD COLUMN username TEXT;

-- Add username column to portfolio_videos
ALTER TABLE public.portfolio_videos 
ADD COLUMN username TEXT;

-- Add username column to portfolio_music_releases
ALTER TABLE public.portfolio_music_releases 
ADD COLUMN username TEXT;

-- Add username column to portfolio_events
ALTER TABLE public.portfolio_events 
ADD COLUMN username TEXT;

-- Add username column to portfolio_featured_cards
ALTER TABLE public.portfolio_featured_cards 
ADD COLUMN username TEXT;

-- Populate existing records with usernames from profiles table
UPDATE public.portfolio_settings 
SET username = p.username 
FROM public.profiles p 
WHERE portfolio_settings.user_id = p.id 
AND p.username IS NOT NULL;

UPDATE public.portfolio_photos 
SET username = p.username 
FROM public.profiles p 
WHERE portfolio_photos.user_id = p.id 
AND p.username IS NOT NULL;

UPDATE public.portfolio_videos 
SET username = p.username 
FROM public.profiles p 
WHERE portfolio_videos.user_id = p.id 
AND p.username IS NOT NULL;

UPDATE public.portfolio_music_releases 
SET username = p.username 
FROM public.profiles p 
WHERE portfolio_music_releases.user_id = p.id 
AND p.username IS NOT NULL;

UPDATE public.portfolio_events 
SET username = p.username 
FROM public.profiles p 
WHERE portfolio_events.user_id = p.id 
AND p.username IS NOT NULL;

UPDATE public.portfolio_featured_cards 
SET username = p.username 
FROM public.profiles p 
WHERE portfolio_featured_cards.user_id = p.id 
AND p.username IS NOT NULL;

-- Create indexes for better performance on username lookups
CREATE INDEX IF NOT EXISTS idx_portfolio_settings_username ON public.portfolio_settings(username);
CREATE INDEX IF NOT EXISTS idx_portfolio_photos_username ON public.portfolio_photos(username);
CREATE INDEX IF NOT EXISTS idx_portfolio_videos_username ON public.portfolio_videos(username);
CREATE INDEX IF NOT EXISTS idx_portfolio_music_releases_username ON public.portfolio_music_releases(username);
CREATE INDEX IF NOT EXISTS idx_portfolio_events_username ON public.portfolio_events(username);
CREATE INDEX IF NOT EXISTS idx_portfolio_featured_cards_username ON public.portfolio_featured_cards(username);