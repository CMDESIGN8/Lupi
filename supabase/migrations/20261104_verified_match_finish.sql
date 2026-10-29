-- Completion is only valid after all authoritative turns have been processed.
-- Consume gear snapshotted at START, never whatever the user is wearing later.
-- Apply to staging only after 20261103 and review existing triggers on matches.
create or replace function public.consume_equipment_for_verified_match(p_match_id uuid)
returns integer language plpgsql security definer
set search_path=public,pg_temp as $$
declare v_session public.verified_match_sessions%rowtype; v_count integer := 0;
begin
 if auth.role() is distinct from 'service_role' then
   raise exception 'Trusted server only';
 end if;
 select s.* into v_session
 from public.verified_match_sessions s
 where s.match_id=p_match_id
 for update;
 if not found then raise exception 'Verified session not found for match'; end if;
 if v_session.turn_index <> 8 or v_session.pending_decision is not null then
   raise exception 'Match not completed by authoritative engine';
 end if;
 perform 1 from public.profiles where id=v_session.user_id for update;
 if not found then raise exception 'Profile not found'; end if;
 insert into public.equipment_match_consumptions(match_id,user_id)
 values(p_match_id,v_session.user_id) on conflict(match_id) do nothing;
 if not found then return 0; end if;
 insert into public.equipment_durability(user_id,item_id,remaining,max_uses)
 select v_session.user_id, gear.item_id, 10, 10
 from jsonb_to_recordset(v_session.equipped_snapshot) as gear(item_id text)
 join public.user_items ui on ui.user_id=v_session.user_id and ui.item_id=gear.item_id
 on conflict(user_id,item_id) do nothing;
 update public.equipment_durability d
 set remaining=greatest(0,d.remaining-1)
 from jsonb_to_recordset(v_session.equipped_snapshot) as gear(item_id text)
 where d.user_id=v_session.user_id and d.item_id=gear.item_id and d.remaining>0;
 get diagnostics v_count=row_count;
 return v_count;
end $$;
revoke all on function public.consume_equipment_for_verified_match(uuid)
 from public,anon,authenticated;
grant execute on function public.consume_equipment_for_verified_match(uuid)
 to service_role;

create or replace function public.finalize_verified_match(p_session_id uuid)
returns uuid language plpgsql security definer
set search_path=public,pg_temp as $$
declare v_session public.verified_match_sessions%rowtype; v_match_id uuid;
begin
 if auth.role() is distinct from 'service_role' then
   raise exception 'Trusted server only';
 end if;
 select * into v_session from public.verified_match_sessions
 where id=p_session_id for update;
 if not found then raise exception 'Session not found'; end if;
 if v_session.state='completed' then return v_session.match_id; end if;
 if v_session.state <> 'started' or v_session.expires_at <= now()
   or v_session.turn_index <> 8 or v_session.pending_decision is not null
   or v_session.deck_snapshot is null
   or jsonb_array_length(v_session.deck_snapshot) <> 5 then
   raise exception 'Unverified or unfinished match';
 end if;
 insert into public.matches(user_id,user_deck_id,user_score,opponent_score,winner_id,experience_gained)
 values(v_session.user_id,v_session.deck_id,v_session.user_score,v_session.opponent_score,
 case when v_session.user_score>v_session.opponent_score then v_session.user_id else null end,0)
 returning id into v_match_id;
 -- Set the match ID before consumption so the function can read the
 -- immutable equipment snapshot. Everything is one DB transaction.
 update public.verified_match_sessions set match_id=v_match_id
 where id=p_session_id;
 perform public.consume_equipment_for_verified_match(v_match_id);
 update public.verified_match_sessions
 set state='completed',completed_at=now() where id=p_session_id;
 return v_match_id;
end $$;
revoke all on function public.finalize_verified_match(uuid)
 from public,anon,authenticated;
grant execute on function public.finalize_verified_match(uuid) to service_role;
