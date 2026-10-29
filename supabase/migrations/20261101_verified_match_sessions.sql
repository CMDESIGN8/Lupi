-- Server-authoritative match sessions: apply only after reviewing RLS and existing matches triggers.
-- Match scores are generated server-side; browser-submitted scores are never accepted.
create table if not exists public.verified_match_sessions (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 deck_id uuid,
 opponent_key text not null,
 user_score integer not null check(user_score between 0 and 20),
 opponent_score integer not null check(opponent_score between 0 and 20),
 state text not null default 'started' check(state in ('started','completed')),
 created_at timestamptz not null default now(),
 completed_at timestamptz,
 match_id uuid unique references public.matches(id)
);
create index if not exists verified_match_sessions_user_idx
 on public.verified_match_sessions(user_id,created_at desc);
-- Atomically prevent parallel unfinished sessions for the same player.
create unique index if not exists verified_match_one_active_per_user
 on public.verified_match_sessions(user_id) where state='started';
alter table public.verified_match_sessions enable row level security;
-- No browser access. Only service-role backend can create or finalize sessions.
revoke all on public.verified_match_sessions from anon, authenticated;

-- This function is only for the trusted server and is idempotent per session.
-- A verified result is inserted by the server, never accepted from a client.
create or replace function public.finalize_verified_match(p_session_id uuid)
returns uuid language plpgsql security definer
set search_path=public,pg_temp as $$
declare v_session public.verified_match_sessions%rowtype; v_match_id uuid;
begin
 if auth.role() is distinct from 'service_role' then raise exception 'Trusted server only'; end if;
 select * into v_session from public.verified_match_sessions
 where id=p_session_id for update;
 if not found then raise exception 'Session not found'; end if;
 if v_session.state='completed' then return v_session.match_id; end if;
 -- Prevent duplicate completion even if a client retries.
 insert into public.matches(user_id,user_deck_id,user_score,opponent_score,winner_id,experience_gained)
 values(v_session.user_id,v_session.deck_id,v_session.user_score,v_session.opponent_score,
 case when v_session.user_score>v_session.opponent_score then v_session.user_id else null end,0)
 returning id into v_match_id;
 -- This is an authoritative session; consume exactly once.
 perform public.consume_equipment_for_verified_match(v_match_id);
 update public.verified_match_sessions
 set state='completed',completed_at=now(),match_id=v_match_id where id=p_session_id;
 return v_match_id;
end $$;
revoke all on function public.finalize_verified_match(uuid) from public,anon,authenticated;
grant execute on function public.finalize_verified_match(uuid) to service_role;
