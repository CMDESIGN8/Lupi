-- Prepared for a TRUSTED match-finalization backend only.
-- Do not attach this to arbitrary client INSERTs into public.matches:
-- CardBattle currently writes recreational, unverified match results.
create table if not exists public.equipment_match_consumptions (
  match_id uuid primary key references public.matches(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  consumed_at timestamptz not null default now()
);
create index if not exists equipment_match_consumptions_user_idx
 on public.equipment_match_consumptions(user_id);
alter table public.equipment_match_consumptions enable row level security;
-- No direct client policies: only the trusted server may consume durability.
create or replace function public.consume_equipment_for_verified_match(p_match_id uuid)
returns integer language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
 v_uid uuid;
 v_count integer := 0;
begin
 if auth.role() is distinct from 'service_role' then
   raise exception 'Trusted server only';
 end if;
 select m.user_id into v_uid
 from public.matches m where m.id=p_match_id;
 if v_uid is null then raise exception 'Match not found or without user'; end if;
 -- Serialize consumption and renewal for this user using the same profile lock.
 perform 1 from public.profiles where id=v_uid for update;
 if not found then raise exception 'Profile not found'; end if;
 insert into public.equipment_match_consumptions(match_id,user_id)
 values(p_match_id,v_uid) on conflict(match_id) do nothing;
 if not found then return 0; end if;
 insert into public.equipment_durability(user_id,item_id,remaining,max_uses)
 select ui.user_id,ui.item_id,10,10
 from public.user_items ui
 join public.aura_items ai on ai.id=ui.item_id
 where ui.user_id=v_uid and ui.equipped and ai.slot in ('socks','boots')
 on conflict(user_id,item_id) do nothing;
 update public.equipment_durability d
 set remaining=greatest(0,d.remaining-1)
 from public.user_items ui
 join public.aura_items ai on ai.id=ui.item_id
 where d.user_id=v_uid and d.item_id=ui.item_id
 and ui.user_id=v_uid and ui.equipped
 and ai.slot in ('socks','boots')
 and d.remaining>0;
 get diagnostics v_count = row_count;
 return v_count;
end $$;
revoke all on function public.consume_equipment_for_verified_match(uuid) from public, anon, authenticated;
grant execute on function public.consume_equipment_for_verified_match(uuid) to service_role;
