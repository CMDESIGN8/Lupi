-- Personal card training: minigames upgrade the authenticated user's own profiles card.
create table if not exists public.personal_training_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  training_date date not null default (timezone('America/Argentina/Buenos_Aires', now()))::date,
  game_id text not null check (game_id in ('shooting','dribbling','defending','passing','physical','pace')),
  stat text not null check (stat in ('finishing','dribbling','defending','passing','physical','pace')),
  grade text not null check (grade in ('S','A','B','C')),
  delta integer not null check (delta between 1 and 8),
  xp_awarded integer not null check (xp_awarded between 0 and 200),
  created_at timestamptz not null default now(),
  constraint personal_training_attempts_daily_game_unique unique(user_id, training_date, game_id)
);

create index if not exists personal_training_attempts_user_date_idx
  on public.personal_training_attempts(user_id, training_date desc);

alter table public.personal_training_attempts enable row level security;
drop policy if exists "Read own personal training attempts" on public.personal_training_attempts;
create policy "Read own personal training attempts"
  on public.personal_training_attempts for select to authenticated
  using (user_id = auth.uid());
revoke insert, update, delete on public.personal_training_attempts from anon, authenticated;
grant select on public.personal_training_attempts to authenticated;

create or replace function public.complete_personal_training(
  p_game_id text,
  p_stat text,
  p_grade text,
  p_delta integer,
  p_xp_bonus integer default 0
)
returns table(success boolean, stat_value integer, overall_rating integer, xp_awarded integer, card_level integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_today date := (timezone('America/Argentina/Buenos_Aires', now()))::date;
  v_count integer;
  v_delta integer;
  v_xp integer;
  v_value integer;
  v_ovr integer;
  v_exp integer;
  v_level integer;
  v_pace integer;
  v_dribbling integer;
  v_passing integer;
  v_defending integer;
  v_finishing integer;
  v_physical integer;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if p_game_id not in ('shooting','dribbling','defending','passing','physical','pace') then
    raise exception 'Invalid training game';
  end if;
  if p_stat not in ('finishing','dribbling','defending','passing','physical','pace') then
    raise exception 'Invalid player attribute';
  end if;
  if p_grade not in ('S','A','B','C') then raise exception 'Invalid grade'; end if;
  if p_delta < 1 or p_delta > 8 then raise exception 'Invalid training reward'; end if;
  if p_xp_bonus < 0 or p_xp_bonus > 200 then raise exception 'Invalid XP reward'; end if;

  -- Serialize per-profile completions so the daily cap cannot be bypassed by parallel requests.
  perform 1 from public.profiles where id = v_user_id for update;
  if not found then raise exception 'Player profile not found'; end if;

  select count(*) into v_count
  from public.personal_training_attempts
  where user_id = v_user_id and training_date = v_today;

  if v_count >= 5 then
    return query
      select false, 0, 0, 0, coalesce((select user_card_level from public.profiles where id=v_user_id),1);
    return;
  end if;

  insert into public.personal_training_attempts(user_id, training_date, game_id, stat, grade, delta, xp_awarded)
  values (v_user_id, v_today, p_game_id, p_stat, p_grade, p_delta, p_xp_bonus)
  on conflict (user_id, training_date, game_id) do nothing;

  if not found then
    select
      case p_stat
        when 'pace' then coalesce(user_card_pace,10)
        when 'dribbling' then coalesce(user_card_dribbling,10)
        when 'passing' then coalesce(user_card_passing,10)
        when 'defending' then coalesce(user_card_defending,10)
        when 'finishing' then coalesce(user_card_finishing,10)
        else coalesce(user_card_physical,10)
      end,
      coalesce(user_card_level,1)
    into v_value, v_level from public.profiles where id=v_user_id;
    return query select false, v_value,
      (coalesce((select user_card_pace from public.profiles where id=v_user_id),10)
      + coalesce((select user_card_dribbling from public.profiles where id=v_user_id),10)
      + coalesce((select user_card_passing from public.profiles where id=v_user_id),10)
      + coalesce((select user_card_defending from public.profiles where id=v_user_id),10)
      + coalesce((select user_card_finishing from public.profiles where id=v_user_id),10)
      + coalesce((select user_card_physical from public.profiles where id=v_user_id),10))/6,
      0, v_level;
    return;
  end if;

  v_delta := least(p_delta, greatest(0, 99 - case p_stat
    when 'pace' then coalesce((select user_card_pace from public.profiles where id=v_user_id),10)
    when 'dribbling' then coalesce((select user_card_dribbling from public.profiles where id=v_user_id),10)
    when 'passing' then coalesce((select user_card_passing from public.profiles where id=v_user_id),10)
    when 'defending' then coalesce((select user_card_defending from public.profiles where id=v_user_id),10)
    when 'finishing' then coalesce((select user_card_finishing from public.profiles where id=v_user_id),10)
    else coalesce((select user_card_physical from public.profiles where id=v_user_id),10)
  end));
  v_xp := p_xp_bonus;

  update public.profiles set
    user_card_pace = case when p_stat='pace' then least(99,coalesce(user_card_pace,10)+v_delta) else coalesce(user_card_pace,10) end,
    user_card_dribbling = case when p_stat='dribbling' then least(99,coalesce(user_card_dribbling,10)+v_delta) else coalesce(user_card_dribbling,10) end,
    user_card_passing = case when p_stat='passing' then least(99,coalesce(user_card_passing,10)+v_delta) else coalesce(user_card_passing,10) end,
    user_card_defending = case when p_stat='defending' then least(99,coalesce(user_card_defending,10)+v_delta) else coalesce(user_card_defending,10) end,
    user_card_finishing = case when p_stat='finishing' then least(99,coalesce(user_card_finishing,10)+v_delta) else coalesce(user_card_finishing,10) end,
    user_card_physical = case when p_stat='physical' then least(99,coalesce(user_card_physical,10)+v_delta) else coalesce(user_card_physical,10) end,
    user_card_exp = coalesce(user_card_exp,0) + v_xp,
    user_card_level = greatest(1, floor((coalesce(user_card_exp,0)+v_xp)/100.0)::integer + 1)
  where id=v_user_id
  returning user_card_pace,user_card_dribbling,user_card_passing,user_card_defending,user_card_finishing,user_card_physical,user_card_exp,user_card_level
  into v_pace,v_dribbling,v_passing,v_defending,v_finishing,v_physical,v_exp,v_level;

  v_value := case p_stat
    when 'pace' then v_pace when 'dribbling' then v_dribbling
    when 'passing' then v_passing when 'defending' then v_defending
    when 'finishing' then v_finishing else v_physical end;
  v_ovr := floor((v_pace+v_dribbling+v_passing+v_defending+v_finishing+v_physical)/6.0)::integer;

  return query select true, v_value, v_ovr, v_xp, v_level;
end;
$$;

revoke all on function public.complete_personal_training(text,text,text,integer,integer) from public;
grant execute on function public.complete_personal_training(text,text,text,integer,integer) to authenticated;
notify pgrst, 'reload schema';
