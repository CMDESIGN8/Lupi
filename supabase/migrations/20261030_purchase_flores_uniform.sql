-- Unified atomic purchase for the two Flores Club kits.
-- Keeps legacy RPCs untouched. Run after 20261029_flores_socks_catalog.sql.
create or replace function public.purchase_flores_uniform(p_item_ids text[])
returns jsonb language plpgsql security definer set search_path = public, pg_temp
as $$
declare
 v_uid uuid := auth.uid();
 v_allowed_red constant text[] := array['flores-club-camiseta-roja','flores-club-short-rojo','flores-club-medias-rojas'];
 v_allowed_green constant text[] := array['flores-club-8va-camiseta-verde','flores-club-8va-short-negro','flores-club-medias-verdes'];
 v_missing text[] := array[]::text[];
 v_id text;
 v_shop public.shop_items%rowtype;
 v_coins integer;
 v_total integer := 0;
 v_discount integer := 0;
 v_history_id uuid;
 v_history_ids uuid[] := array[]::uuid[];
begin
 if v_uid is null then raise exception 'No autenticado'; end if;
 if p_item_ids is null or cardinality(p_item_ids) not between 1 and 3
 or (select count(distinct x) from unnest(p_item_ids) x) <> cardinality(p_item_ids)
 or not (p_item_ids <@ v_allowed_red or p_item_ids <@ v_allowed_green)
 then raise exception 'Selección inválida'; end if;
 select coins into v_coins from public.profiles where id=v_uid for update;
 if not found then raise exception 'Perfil inexistente'; end if;
 v_coins := coalesce(v_coins,0);
 for v_id in select unnest(p_item_ids) order by 1 loop
   if exists(select 1 from public.user_items where user_id=v_uid and item_id=v_id) then continue; end if;
   select * into v_shop from public.shop_items where id=v_id and active and available for update;
   if not found or v_shop.cost is null or v_shop.cost <= 0
   or v_shop.effect_type <> 'aura_item'
   or v_shop.effect_payload->>'item_id' is distinct from v_id
   then raise exception 'Prenda no disponible: %',v_id; end if;
   if v_shop.stock is not null and v_shop.stock <= 0 then raise exception 'Sin stock: %',v_id; end if;
   if not exists(select 1 from public.aura_items where id=v_id) then raise exception 'Equipable inexistente: %',v_id; end if;
   v_total := v_total + v_shop.cost;
   v_missing := array_append(v_missing,v_id);
 end loop;
 if cardinality(v_missing)=0 then raise exception 'Uniforme ya adquirido'; end if;
 -- Preserve existing 8va two-piece discount, and extend to full three-piece kits.
 if (p_item_ids <@ v_allowed_green and cardinality(v_missing)=2 and
     'flores-club-medias-verdes' <> all(v_missing))
 or cardinality(v_missing)=3 then
   v_discount := least(50,v_total);
 end if;
 v_total := v_total-v_discount;
 if v_coins < v_total then raise exception 'No tenés suficientes LUPICOINS'; end if;
 update public.profiles set coins=v_coins-v_total where id=v_uid;
 foreach v_id in array v_missing loop
   select * into v_shop from public.shop_items where id=v_id;
   insert into public.user_items(user_id,item_id,equipped) values(v_uid,v_id,false);
   update public.shop_items set stock=stock-1 where id=v_id and stock is not null;
   insert into public.purchase_history
    (user_id,item_id,cost_paid,original_cost,discount_applied,effect_result)
   values
    (v_uid,v_id,v_shop.cost-case when v_id=v_missing[array_length(v_missing,1)] then v_discount else 0 end,
     v_shop.cost,
     case when v_discount>0 then jsonb_build_object('bundle_discount',case when v_id=v_missing[array_length(v_missing,1)] then v_discount else 0 end) else null end,
     jsonb_build_object('type','aura_item','payload',v_shop.effect_payload))
   returning id into v_history_id;
   v_history_ids := array_append(v_history_ids,v_history_id);
   if v_shop.stock is not null then null; end if;
   insert into public.equipment_durability(user_id,item_id,remaining,max_uses)
   select v_uid,v_id,10,10 from public.aura_items where id=v_id and slot in ('socks','boots')
   on conflict(user_id,item_id) do nothing;
 end loop;
 return jsonb_build_object('success',true,'newCoins',v_coins-v_total,'costPaid',v_total,
 'granted',to_jsonb(v_missing),'purchaseIds',to_jsonb(v_history_ids),'bundleDiscount',v_discount);
end $$;
revoke all on function public.purchase_flores_uniform(text[]) from public;
grant execute on function public.purchase_flores_uniform(text[]) to authenticated;
