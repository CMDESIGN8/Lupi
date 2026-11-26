-- Connect AURA physical disciplines to the player's existing Lupi card.
-- A discipline grants +2 to one matching attribute and +50 XP exactly once,
-- when its third distinct exercise is completed.

-- The function's return shape is extended with the updated attribute and OVR.
drop function if exists public.complete_personal_training_drill(text, integer);

create function public.complete_personal_training_drill(
  p_skill_key text,
  p_exercise_index integer
)
returns table(
  success boolean,
  progress integer,
  xp_awarded integer,
  badge_unlocked boolean,
  user_card_exp integer,
  user_card_level integer,
  stat_key text,
  stat_value integer,
  overall_rating integer
)
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
  v_stat_key text;
  v_stat_value integer;
  v_overall integer;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if p_skill_key not in ('coordination','speed','agility','technique') then
    raise exception 'Invalid training skill';
  end if;
  if p_exercise_index is null or p_exercise_index < 0 or p_exercise_index > 2 then
    raise exception 'Invalid training exercise';
  end if;

  v_stat_key := case p_skill_key
    when 'coordination' then 'dribbling'
    when 'speed' then 'pace'
    when 'agility' then 'physical'
    when 'technique' then 'passing'
  end;

  -- Serialize completions per player to prevent duplicate reward races.
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
    set user_card_exp = coalesce(user_card_exp, 0) + v_xp,
        user_card_level = greatest(
          1,
          floor((coalesce(user_card_exp, 0) + v_xp) / 100.0)::integer + 1
        ),
        user_card_dribbling = case when p_skill_key = 'coordination'
          then least(99, coalesce(user_card_dribbling, 10) + 2) else user_card_dribbling end,
        user_card_pace = case when p_skill_key = 'speed'
          then least(99, coalesce(user_card_pace, 10) + 2) else user_card_pace end,
        user_card_physical = case when p_skill_key = 'agility'
          then least(99, coalesce(user_card_physical, 10) + 2) else user_card_physical end,
        user_card_passing = case when p_skill_key = 'technique'
          then least(99, coalesce(user_card_passing, 10) + 2) else user_card_passing end
    where id = v_user_id;
  end if;

  insert into public.personal_training_badges as current_badge(
    user_id, badge_key, progress, unlocked_at, updated_at
  )
  values (
    v_user_id, p_skill_key, least(3, v_progress),
    case when v_progress = 3 then now() else null end, now()
  )
  on conflict (user_id, badge_key) do update
  set progress = greatest(current_badge.progress, excluded.progress),
      unlocked_at = coalesce(current_badge.unlocked_at, excluded.unlocked_at),
      updated_at = now();

  select
    coalesce(p.user_card_exp, 0),
    coalesce(p.user_card_level, 1),
    case v_stat_key
      when 'dribbling' then coalesce(p.user_card_dribbling, 10)
      when 'pace' then coalesce(p.user_card_pace, 10)
      when 'physical' then coalesce(p.user_card_physical, 10)
      when 'passing' then coalesce(p.user_card_passing, 10)
    end,
    floor((
      coalesce(p.user_card_pace, 10) +
      coalesce(p.user_card_dribbling, 10) +
      coalesce(p.user_card_passing, 10) +
      coalesce(p.user_card_defending, 10) +
      coalesce(p.user_card_finishing, 10) +
      coalesce(p.user_card_physical, 10)
    ) / 6.0)::integer
  into v_exp, v_level, v_stat_value, v_overall
  from public.profiles p
  where p.id = v_user_id;

  return query select
    (v_inserted > 0),
    least(3, v_progress),
    v_xp,
    (v_progress = 3),
    v_exp,
    v_level,
    v_stat_key,
    v_stat_value,
    v_overall;
end;
$$;

revoke all on function public.complete_personal_training_drill(text, integer) from public;
grant execute on function public.complete_personal_training_drill(text, integer) to authenticated;

notify pgrst, 'reload schema';
