-- Function to get user_id from username (for public portfolio lookup)
-- Only returns the user id, nothing else - for security
CREATE OR REPLACE FUNCTION public.get_user_id_by_username(lookup_username text)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id 
  FROM profiles 
  WHERE username = lookup_username
  LIMIT 1;
$$;