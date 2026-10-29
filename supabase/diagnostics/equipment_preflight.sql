-- READ-ONLY diagnostics: run in Supabase SQL Editor and inspect output.
-- Do NOT run the equipment migration until the schema is verified.
select table_name,column_name,data_type,udt_name,is_nullable
from information_schema.columns
where table_schema='public'
  and table_name in ('aura_items','shop_items','user_items','user_stats','matches','equipment_durability')
order by table_name,ordinal_position;

select c.conrelid::regclass::text as table_name,c.conname,pg_get_constraintdef(c.oid) as definition
from pg_constraint c
where c.conrelid in ('public.aura_items'::regclass,'public.shop_items'::regclass,'public.user_items'::regclass,'public.matches'::regclass)
order by table_name,c.conname;

select p.proname,pg_get_function_identity_arguments(p.oid) as arguments,
       pg_get_function_result(p.oid) as result_type
from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public' and p.proname in
 ('purchase_flores_outfit','purchase_flores_8va','equip_aura_item','renew_equipment')
order by p.proname;

select tgrelid::regclass::text as table_name,tgname,pg_get_triggerdef(oid) as definition
from pg_trigger
where not tgisinternal and tgrelid in ('public.matches'::regclass,'public.user_items'::regclass)
order by table_name,tgname;

select id,slot,name from public.aura_items
where id like 'flores-club-%' or slot in ('boots','socks')
order by id;

select id,cost,active,available from public.shop_items
where id like 'flores-club-%' or id='aura-boots'
order by id;
