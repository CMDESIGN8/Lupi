-- Stateful verified matches: apply in staging only, after 20261101.
-- A session's state and pending decision are persisted, never sourced from
-- a browser request. Only trusted service-role code can advance the version.
alter table public.verified_match_sessions
 add column if not exists turn_index integer not null default 0
   check (turn_index between 0 and 40),
 add column if not exists state_version integer not null default 0
   check (state_version >= 0),
 add column if not exists simulation_seed bigint,
 add column if not exists simulation_state jsonb not null default '{}'::jsonb,
 add column if not exists pending_decision jsonb,
 add column if not exists deck_snapshot jsonb,
 add column if not exists expires_at timestamptz not null default (now() + interval '2 hours');

-- New matches must be created through a server start RPC that snapshots
-- the deck and equipped gear. Until then, the finish endpoint remains 501.
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
set search_path = public, pg_temp as $$
declare v_version integer;
begin
 if auth.role() is distinct from 'service_role' then
   raise exception 'Trusted server only';
 end if;
 if p_simulation_state is null or jsonb_typeof(p_simulation_state) <> 'object' then
   raise exception 'Invalid simulation state';
 end if;
 if p_pending_decision is not null
    and jsonb_typeof(p_pending_decision) <> 'object' then
   raise exception 'Invalid pending decision';
 end if;
 if p_expected_version < 0 or p_turn_index < 0 or p_turn_index > 40
    or p_user_score < 0 or p_user_score > 20
    or p_opponent_score < 0 or p_opponent_score > 20 then
   raise exception 'Invalid match state';
 end if;
 update public.verified_match_sessions
 set state_version=state_version+1,
     turn_index=p_turn_index,
     user_score=p_user_score,
     opponent_score=p_opponent_score,
     simulation_state=p_simulation_state,
     pending_decision=p_pending_decision
 where id=p_session_id
   and state='started'
   and expires_at > now()
   and state_version=p_expected_version
   and p_turn_index >= turn_index
 returning state_version into v_version;
 if v_version is null then
   raise exception 'Stale, expired, completed or missing match session';
 end if;
 return v_version;
end $$;
revoke all on function public.advance_verified_match_state(
 uuid,integer,integer,integer,integer,jsonb,jsonb
) from public,anon,authenticated;
grant execute on function public.advance_verified_match_state(
 uuid,integer,integer,integer,integer,jsonb,jsonb
) to service_role;

-- Expiration frees the active-session unique index; never spends equipment.
create or replace function public.expire_verified_match_sessions()
returns integer language plpgsql security definer
set search_path=public,pg_temp as $$
declare v_count integer;
begin
 if auth.role() is distinct from 'service_role' then
   raise exception 'Trusted server only';
 end if;
 update public.verified_match_sessions
 set state='expired'
 where state='started' and expires_at <= now();
 get diagnostics v_count = row_count;
 return v_count;
end $$;
revoke all on function public.expire_verified_match_sessions() from public,anon,authenticated;
grant execute on function public.expire_verified_match_sessions() to service_role;

alter table public.verified_match_sessions
 drop constraint if exists verified_match_sessions_state_check;
alter table public.verified_match_sessions
 add constraint verified_match_sessions_state_check
 check (state in ('started','completed','expired'));
