-- AURA physical-training challenges and persistent skill badges for Lupi.
-- Each skill has three real-world exercises. Completing all three grants 50 XP
-- and permanently unlocks its AURA badge on the authenticated player's profile.

create table if not exists public.personal_training_drills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  skill_key text not null check (skill_key in ('coordination','speed','agility','technique')),
  exercise_index integer not null check (exercise_index between 0 and 2),
  completed_at timestamptz not null default now(),
  constraint personal_training_drills_unique unique(user_id, skill_key, exercise_index)
);

create index if not exists personal_training_drills_user_idx
  on public.personal_training_drills(user_id, skill_key);

alter table public.personal_training_drills enable row level security;
drop policy if exists "Read own personal training drills" on public.personal_training_drills;
create policy "Read own personal training drills"
  on public.personal_training_drills for select to authenticated
  using (user_id = auth.uid());
revoke insert, update, delete on public.personal_training_drills from anon, authenticated;
grant select on public.personal_training_drills to authenticated;

create table if not exists public.personal_training_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  badge_key text not null check (badge_key in ('coordination','speed','agility','technique')),
  progress integer not null default 0 check (progress between 0 and 3),
  unlocked_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint personal_training_badges_user_badge_unique unique(user_id, badge_key)
);

create index if not exists personal_training_badges_user_idx
  on public.personal_training_badges(user_id);

alter table public.personal_training_badges enable row level security;
drop policy if exists "Read own personal training badges" on public.personal_training_badges;
create policy "Read own personal training badges"
  on public.personal_training_badges for select to authenticated
  using (user_id = auth.uid());
revoke insert, update, delete on public.personal_training_badges from anon, authenticated;
grant select on public.personal_training_badges to authenticated;

-- Remove the earlier minigame-based badge trigger: AURA badges are earned by
-- completing the three physical exercises in each skill, not by arcade scores.
drop trigger if exists personal_training_badge_after_attempt on public.personal_training_attempts;
drop function if exists public.sync_personal_training_badge();

-- Seed empty badges and backfill progress for any drill records already present.
insert into public.personal_training_badges(user_id, badge_key, progress)
select p.id, b.badge_key, 0
from public.profiles p
cross join (values ('coordination'),('speed'),('agility'),('technique')) as b(badge_key)
on conflict (user_id, badge_key) do nothing;

create or replace function public.complete_personal_training_drill(
  p_skill_key text,
  p_exercise_index integer
)
returns table(success boolean, progress integer, xp_awarded integer, badge_unlocked boolean, user_card_exp integer, user_card_level integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_progress integer;
  v_inserted integer;
  v_xp integer := 0;
  v_exp integer;
  v_level integer;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if p_skill_key not in ('coordination','speed','agility','technique') then
    raise exception 'Invalid training skill';
  end if;
  if p_exercise_index < 0 or p_exercise_index > 2 then
    raise exception 'Invalid training exercise';
  end if;

  perform 1 from public.profiles where id = v_user_id for update;
  if not found then raise exception 'Player profile not found'; end if;

  insert into public.personal_training_drills(user_id, skill_key, exercise_index)
  values (v_user_id, p_skill_key, p_exercise_index)
  on conflict (user_id, skill_key, exercise_index) do nothing;

  get diagnostics v_inserted = row_count;

  select count(*)::integer into v_progress
  from public.personal_training_drills
  where user_id = v_user_id and skill_key = p_skill_key;

  if v_inserted > 0 and v_progress = 3 then
    v_xp := 50;
    update public.profiles
    set user_card_exp = coalesce(user_card_exp,0) + v_xp,
        user_card_level = greatest(1, floor((coalesce(user_card_exp,0)+v_xp)/100.0)::integer + 1)
    where id = v_user_id;
  end if;

  insert into public.personal_training_badges as current_badge(user_id, badge_key, progress, unlocked_at, updated_at)
  values (
    v_user_id,
    p_skill_key,
    least(3,v_progress),
    case when v_progress = 3 then now() else null end,
    now()
  )
  on conflict (user_id, badge_key) do update
  set progress = greatest(current_badge.progress, excluded.progress),
      unlocked_at = coalesce(current_badge.unlocked_at, excluded.unlocked_at),
      updated_at = now();

  select coalesce(user_card_exp,0), coalesce(user_card_level,1)
  into v_exp, v_level
  from public.profiles where id = v_user_id;

  return query select (v_inserted > 0), least(3,v_progress), v_xp, (v_progress = 3), v_exp, v_level;
end;
$$;

revoke all on function public.complete_personal_training_drill(text,integer) from public;
grant execute on function public.complete_personal_training_drill(text,integer) to authenticated;

notify pgrst, 'reload schema';
