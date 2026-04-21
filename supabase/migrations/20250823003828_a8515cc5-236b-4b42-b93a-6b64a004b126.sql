-- Remove is_featured column from portfolio_music_releases table
ALTER TABLE public.portfolio_music_releases DROP COLUMN IF EXISTS is_featured;