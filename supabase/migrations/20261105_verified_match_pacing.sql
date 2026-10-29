-- Trusted match pacing: server time, not client timestamps.
-- 8 turns cannot be advanced instantaneously via scripted HTTP requests.
alter table public.verified_match_sessions
 add column if not exists last_turn_at timestamptz;

create or replace function public.advance_verified_match_state(
 p_session_id uuid,
 p_expected_version integer,
 p_turn_index integer,
 p_user_score integer,
 p_opponent_score integer,
 p_simulation_state jsonb,
 p_pending_decision jsonb
) returns integer
language plpgsql security definer
set search_path=public,pg_temp as $$
declare v_session public.verified_match_sessions%rowtype; v_version integer;
begin
 if auth.role() is distinct from 'service_role' then
   raise exception 'Trusted server only';
 end if;
 if p_simulation_state is null or jsonb_typeof(p_simulation_state)<>'object'
   or (p_pending_decision is not null and jsonb_typeof(p_pending_decision)<>'object')
   or p_expected_version<0 or p_turn_index<0 or p_turn_index>8
   or p_user_score<0 or p_user_score>20 or p_opponent_score<0 or p_opponent_score>20 then
   raise exception 'Invalid match state';
 end if;
 select * into v_session from public.verified_match_sessions
 where id=p_session_id for update;
 if not found or v_session.state<>'started' or v_session.expires_at<=now()
    or v_session.state_version<>p_expected_version then
   raise exception 'Stale or inactive match session';
 end if;
 if p_turn_index=v_session.turn_index+1 then
   if v_session.pending_decision is not null then
     raise exception 'Pending decision must be resolved';
   end if;
   if v_session.last_turn_at is not null
      and now()<v_session.last_turn_at+interval '3 seconds' then
     raise exception 'Next turn requested too soon';
   end if;
 elsif p_turn_index=v_session.turn_index then
   if v_session.pending_decision is null or p_pending_decision is not null then
     raise exception 'No decision to resolve';
   end if;
 else
   raise exception 'Invalid turn transition';
 end if;
 update public.verified_match_sessions
 set state_version=state_version+1,
     turn_index=p_turn_index,
     user_score=p_user_score,
     opponent_score=p_opponent_score,
     simulation_state=p_simulation_state,
     pending_decision=p_pending_decision,
     last_turn_at=case when p_turn_index>v_session.turn_index then now() else last_turn_at end
 where id=p_session_id
 returning state_version into v_version;
 return v_version;
end $$;
revoke all on function public.advance_verified_match_state(
 uuid,integer,integer,integer,integer,jsonb,jsonb
) from public,anon,authenticated;
grant execute on function public.advance_verified_match_state(
 uuid,integer,integer,integer,integer,jsonb,jsonb
) to service_role;
