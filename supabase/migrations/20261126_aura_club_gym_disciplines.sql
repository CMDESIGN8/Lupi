-- AURA Club Gym: add aerobic endurance and strength disciplines/badges.
-- Existing user progress and previously unlocked badges are preserved.
alter table public.personal_training_drills drop constraint if exists personal_training_drills_skill_key_check;
alter table public.personal_training_drills add constraint personal_training_drills_skill_key_check
  check (skill_key in ('coordination','speed','agility','technique','aerobic','strength'));

alter table public.personal_training_cycle_drills drop constraint if exists personal_training_cycle_drills_skill_key_check;
alter table public.personal_training_cycle_drills add constraint personal_training_cycle_drills_skill_key_check
  check (skill_key in ('coordination','speed','agility','technique','aerobic','strength'));

alter table public.personal_training_badges drop constraint if exists personal_training_badges_badge_key_check;
alter table public.personal_training_badges add constraint personal_training_badges_badge_key_check
  check (badge_key in ('coordination','speed','agility','technique','aerobic','strength'));

alter table public.profiles
  add column if not exists user_card_aerobic integer not null default 10,
  add column if not exists user_card_strength integer not null default 10;

drop function if exists public.complete_personal_training_drill(text,integer);
create function public.complete_personal_training_drill(
  p_skill_key text, p_exercise_index integer
)
returns table(success boolean, progress integer, xp_awarded integer, badge_unlocked boolean,
  user_card_exp integer, user_card_level integer, stat_key text, stat_value integer, overall_rating integer)
language plpgsql security definer set search_path = public
as $$
declare
  v_user_id uuid := auth.uid(); v_progress integer; v_inserted integer;
  v_xp integer := 0; v_exp integer; v_level integer; v_stat_key text;
  v_stat_value integer; v_ovr integer;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if p_skill_key not in ('coordination','speed','agility','technique','aerobic','strength') then raise exception 'Invalid training skill'; end if;
  if p_exercise_index < 0 or p_exercise_index > 2 then raise exception 'Invalid training exercise'; end if;
  perform 1 from public.profiles where id=v_user_id for update;
  if not found then raise exception 'Player profile not found'; end if;
  insert into public.personal_training_drills(user_id,skill_key,exercise_index)
    values(v_user_id,p_skill_key,p_exercise_index)
    on conflict(user_id,skill_key,exercise_index) do nothing;
  get diagnostics v_inserted=row_count;
  select count(*)::integer into v_progress from public.personal_training_drills
    where user_id=v_user_id and skill_key=p_skill_key;
  if v_inserted>0 and v_progress=3 then
    v_xp:=50;
    v_stat_key:=case p_skill_key
      when 'coordination' then 'dribbling'
      when 'speed' then 'pace'
      when 'agility' then 'physical'
      when 'technique' then 'passing'
      when 'aerobic' then 'aerobic'
      when 'strength' then 'strength' end;
    update public.profiles as profile set
      user_card_exp=coalesce(profile.user_card_exp,0)+v_xp,
      user_card_level=greatest(1,floor((coalesce(profile.user_card_exp,0)+v_xp)/100.0)::integer+1),
      user_card_dribbling=case when v_stat_key='dribbling' then least(99,coalesce(profile.user_card_dribbling,10)+1) else coalesce(profile.user_card_dribbling,10) end,
      user_card_pace=case when v_stat_key='pace' then least(99,coalesce(profile.user_card_pace,10)+1) else coalesce(profile.user_card_pace,10) end,
      user_card_physical=case when v_stat_key='physical' then least(99,coalesce(profile.user_card_physical,10)+1) else coalesce(profile.user_card_physical,10) end,
      user_card_passing=case when v_stat_key='passing' then least(99,coalesce(profile.user_card_passing,10)+1) else coalesce(profile.user_card_passing,10) end,
      user_card_aerobic=case when v_stat_key='aerobic' then least(99,coalesce(profile.user_card_aerobic,10)+1) else coalesce(profile.user_card_aerobic,10) end,
      user_card_strength=case when v_stat_key='strength' then least(99,coalesce(profile.user_card_strength,10)+1) else coalesce(profile.user_card_strength,10) end
    where profile.id=v_user_id;
  end if;
  insert into public.personal_training_badges as current_badge(user_id,badge_key,progress,unlocked_at,updated_at)
    values(v_user_id,p_skill_key,least(3,v_progress),case when v_progress=3 then now() else null end,now())
    on conflict(user_id,badge_key) do update set progress=greatest(current_badge.progress,excluded.progress),
      unlocked_at=coalesce(current_badge.unlocked_at,excluded.unlocked_at),updated_at=now();
  select coalesce(profile.user_card_exp,0),coalesce(profile.user_card_level,1),
    case v_stat_key when 'dribbling' then coalesce(profile.user_card_dribbling,10)
      when 'pace' then coalesce(profile.user_card_pace,10) when 'physical' then coalesce(profile.user_card_physical,10)
      when 'passing' then coalesce(profile.user_card_passing,10) when 'aerobic' then coalesce(profile.user_card_aerobic,10)
      when 'strength' then coalesce(profile.user_card_strength,10) else null end,
    floor((coalesce(profile.user_card_pace,10)+coalesce(profile.user_card_dribbling,10)+coalesce(profile.user_card_passing,10)+
      coalesce(profile.user_card_defending,10)+coalesce(profile.user_card_finishing,10)+coalesce(profile.user_card_physical,10)+
      coalesce(profile.user_card_aerobic,10)+coalesce(profile.user_card_strength,10))/8.0)::integer
    into v_exp,v_level,v_stat_value,v_ovr from public.profiles as profile where profile.id=v_user_id;
  return query select (v_inserted>0),least(3,v_progress),v_xp,(v_progress=3),v_exp,v_level,
    case when v_xp>0 then v_stat_key else null end,
    case when v_xp>0 then v_stat_value else null end,
    case when v_xp>0 then v_ovr else null end;
end; $$;

revoke all on function public.complete_personal_training_drill(text,integer) from public;
grant execute on function public.complete_personal_training_drill(text,integer) to authenticated;

create or replace function public.record_personal_training_cycle_drill(
  p_skill_key text, p_exercise_index integer
)
returns table(success boolean, progress integer)
language plpgsql security definer set search_path = public
as $$
declare v_user_id uuid := auth.uid(); v_inserted integer; v_progress integer;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if p_skill_key not in ('coordination','speed','agility','technique','aerobic','strength') then raise exception 'Invalid training skill'; end if;
  if p_exercise_index < 0 or p_exercise_index > 2 then raise exception 'Invalid training exercise'; end if;
  insert into public.personal_training_cycle_drills(user_id,skill_key,exercise_index)
  values(v_user_id,p_skill_key,p_exercise_index) on conflict(user_id,skill_key,exercise_index) do nothing;
  get diagnostics v_inserted=row_count;
  select count(*)::integer into v_progress from public.personal_training_cycle_drills
    where user_id=v_user_id and skill_key=p_skill_key;
  return query select (v_inserted>0),least(3,v_progress);
end; $$;

revoke all on function public.complete_personal_training_drill(text,integer) from public;
grant execute on function public.complete_personal_training_drill(text,integer) to authenticated;
revoke all on function public.record_personal_training_cycle_drill(text,integer) from public;
grant execute on function public.record_personal_training_cycle_drill(text,integer) to authenticated;
notify pgrst, 'reload schema';
