
-- Keep profiles table private and allow only owners to access their row

-- Ensure RLS remains enabled (no-op if already enabled)
alter table public.profiles enable row level security;

-- Drop existing owner-scoped policies if they exist (so this is idempotent)
drop policy if exists "Users can view their own profile" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;
drop policy if exists "Users can insert their own profile" on public.profiles;

-- Allow authenticated users to SELECT only their own profile
create policy "Users can view their own profile"
  on public.profiles
  for select
  using (auth.uid() = id);

-- Allow authenticated users to UPDATE only their own profile
create policy "Users can update their own profile"
  on public.profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Allow authenticated users to INSERT their own profile row (used if a row is missing)
create policy "Users can insert their own profile"
  on public.profiles
  for insert
  with check (auth.uid() = id);
