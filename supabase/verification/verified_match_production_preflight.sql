-- LupiApp verified matches: production preflight (READ ONLY).
-- Run in Supabase SQL Editor before any pending migration.
-- All rows should return PASS. This script makes no schema/data changes.
with required_columns(table_name,column_name,data_type) as (
 values
 ('matches','id','uuid'),('matches','user_id','uuid'),
 ('matches','opponent_type','text'),('matches','user_deck_id','uuid'),
 ('matches','user_score','integer'),('matches','opponent_score','integer'),
 ('matches','winner_id','uuid'),('matches','experience_gained','integer'),
 ('decks','id','uuid'),('decks','user_id','uuid'),('decks','is_active','boolean'),
 ('deck_cards','deck_id','uuid'),('deck_cards','user_card_id','uuid'),
 ('deck_cards','position','integer'),
 ('user_cards','id','uuid'),('user_cards','user_id','uuid'),
 ('user_cards','player_id','uuid'),('user_cards','socio_id','uuid'),
 ('user_cards','card_type','text'),('user_cards','level','integer'),
 ('user_cards','experience','integer'),
 ('players','id','uuid'),('players','name','text'),
 ('players','position','text'),('players','category','text'),
 ('players','overall_rating','integer'),('players','pace','integer'),
 ('players','dribbling','integer'),('players','passing','integer'),
 ('players','defending','integer'),('players','finishing','integer'),
 ('players','physical','integer'),
 ('profiles','id','uuid'),('profiles','username','text'),
 ('profiles','position','text'),('profiles','category','text'),
 ('profiles','user_card_pace','integer'),('profiles','user_card_dribbling','integer'),
 ('profiles','user_card_passing','integer'),('profiles','user_card_defending','integer'),
 ('profiles','user_card_finishing','integer'),('profiles','user_card_physical','integer'),
 ('user_items','user_id','uuid'),('user_items','item_id','text'),
 ('user_items','equipped','boolean'),
 ('aura_items','id','text'),('aura_items','slot','text'),
 ('equipment_durability','user_id','uuid'),
 ('equipment_durability','item_id','text'),
 ('equipment_durability','remaining','integer'),
 ('equipment_durability','max_uses','integer')
),
missing as (
 select r.table_name,r.column_name,r.data_type
 from required_columns r
 left join information_schema.columns c
   on c.table_schema='public' and c.table_name=r.table_name
   and c.column_name=r.column_name and c.data_type=r.data_type
 where c.column_name is null
),
checks as (
 select 'Required table columns'::text as check_name,
        case when not exists(select 1 from missing) then 'PASS' else 'FAIL' end as result,
        coalesce((select string_agg(table_name||'.'||column_name||' ('||data_type||')',', ')
                  from missing),'All present') as details
 union all
 select 'Verified session table not yet installed',
        case when to_regclass('public.verified_match_sessions') is null then 'PASS' else 'REVIEW' end,
        coalesce(to_regclass('public.verified_match_sessions')::text,'Not installed')
 union all
 select 'Consumption table not yet installed',
        case when to_regclass('public.equipment_match_consumptions') is null then 'PASS' else 'REVIEW' end,
        coalesce(to_regclass('public.equipment_match_consumptions')::text,'Not installed')
 union all
 select 'Existing reward trigger',
        case when exists(
          select 1 from pg_trigger t
          where t.tgrelid='public.matches'::regclass
            and t.tgname='on_match_finished' and not t.tgisinternal
        ) then 'PASS' else 'REVIEW' end,
        'Verify handle_match_rewards remains a no-op'
 union all
 select 'Postgres UUID generator',
        case when to_regprocedure('gen_random_uuid()') is not null then 'PASS' else 'FAIL' end,
        'Required for verified match session IDs'
)
select * from checks order by check_name;
