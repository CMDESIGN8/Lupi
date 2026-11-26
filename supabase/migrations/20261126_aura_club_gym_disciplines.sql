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

create or replace function public.complete_personal_training_drill(
  p_skill_key text, p_exercise_index integer
)
returns table(success boolean, progress integer, xp_awarded integer, badge_unlocked boolean, user_card_exp integer, user_card_level integer)
language plpgsql security definer set search_path = public
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
  if p_skill_key not in ('coordination','speed','agility','technique','aerobic','strength') then raise exception 'Invalid training skill'; end if;
  if p_exercise_index < 0 or p_exercise_index > 2 then raise exception 'Invalid training exercise'; end if;
  perform 1 from public.profiles where id = v_user_id for update;
  if not found then raise exception 'Player profile not found'; end if;
  insert into public.personal_training_drills(user_id,skill_key,exercise_index)
  values(v_user_id,p_skill_key,p_exercise_index) on conflict(user_id,skill_key,exercise_index) do nothing;
  get diagnostics v_inserted = row_count;
  select count(*)::integer into v_progress from public.personal_training_drills
    where user_id=v_user_id and skill_key=p_skill_key;
  if v_inserted > 0 and v_progress = 3 then
    v_xp := 50;
    update public.profiles set user_card_exp=coalesce(user_card_exp,0)+v_xp,
      user_card_level=greatest(1,floor((coalesce(user_card_exp,0)+v_xp)/100.0)::integer+1)
      where id=v_user_id;
  end if;
  insert into public.personal_training_badges as current_badge(user_id,badge_key,progress,unlocked_at,updated_at)
  values(v_user_id,p_skill_key,least(3,v_progress),case when v_progress=3 then now() else null end,now())
  on conflict(user_id,badge_key) do update set progress=greatest(current_badge.progress,excluded.progress),
    unlocked_at=coalesce(current_badge.unlocked_at,excluded.unlocked_at),updated_at=now();
  select coalesce(user_card_exp,0),coalesce(user_card_level,1) into v_exp,v_level
    from public.profiles where id=v_user_id;
  return query select (v_inserted>0),least(3,v_progress),v_xp,(v_progress=3),v_exp,v_level;
end; $$;

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
