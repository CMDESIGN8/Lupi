-- Trusted, atomic match creation. Apply in STAGING after 20261102.
-- The browser supplies only an opponent identifier; the server supplies
-- the authenticated user ID and a cryptographically generated private seed.
alter table public.verified_match_sessions
 add column if not exists equipped_snapshot jsonb not null default '[]'::jsonb;

create or replace function public.start_verified_match(
 p_user_id uuid, p_opponent_key text, p_seed bigint
) returns uuid
language plpgsql security definer
set search_path=public,pg_temp as $$
declare
 v_deck_id uuid;
 v_cards jsonb;
 v_gear jsonb;
 v_session_id uuid;
begin
 if auth.role() is distinct from 'service_role' then
   raise exception 'Trusted server only';
 end if;
 if p_user_id is null or p_seed is null or p_seed < 0
    or p_seed > 4294967295
    or p_opponent_key is null
    or p_opponent_key !~ '^[a-zA-Z0-9 _-]{1,80}$' then
   raise exception 'Invalid match start';
 end if;
 -- Serialize start, renewal and gear wear for this player.
 perform 1 from public.profiles where id=p_user_id for update;
 if not found then raise exception 'Player profile not found'; end if;

 -- Expired sessions no longer occupy the one-active-session index.
 update public.verified_match_sessions set state='expired'
 where user_id=p_user_id and state='started' and expires_at<=now();
 if exists(select 1 from public.verified_match_sessions
           where user_id=p_user_id and state='started') then
   raise exception 'An unfinished match already exists';
 end if;

 select id into v_deck_id from public.decks
 where user_id=p_user_id and is_active=true
 order by id limit 1;
 if v_deck_id is null then raise exception 'Active deck not found'; end if;
 -- Deck ownership and all five unique positions are checked in the DB.
 if (select count(*) from public.deck_cards dc
     join public.user_cards uc on uc.id=dc.user_card_id
     where dc.deck_id=v_deck_id and uc.user_id=p_user_id
       and dc.position between 1 and 5) <> 5
 or (select count(distinct dc.position) from public.deck_cards dc
     join public.user_cards uc on uc.id=dc.user_card_id
     where dc.deck_id=v_deck_id and uc.user_id=p_user_id
       and dc.position between 1 and 5) <> 5
 or (select count(distinct dc.user_card_id) from public.deck_cards dc
     join public.user_cards uc on uc.id=dc.user_card_id
     where dc.deck_id=v_deck_id and uc.user_id=p_user_id
       and dc.position between 1 and 5) <> 5 then
   raise exception 'Active deck must contain five distinct owned cards';
 end if;

 select jsonb_agg(
   jsonb_build_object(
     'id', uc.id, 'user_id', uc.user_id,
     'card_type', uc.card_type, 'level', greatest(1,coalesce(uc.level,1)),
     'experience', coalesce(uc.experience,0),
     'is_favorite', false, 'obtained_at', now(),
     'position', dc.position,
     'card', jsonb_build_object(
       'id', coalesce(p.id::text,so.id::text),
       'name', case when uc.card_type='npc' then p.name else so.username end,
       'position', case when uc.card_type='npc' then p.position else so.position end,
       'category', case when uc.card_type='npc' then p.category else so.category end,
       'overall_rating', case when uc.card_type='npc' then p.overall_rating else
         ((coalesce(so.user_card_pace,10)+coalesce(so.user_card_dribbling,10)+
           coalesce(so.user_card_passing,10)+coalesce(so.user_card_defending,10)+
           coalesce(so.user_card_finishing,10)+coalesce(so.user_card_physical,10))/6) end,
       'pace', case when uc.card_type='npc' then p.pace else coalesce(so.user_card_pace,10) end,
       'dribbling', case when uc.card_type='npc' then p.dribbling else coalesce(so.user_card_dribbling,10) end,
       'passing', case when uc.card_type='npc' then p.passing else coalesce(so.user_card_passing,10) end,
       'defending', case when uc.card_type='npc' then p.defending else coalesce(so.user_card_defending,10) end,
       'finishing', case when uc.card_type='npc' then p.finishing else coalesce(so.user_card_finishing,10) end,
       'physical', case when uc.card_type='npc' then p.physical else coalesce(so.user_card_physical,10) end
     )
   ) order by dc.position)
 into v_cards
 from public.deck_cards dc
 join public.user_cards uc on uc.id=dc.user_card_id and uc.user_id=p_user_id
 left join public.players p on uc.card_type='npc' and p.id=uc.player_id
 left join public.profiles so on uc.card_type='socio' and so.id=uc.socio_id
 where dc.deck_id=v_deck_id and dc.position between 1 and 5;
 if jsonb_array_length(coalesce(v_cards,'[]'::jsonb))<>5
    or exists (
      select 1 from public.deck_cards dc
      join public.user_cards uc on uc.id=dc.user_card_id and uc.user_id=p_user_id
      left join public.players p on uc.card_type='npc' and p.id=uc.player_id
      left join public.profiles so on uc.card_type='socio' and so.id=uc.socio_id
      where dc.deck_id=v_deck_id
        and ((uc.card_type='npc' and p.id is null)
          or (uc.card_type='socio' and so.id is null)
          or uc.card_type not in ('npc','socio'))
    ) then
   raise exception 'Deck contains an invalid player card';
 end if;

 -- Equipment worn at START is immutable for this match.
 select coalesce(jsonb_agg(jsonb_build_object('item_id',ui.item_id)), '[]'::jsonb)
 into v_gear from public.user_items ui
 join public.aura_items ai on ai.id=ui.item_id
 where ui.user_id=p_user_id and ui.equipped and ai.slot in ('boots','socks');
 if exists (
   select 1 from public.user_items ui
   join public.aura_items ai on ai.id=ui.item_id
   left join public.equipment_durability d on d.user_id=ui.user_id and d.item_id=ui.item_id
   where ui.user_id=p_user_id and ui.equipped and ai.slot in ('boots','socks')
     and coalesce(d.remaining,10)<=0
 ) then
   raise exception 'Equipped item has no durability remaining';
 end if;

 insert into public.verified_match_sessions(
   user_id, deck_id, opponent_key, simulation_seed,
   deck_snapshot, equipped_snapshot, simulation_state,
   user_score, opponent_score
 ) values(
   p_user_id,v_deck_id,p_opponent_key,p_seed,
   v_cards,v_gear,'{"advantage":0}'::jsonb,0,0
 ) returning id into v_session_id;
 return v_session_id;
end $$;
revoke all on function public.start_verified_match(uuid,text,bigint)
 from public,anon,authenticated;
grant execute on function public.start_verified_match(uuid,text,bigint)
 to service_role;
