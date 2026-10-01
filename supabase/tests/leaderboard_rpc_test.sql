-- Leaderboard RPC test. Run in the Supabase SQL Editor: it creates fake players, checks
-- ranking/ties/hidden players/own-row behaviour, then ALWAYS rolls back by raising an
-- exception (the results are in the error message). Nothing is saved.
-- Needs a role allowed to `set local session_replication_role = replica` (the SQL Editor is).

do $$
declare
  wk date := (date_trunc('week', now() at time zone 'utc'))::date;
  a uuid := gen_random_uuid();
  b uuid := gen_random_uuid();
  c uuid := gen_random_uuid();
  d uuid := gen_random_uuid();
  e uuid := gen_random_uuid();
  me uuid := gen_random_uuid();
  out text := '';
  r record;
begin
  -- Fake players. FK checks and triggers are skipped for this transaction only,
  -- so the weekly columns are written directly (the trigger is tested separately).
  set local session_replication_role = replica;

  insert into public.profiles (id, display_name, hide_from_leaderboard) values
    (a, 'A-ana', false), (b, 'B-bo', false), (c, 'C-cy', false),
    (d, 'D-hidden', true), (e, 'E-eve', false), (me, 'F-me', false);

  --                            user  xp    level weekly  week
  insert into public.user_data (user_id, xp, level, weekly_xp, weekly_xp_week) values
    (a,  1300, 2, 300, wk),
    (b,  2300, 3, 300, wk),
    (c,   600, 1, 100, wk),
    (d,   900, 1, 900, wk),
    (e,  8000, 9,   0, wk),
    (me,   50, 1,  50, wk);

  -- Act as player "me" (what auth.uid() sees inside the function).
  perform set_config('request.jwt.claims', json_build_object('sub', me)::text, true);

  out := out || E'\n-- weekly, limit 50  [want: A,B tie @1 | C @3 | me @4 | hidden D and zero-score E absent]';
  for r in select * from public.get_leaderboard('weekly', 50) where user_id in (a,b,c,d,e,me) loop
    out := out || format(E'\n   place=%s %s level=%s score=%s is_me=%s', r.place, r.display_name, r.level, r.score, r.is_me);
  end loop;

  out := out || E'\n-- weekly, limit 2  [want: A,B @1 and my own row (me @4) even though I am outside the top 2; C absent]';
  for r in select * from public.get_leaderboard('weekly', 2) where user_id in (a,b,c,d,e,me) loop
    out := out || format(E'\n   place=%s %s score=%s is_me=%s', r.place, r.display_name, r.score, r.is_me);
  end loop;

  out := out || E'\n-- all_time, limit 50  [want: E 8000 @1, B 2300 @2, A 1300 @3, C 600 @4, me 50 @5; hidden D absent]';
  for r in select * from public.get_leaderboard('all_time', 50) where user_id in (a,b,c,d,e,me) loop
    out := out || format(E'\n   place=%s %s score=%s is_me=%s', r.place, r.display_name, r.score, r.is_me);
  end loop;

  -- A stale week must not count toward "this week".
  update public.user_data set weekly_xp_week = wk - 7 where user_id = a;
  out := out || E'\n-- weekly after A''s XP is from LAST week  [want: A absent]';
  for r in select * from public.get_leaderboard('weekly', 50) where user_id in (a,b,c,d,e,me) loop
    out := out || format(E'\n   place=%s %s score=%s', r.place, r.display_name, r.score);
  end loop;

  -- Opting out through the RPC, as player "me".
  perform public.set_leaderboard_hidden(true);
  select hide_from_leaderboard into r from public.profiles where id = me;
  out := out || format(E'\n-- set_leaderboard_hidden(true) as me: flag=%s  [want true]', r.hide_from_leaderboard);
  select count(*) as n into r from public.get_leaderboard('all_time', 50) where user_id = me;
  out := out || format(E'\n   rows for me after opting out: %s  [want 0]', r.n);

  -- Other players' flags are untouched.
  select hide_from_leaderboard into r from public.profiles where id = a;
  out := out || format(E'\n   A''s flag still: %s  [want false]', r.hide_from_leaderboard);

  raise exception E'BOARD TEST RESULTS (rolled back):%', out;
end
$$;
