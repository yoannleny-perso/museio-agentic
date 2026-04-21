
-- 1) Trigger function to propagate username changes from profiles
create or replace function public.propagate_username_to_portfolio_tables()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  -- Only perform propagation when username changed and is non-empty
  if TG_OP = 'UPDATE'
     and new.username is not null
     and btrim(new.username) <> ''
     and new.username is distinct from old.username then

    -- portfolio_settings
    update public.portfolio_settings
       set username = new.username,
           updated_at = now()
     where user_id = new.id
       and (username is null or username is distinct from new.username);

    -- portfolio_events
    update public.portfolio_events
       set username = new.username,
           updated_at = now()
     where user_id = new.id
       and (username is null or username is distinct from new.username);

    -- portfolio_featured_cards
    update public.portfolio_featured_cards
       set username = new.username,
           updated_at = now()
     where user_id = new.id
       and (username is null or username is distinct from new.username);

    -- portfolio_music_releases
    update public.portfolio_music_releases
       set username = new.username,
           updated_at = now()
     where user_id = new.id
       and (username is null or username is distinct from new.username);

    -- portfolio_photos
    update public.portfolio_photos
       set username = new.username,
           updated_at = now()
     where user_id = new.id
       and (username is null or username is distinct from new.username);

    -- portfolio_videos
    update public.portfolio_videos
       set username = new.username,
           updated_at = now()
     where user_id = new.id
       and (username is null or username is distinct from new.username);

    -- user_availability
    update public.user_availability
       set username = new.username,
           updated_at = now()
     where user_id = new.id
       and (username is null or username is distinct from new.username);
  end if;

  return new;
end;
$function$;

-- 2) Trigger on profiles to invoke the propagation function after username changes
drop trigger if exists trg_propagate_username_on_profiles on public.profiles;
create trigger trg_propagate_username_on_profiles
after update of username on public.profiles
for each row
execute function public.propagate_username_to_portfolio_tables();

-- 3) One-time backfill to sync existing rows with current profile usernames
-- portfolio_settings
update public.portfolio_settings ps
   set username = p.username,
       updated_at = now()
  from public.profiles p
 where ps.user_id = p.id
   and p.username is not null
   and btrim(p.username) <> ''
   and (ps.username is null or ps.username is distinct from p.username);

-- portfolio_events
update public.portfolio_events t
   set username = p.username,
       updated_at = now()
  from public.profiles p
 where t.user_id = p.id
   and p.username is not null
   and btrim(p.username) <> ''
   and (t.username is null or t.username is distinct from p.username);

-- portfolio_featured_cards
update public.portfolio_featured_cards t
   set username = p.username,
       updated_at = now()
  from public.profiles p
 where t.user_id = p.id
   and p.username is not null
   and btrim(p.username) <> ''
   and (t.username is null or t.username is distinct from p.username);

-- portfolio_music_releases
update public.portfolio_music_releases t
   set username = p.username,
       updated_at = now()
  from public.profiles p
 where t.user_id = p.id
   and p.username is not null
   and btrim(p.username) <> ''
   and (t.username is null or t.username is distinct from p.username);

-- portfolio_photos
update public.portfolio_photos t
   set username = p.username,
       updated_at = now()
  from public.profiles p
 where t.user_id = p.id
   and p.username is not null
   and btrim(p.username) <> ''
   and (t.username is null or t.username is distinct from p.username);

-- portfolio_videos
update public.portfolio_videos t
   set username = p.username,
       updated_at = now()
  from public.profiles p
 where t.user_id = p.id
   and p.username is not null
   and btrim(p.username) <> ''
   and (t.username is null or t.username is distinct from p.username);

-- user_availability
update public.user_availability t
   set username = p.username,
       updated_at = now()
  from public.profiles p
 where t.user_id = p.id
   and p.username is not null
   and btrim(p.username) <> ''
   and (t.username is null or t.username is distinct from p.username);
