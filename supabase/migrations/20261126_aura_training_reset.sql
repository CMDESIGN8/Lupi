-- AURA Training resettable progress with permanent player rewards.
-- The cycle table controls visible exercise progress. Original drill records and
-- player-card rewards remain untouched, preventing XP/stat farming after reset.

create table if not exists public.personal_training_cycle_drills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  skill_key text not null check (skill_key in ('coordination','speed','agility','technique')),
  exercise_index integer not null check (exercise_index between 0 and 2),
  completed_at timestamptz not null default now(),
  constraint personal_training_cycle_drills_unique unique(user_id, skill_key, exercise_index)
);

create index if not exists personal_training_cycle_drills_user_idx
  on public.personal_training_cycle_drills(user_id, skill_key);

alter table public.personal_training_cycle_drills enable row level security;
drop policy if exists "Read own personal training cycle drills" on public.personal_training_cycle_drills;
create policy "Read own personal training cycle drills"
  on public.personal_training_cycle_drills for select to authenticated
  using (user_id = auth.uid());

revoke insert, update, delete on public.personal_training_cycle_drills from anon, authenticated;
grant select on public.personal_training_cycle_drills to authenticated;

-- Preserve the progress users already had when this feature is deployed.
insert into public.personal_training_cycle_drills(user_id, skill_key, exercise_index, completed_at)
select user_id, skill_key, exercise_index, completed_at
from public.personal_training_drills
on conflict (user_id, skill_key, exercise_index) do nothing;

create or replace function public.record_personal_training_cycle_drill(
  p_skill_key text,
  p_exercise_index integer
)
returns table(success boolean, progress integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_inserted integer;
  v_progress integer;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if p_skill_key not in ('coordination','speed','agility','technique') then
    raise exception 'Invalid training skill';
  end if;
  if p_exercise_index < 0 or p_exercise_index > 2 then
    raise exception 'Invalid training exercise';
  end if;

  insert into public.personal_training_cycle_drills(user_id, skill_key, exercise_index)
  values (v_user_id, p_skill_key, p_exercise_index)
  on conflict (user_id, skill_key, exercise_index) do nothing;
  get diagnostics v_inserted = row_count;

  select count(*)::integer into v_progress
  from public.personal_training_cycle_drills
  where user_id = v_user_id and skill_key = p_skill_key;

  return query select (v_inserted > 0), least(3, v_progress);
end;
$$;

create or replace function public.reset_personal_training_cycle()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;

  delete from public.personal_training_cycle_drills
  where user_id = v_user_id;

  return true;
end;
$$;

revoke all on function public.record_personal_training_cycle_drill(text,integer) from public;
revoke all on function public.reset_personal_training_cycle() from public;
grant execute on function public.record_personal_training_cycle_drill(text,integer) to authenticated;
grant execute on function public.reset_personal_training_cycle() to authenticated;

notify pgrst, 'reload schema';
