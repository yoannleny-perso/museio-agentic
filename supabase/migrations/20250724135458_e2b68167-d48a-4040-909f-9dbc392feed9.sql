-- Add username column to user_availability table
ALTER TABLE public.user_availability 
ADD COLUMN username text;