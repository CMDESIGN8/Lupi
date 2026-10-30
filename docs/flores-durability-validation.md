# Flores Club — validation before merge

## Already installed in Supabase
- 20261029_flores_socks_catalog.sql
- 20261028_equipment_durability.sql
- 20261030_purchase_flores_uniform.sql

## NOT installed
- 20261031_verified_match_durability.sql — do not execute until a trusted server verifies match completion.

## Current match security boundary
CardBattle writes recreational results directly to public.matches. Such inserts **must not** trigger equipment wear.
The server-only function consume_equipment_for_verified_match(match_id) must only be called by a trusted backend after it verifies completion, ownership, and legitimacy of the match. A client-provided match UUID alone is insufficient verification.

## Functional acceptance tests (staging account, never production coins)
1. Query shop_items for both socks: cost=50, effect_type=aura_item, effect_payload.item_id=id.
2. Buy red socks only: exactly 50 coins debited from profiles.coins, one user_items row, one purchase_history row.
3. Repeated purchase: no additional debit, no duplicate user_items row.
4. Buy all three green items when none owned: subtotal 450, bundle discount 50, debit 400.
5. Buy a green two-piece top+short kit: debit 350, then socks alone: debit 50.
6. Equip socks and boots simultaneously; each retains its slot.
7. Equipment starts 10/10; attempting renewal at 10/10 must fail without debiting.
8. After trusted wear has been implemented, one verified match consumes one use from each equipped socks/boots, never from top/bottom.
9. Repeating the same verified match ID consumes zero additional uses.
10. At 3/10 show warning, at 0/10 block match start; renew charges current shop price and restores 10/10.
11. Validate the same flow on mobile and desktop.

## Security requirements before enabling wear
- Trusted backend finalizes the match, not an arbitrary browser insert.
- Backend ensures authenticated participant and completed, non-cancelled match.
- Backend calls consume_equipment_for_verified_match using a service-role credential **stored only on the server**.
- The ledger is idempotent by match_id.
- Do not allow users to insert or delete equipment_match_consumptions.
- Ensure all match modes use the same trusted finalization path before making wear mandatory.

## SQL smoke test (read-only)
```sql
select id,cost,effect_type,effect_payload,active,available
from public.shop_items
where id in ('flores-club-medias-rojas','flores-club-medias-verdes');

select id,name,slot from public.aura_items
where id in ('flores-club-medias-rojas','flores-club-medias-verdes');

select proname,pg_get_function_identity_arguments(oid)
from pg_proc where pronamespace='public'::regnamespace
and proname in ('renew_equipment','purchase_flores_uniform');
```
