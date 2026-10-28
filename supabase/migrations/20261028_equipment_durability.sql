-- LupiApp: durability for socks and boots.
-- Apply after adding the two socks to public.aura_items and shop_items.
-- The game result server must invoke consume_equipment_durability ONCE per completed match.
create table if not exists public.equipment_durability (
 user_id uuid not null references auth.users(id) on delete cascade,
 item_id text not null references public.aura_items(id) on delete cascade,
 remaining integer not null default 10 check (remaining between 0 and 10),
 max_uses integer not null default 10 check (max_uses = 10),
 primary key (user_id,item_id)
);
alter table public.equipment_durability enable row level security;
drop policy if exists "Read own equipment durability" on public.equipment_durability;
create policy "Read own equipment durability" on public.equipment_durability
for select to authenticated using (user_id = auth.uid());
-- Existing owned equipment starts with 10 uses.
insert into public.equipment_durability(user_id,item_id)
select ui.user_id,ui.item_id from public.user_items ui
join public.aura_items ai on ai.id=ui.item_id
where ai.slot in ('socks','boots')
on conflict do nothing;
-- Atomic renewal; charges the CURRENT shop price, never client-supplied prices.
create or replace function public.renew_equipment(p_item_id text)
returns integer language plpgsql security definer set search_path = public
as $$
declare v_uid uuid := auth.uid(); v_cost integer; v_balance integer; v_slot text;
begin
 if v_uid is null then raise exception 'Authentication required'; end if;
 select slot into v_slot from public.aura_items where id=p_item_id;
 if v_slot not in ('socks','boots') or v_slot is null then raise exception 'Not renewable'; end if;
 if not exists(select 1 from public.user_items where user_id=v_uid and item_id=p_item_id)
 then raise exception 'Item not owned'; end if;
 select cost into v_cost from public.shop_items where id=p_item_id and active=true and available=true;
 if v_cost is null or v_cost < 0 then raise exception 'Item not for sale'; end if;
 select coins into v_balance from public.profiles where id=v_uid for update;
 if v_balance is null or v_balance < v_cost then raise exception 'Insufficient coins'; end if;
 update public.profiles set coins=coins-v_cost where id=v_uid;
 insert into public.equipment_durability(user_id,item_id,remaining)
 values(v_uid,p_item_id,10)
 on conflict(user_id,item_id) do update set remaining=10;
 return v_cost;
end $$;
revoke all on function public.renew_equipment(text) from public;
grant execute on function public.renew_equipment(text) to authenticated;
-- IMPORTANT: Do not expose a durability-consumption RPC to authenticated users.
-- Consumption must be server-authoritative and idempotent per match ID.
