-- Fix signup error by making username nullable during registration
-- Drop the existing constraint that requires username to be NOT NULL
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS username_format_check;

-- Create a new constraint that allows NULL usernames but validates format when present
ALTER TABLE public.profiles 
ADD CONSTRAINT username_format_check 
CHECK (username IS NULL OR (username ~ '^[a-z0-9]+$' AND LENGTH(username) >= 1));