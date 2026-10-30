-- LupiApp / Flores Club: initial socks price = 50 LupiCoins.
-- Stage only: review constraints and purchase RPC behavior before executing.
-- Copy existing Flores items' shop metadata to preserve category/effect conventions.
begin;
-- Expand the existing slot check without removing supported slots.
alter table public.aura_items drop constraint if exists aura_items_slot_check;
alter table public.aura_items add constraint aura_items_slot_check
 check (slot = any (array['top'::text,'bottom'::text,'socks'::text,'boots'::text,'accessory'::text]));
insert into public.aura_items
 (id,name,slot,rarity,world,drop_code,icon,image_url,required_level,equipped_image_url,color)
values
 ('flores-club-medias-rojas','Medias rojas · Flores Club','socks','common','SPORT','FLORES CLUB 2026','🧦','/items/flores-club-medias-rojas.png',1,'/items/flores-club-medias-rojas.png','#c92c36'),
 ('flores-club-medias-verdes','Medias verdes · Flores Club','socks','common','SPORT','FLORES CLUB 2026','🧦','/items/flores-club-medias-verdes.png',1,'/items/flores-club-medias-verdes.png','#168e53')
on conflict (id) do update
set name=excluded.name,slot=excluded.slot,image_url=excluded.image_url,
 equipped_image_url=excluded.equipped_image_url,color=excluded.color;

-- Match the confirmed shop item contract: uniformes / aura_item / item_id.
insert into public.shop_items
 (id,title,description,cost,icon,category,badge,stock,effect_type,
  effect_payload,available,active,sort_order,created_at)
values
 ('flores-club-medias-rojas','Flores Club - Medias Rojas','Medias de arquero · Flores Club',50,'🧦','uniformes',null,null,'aura_item',
  '{"item_id":"flores-club-medias-rojas"}'::jsonb,true,true,51,now()),
 ('flores-club-medias-verdes','Flores Club 8va - Medias Verdes','Medias 8va división · Flores Club',50,'🧦','uniformes',null,null,'aura_item',
  '{"item_id":"flores-club-medias-verdes"}'::jsonb,true,true,52,now())
on conflict (id) do update set
 title=excluded.title,description=excluded.description,cost=excluded.cost,
 icon=excluded.icon,category=excluded.category,effect_type=excluded.effect_type,
 effect_payload=excluded.effect_payload,available=excluded.available,active=excluded.active;
commit;
