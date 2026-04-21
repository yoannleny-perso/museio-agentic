-- Add unique constraint for user_id and display_order combination
-- This ensures each user can only have one photo per display_order (especially important for header photos at display_order 0)
ALTER TABLE public.portfolio_photos 
ADD CONSTRAINT portfolio_photos_user_display_unique 
UNIQUE (user_id, display_order);