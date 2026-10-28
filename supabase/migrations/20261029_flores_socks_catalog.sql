-- LupiApp / Flores Club: initial socks price = 50 LupiCoins.
-- Stage only: review constraints and purchase RPC behavior before executing.
-- Copy existing Flores items' shop metadata to preserve category/effect conventions.
begin;
insert into public.aura_items
 (id,name,slot,rarity,world,drop_code,icon,image_url,required_level,equipped_image_url,color)
values
 ('flores-club-medias-rojas','Medias rojas · Flores Club','socks','common','SPORT','FLORES CLUB 2026','🧦','/items/flores-club-medias-rojas.svg',1,'/items/flores-club-medias-rojas.svg','#c92c36'),
 ('flores-club-medias-verdes','Medias verdes · Flores Club','socks','common','SPORT','FLORES CLUB 2026','🧦','/items/flores-club-medias-verdes.svg',1,'/items/flores-club-medias-verdes.svg','#168e53')
on conflict (id) do update
set name=excluded.name,slot=excluded.slot,image_url=excluded.image_url,
 equipped_image_url=excluded.equipped_image_url,color=excluded.color;

-- Clone the existing shop row for the corresponding shorts, including its effect
-- metadata, substituting the item id inside the JSON payload.
with source_items as (
 select 'flores-club-short-rojo'::text as source_id,
        'flores-club-medias-rojas'::text as new_id,
        'Medias rojas · Flores Club'::text as new_title
 union all
 select 'flores-club-8va-short-negro','flores-club-medias-verdes','Medias verdes · Flores Club'
)
insert into public.shop_items
 (id,title,description,cost,icon,category,badge,stock,effect_type,
  effect_payload,available,active,sort_order,created_at)
select s.new_id,s.new_title,'Medias de fútbol · Flores Club 2026',50,'🧦',
       old.category,old.badge,old.stock,old.effect_type,
       replace(old.effect_payload::text,to_json(old.id)::text,to_json(s.new_id)::text)::jsonb,
       old.available,old.active,old.sort_order+1,now()
from source_items s
join public.shop_items old on old.id=s.source_id
on conflict (id) do update set cost=50,
 title=excluded.title,description=excluded.description,icon=excluded.icon,
 effect_payload=excluded.effect_payload;
commit;
