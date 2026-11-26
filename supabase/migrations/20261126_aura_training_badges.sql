-- AURA skill badges connected to Lupi personal training.
-- Progress is derived server-side from successful, unique daily minigame attempts.
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

create or replace function public.sync_personal_training_badge()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_badge_key text;
  v_progress integer;
begin
  v_badge_key := case
    when new.stat = 'dribbling' then 'coordination'
    when new.stat = 'pace' then 'speed'
    when new.stat = 'defending' then 'agility'
    when new.stat in ('passing','finishing') then 'technique'
    else null
  end;

  if v_badge_key is null then return new; end if;

  select least(3, count(*)::integer) into v_progress
  from public.personal_training_attempts a
  where a.user_id = new.user_id
    and (
      (v_badge_key = 'coordination' and a.stat = 'dribbling')
      or (v_badge_key = 'speed' and a.stat = 'pace')
      or (v_badge_key = 'agility' and a.stat = 'defending')
      or (v_badge_key = 'technique' and a.stat in ('passing','finishing'))
    );

  insert into public.personal_training_badges(user_id, badge_key, progress, unlocked_at, updated_at)
  values (
    new.user_id,
    v_badge_key,
    v_progress,
    case when v_progress >= 3 then now() else null end,
    now()
  )
  on conflict (user_id, badge_key) do update
  set progress = greatest(public.personal_training_badges.progress, excluded.progress),
      unlocked_at = coalesce(public.personal_training_badges.unlocked_at, excluded.unlocked_at),
      updated_at = now();

  return new;
end;
$$;

drop trigger if exists personal_training_badge_after_attempt on public.personal_training_attempts;
create trigger personal_training_badge_after_attempt
after insert on public.personal_training_attempts
for each row execute function public.sync_personal_training_badge();

-- Seed zero-progress rows so the four badges are visible from the first visit.
insert into public.personal_training_badges(user_id, badge_key, progress)
select p.id, b.badge_key, 0
from public.profiles p
cross join (values ('coordination'),('speed'),('agility'),('technique')) as b(badge_key)
on conflict (user_id, badge_key) do nothing;

notify pgrst, 'reload schema';
