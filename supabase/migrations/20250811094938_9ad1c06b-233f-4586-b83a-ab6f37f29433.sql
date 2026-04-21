
-- Ensure RLS is enabled (no-op if already enabled)
alter table public.profiles enable row level security;

-- Remove the public read policy that exposes profiles for public portfolios
drop policy if exists "Public can view profiles with public portfolios" on public.profiles;
