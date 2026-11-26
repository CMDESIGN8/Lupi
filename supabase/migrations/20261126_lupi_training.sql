-- Lupi Training: account-scoped session history and one-time XP rewards.
create table if not exists public.training_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  program_id text not null check (program_id in ('start-7','pro-21','elite-30')),
  day_number integer not null check (day_number between 1 and 30),
  completed_at timestamptz not null default now(),
  constraint training_sessions_user_program_day_unique unique (user_id, program_id, day_number)
);

create index if not exists training_sessions_user_idx
  on public.training_sessions(user_id, program_id);

alter table public.training_sessions enable row level security;
drop policy if exists "Read own training sessions" on public.training_sessions;
create policy "Read own training sessions" on public.training_sessions
  for select to authenticated using (user_id = auth.uid());

revoke insert, update, delete on public.training_sessions from anon, authenticated;
grant select on public.training_sessions to authenticated;

create or replace function public.complete_training_session(
  p_program_id text,
  p_day_number integer
)
returns table(success boolean, total_xp integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_inserted integer;
  v_total_xp integer;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;
  if p_program_id not in ('start-7','pro-21','elite-30') then
    raise exception 'Invalid training program';
  end if;
  if p_day_number < 1 or p_day_number > case p_program_id
    when 'start-7' then 7 when 'pro-21' then 21 else 30 end then
    raise exception 'Invalid training day';
  end if;

  insert into public.training_sessions(user_id, program_id, day_number)
  values (v_user_id, p_program_id, p_day_number)
  on conflict (user_id, program_id, day_number) do nothing;

  get diagnostics v_inserted = row_count;
  if v_inserted = 0 then
    select coalesce(p.exp, 0) into v_total_xp
    from public.profiles p where p.id = v_user_id;
    return query select false, coalesce(v_total_xp, 0);
    return;
  end if;

  update public.profiles
  set exp = coalesce(exp, 0) + 50,
      points = coalesce(points, 0) + 50
  where id = v_user_id
  returning exp into v_total_xp;

  if not found then
    raise exception 'Player profile not found';
  end if;

  return query select true, v_total_xp;
end;
$$;

revoke all on function public.complete_training_session(text, integer) from public;
grant execute on function public.complete_training_session(text, integer) to authenticated;
