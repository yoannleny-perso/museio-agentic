-- Add section_id columns to tables that don't have them yet

-- Add section_id to portfolio_videos table
ALTER TABLE public.portfolio_videos 
ADD COLUMN IF NOT EXISTS section_id text;

-- Add section_id to portfolio_photos table  
ALTER TABLE public.portfolio_photos 
ADD COLUMN IF NOT EXISTS section_id text;

-- Add section_id to portfolio_featured_cards table
ALTER TABLE public.portfolio_featured_cards 
ADD COLUMN IF NOT EXISTS section_id text;

-- Add section_id to portfolio_music_releases table
ALTER TABLE public.portfolio_music_releases 
ADD COLUMN IF NOT EXISTS section_id text;

-- Create indexes for better performance on section_id lookups
CREATE INDEX IF NOT EXISTS idx_portfolio_videos_section_id ON public.portfolio_videos(section_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_photos_section_id ON public.portfolio_photos(section_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_events_section_id ON public.portfolio_events(section_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_featured_cards_section_id ON public.portfolio_featured_cards(section_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_music_releases_section_id ON public.portfolio_music_releases(section_id);