-- Make title column optional in portfolio_videos table
ALTER TABLE public.portfolio_videos 
ALTER COLUMN title DROP NOT NULL;