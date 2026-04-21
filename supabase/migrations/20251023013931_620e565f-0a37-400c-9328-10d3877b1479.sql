-- Create trigger to automatically sync username from profiles to portfolio tables
CREATE TRIGGER sync_username_to_portfolio
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.propagate_username_to_portfolio_tables();

-- Backfill existing usernames from profiles to portfolio_settings where missing/null
UPDATE public.portfolio_settings ps
SET username = p.username,
    updated_at = now()
FROM public.profiles p
WHERE ps.user_id = p.id
  AND p.username IS NOT NULL
  AND btrim(p.username) <> ''
  AND (ps.username IS NULL OR ps.username IS DISTINCT FROM p.username);