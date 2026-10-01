-- SongGap leaderboard.
--
-- HOW TO APPLY: open the SQL Editor of the Supabase project this app uses
-- (the one in NEXT_PUBLIC_SUPABASE_URL), paste this whole file and run it.
-- It is additive and safe to run more than once. Until it has run, the app
-- keeps working exactly as before and the /leaderboard page says the ranking
-- isn't set up yet.

-- ---------------------------------------------------------------------------
-- Columns
-- ---------------------------------------------------------------------------

alter table public.user_data
  add column if not exists weekly_xp integer not null default 0,
  add column if not exists weekly_xp_week date;

-- Players can opt out of the public ranking (Settings > Privacy).
alter table public.profiles
  add column if not exists hide_from_leaderboard boolean not null default false;

create index if not exists user_data_weekly_rank_idx
  on public.user_data (weekly_xp_week, weekly_xp desc);

-- ---------------------------------------------------------------------------
-- Weekly XP, tracked on the server
-- ---------------------------------------------------------------------------
-- The browser only ever upserts `xp` (the lifetime total). This trigger turns
-- every increase of `xp` into weekly XP, so the app needs no extra writes and
-- a client can't simply overwrite the weekly columns: whatever it sends for
-- them is ignored.
--
-- Weeks run Monday 00:00 -> Monday 00:00 UTC (ISO week, same for everyone).

create or replace function public.track_weekly_xp()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  this_week date := (date_trunc('week', now() at time zone 'utc'))::date;
  carried   integer;
begin
  if tg_op = 'INSERT' then
    -- A first row (e.g. progress imported from before accounts existed) must
    -- not count its history as this week's XP.
    new.weekly_xp := 0;
    new.weekly_xp_week := this_week;
    return new;
  end if;

  carried := case when old.weekly_xp_week = this_week then old.weekly_xp else 0 end;

  if new.xp < old.xp then
    -- Progress was reset.
    new.weekly_xp := 0;
  else
    new.weekly_xp := carried + (new.xp - old.xp);
  end if;
  new.weekly_xp_week := this_week;
  return new;
end;
$$;

drop trigger if exists user_data_track_weekly_xp on public.user_data;
create trigger user_data_track_weekly_xp
  before insert or update on public.user_data
  for each row execute function public.track_weekly_xp();

-- ---------------------------------------------------------------------------
-- Reading the ranking
-- ---------------------------------------------------------------------------
-- SECURITY DEFINER because `user_data` is private to each player. The function
-- exposes only display name, level and the score — never email or anything
-- else — and skips players who opted out.
--
-- p_period: 'weekly' (default) or 'all_time'.
-- Returns the top p_limit (max 100) plus the caller's own row, wherever it is.

create or replace function public.get_leaderboard(
  p_period text default 'weekly',
  p_limit  integer default 50
)
returns table (
  place        bigint,
  user_id      uuid,
  display_name text,
  level        integer,
  score        bigint,
  is_me        boolean
)
language sql
stable
security definer
set search_path = public
as $$
  with this_week as (
    select (date_trunc('week', now() at time zone 'utc'))::date as starts_on
  ),
  scored as (
    select
      ud.user_id,
      coalesce(nullif(trim(p.display_name), ''), 'Player') as display_name,
      ud.level::integer as level,
      case
        when p_period = 'all_time' then ud.xp::bigint
        when ud.weekly_xp_week = (select starts_on from this_week) then ud.weekly_xp::bigint
        else 0::bigint
      end as score
    from public.user_data ud
    join public.profiles p on p.id = ud.user_id
    where not p.hide_from_leaderboard
  ),
  ranked as (
    select rank() over (order by score desc) as place, *
    from scored
    where score > 0
  )
  select place, user_id, display_name, level, score, (user_id = auth.uid()) as is_me
  from ranked
  where place <= greatest(1, least(coalesce(p_limit, 50), 100))
     or user_id = auth.uid()
  order by place, display_name
$$;

revoke all on function public.get_leaderboard(text, integer) from public, anon;
grant execute on function public.get_leaderboard(text, integer) to authenticated;

-- ---------------------------------------------------------------------------
-- Opting out
-- ---------------------------------------------------------------------------
-- A function (rather than a client-side UPDATE) so it works whatever the row
-- level security on `profiles` is, and can only ever touch the caller's own
-- `hide_from_leaderboard` flag — nothing like `is_admin`.

create or replace function public.set_leaderboard_hidden(p_hidden boolean)
returns void
language sql
security definer
set search_path = public
as $$
  update public.profiles
     set hide_from_leaderboard = coalesce(p_hidden, false)
   where id = auth.uid();
$$;

revoke all on function public.set_leaderboard_hidden(boolean) from public, anon;
grant execute on function public.set_leaderboard_hidden(boolean) to authenticated;
