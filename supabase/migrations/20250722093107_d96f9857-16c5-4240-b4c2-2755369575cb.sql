
-- Create function to check for unpublished changes across all portfolio tables
CREATE OR REPLACE FUNCTION public.check_portfolio_changes(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  last_published timestamp with time zone;
  has_changes boolean := false;
BEGIN
  -- Get the last published timestamp
  SELECT last_published_at INTO last_published
  FROM public.portfolio_settings 
  WHERE user_id = p_user_id;
  
  -- If never published, there are always changes if any data exists
  IF last_published IS NULL THEN
    -- Check if any portfolio data exists
    SELECT EXISTS (
      SELECT 1 FROM public.portfolio_settings WHERE user_id = p_user_id
      UNION ALL
      SELECT 1 FROM public.portfolio_events WHERE user_id = p_user_id
      UNION ALL
      SELECT 1 FROM public.portfolio_photos WHERE user_id = p_user_id
      UNION ALL
      SELECT 1 FROM public.portfolio_videos WHERE user_id = p_user_id
      UNION ALL
      SELECT 1 FROM public.portfolio_featured_cards WHERE user_id = p_user_id
      UNION ALL
      SELECT 1 FROM public.portfolio_music_releases WHERE user_id = p_user_id
      UNION ALL
      SELECT 1 FROM public.smart_links WHERE user_id = p_user_id
      LIMIT 1
    ) INTO has_changes;
    
    RETURN has_changes;
  END IF;
  
  -- Check for changes since last published
  SELECT EXISTS (
    SELECT 1 FROM public.portfolio_settings 
    WHERE user_id = p_user_id AND updated_at > last_published
    
    UNION ALL
    
    SELECT 1 FROM public.portfolio_events 
    WHERE user_id = p_user_id AND updated_at > last_published
    
    UNION ALL
    
    SELECT 1 FROM public.portfolio_photos 
    WHERE user_id = p_user_id AND updated_at > last_published
    
    UNION ALL
    
    SELECT 1 FROM public.portfolio_videos 
    WHERE user_id = p_user_id AND updated_at > last_published
    
    UNION ALL
    
    SELECT 1 FROM public.portfolio_featured_cards 
    WHERE user_id = p_user_id AND updated_at > last_published
    
    UNION ALL
    
    SELECT 1 FROM public.portfolio_music_releases 
    WHERE user_id = p_user_id AND updated_at > last_published
    
    UNION ALL
    
    SELECT 1 FROM public.smart_links 
    WHERE user_id = p_user_id AND updated_at > last_published
    
    LIMIT 1
  ) INTO has_changes;
  
  RETURN has_changes;
END;
$function$
