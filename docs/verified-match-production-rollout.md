# Verified matches — despliegue controlado en producción

**Estado:** NO instalado. No activar `VITE_VERIFIED_MATCHES` ni fusionar PR #1 todavía.

## 1. Antes de escribir
- Hacer backup/restauración verificable de la base (Supabase Dashboard).
- Confirmar que el proyecto seleccionado es LupiApp y que hay una ventana de mantenimiento.
- Ejecutar `supabase/verification/verified_match_production_preflight.sql` en SQL Editor.
- Todos los requisitos de columnas y UUID deben dar PASS. Si una fila da FAIL o REVIEW, detenerse y revisar.
- Comprobar que `handle_match_rewards` sigue siendo no-op.
- Mantener la Edge Function `verified-match` sin exponerla a usuarios; mantener el flag de frontend desactivado.

## 2. Migraciones, orden estricto
Usar los contenidos exactos de la rama `feature/flores-socks-durability`:
1. `20261031_verified_match_durability.sql`
2. `20261101_verified_match_sessions.sql`
3. `20261102_verified_match_state.sql`
4. `20261103_verified_match_start.sql`
5. `20261104_verified_match_finish.sql`
6. `20261105_verified_match_pacing.sql`

**No ejecutar en producción hasta completar la revisión de funciones y
validación SQL.** Evitar ejecutar cada archivo por separado sin rollback
coordinado. La instalación debe revisarse como una unidad transaccional
`BEGIN; ... COMMIT;`, con manejo de errores y comprobación de privilegios.
No utilizar `DROP TABLE ... CASCADE` para revertir en producción.

## 3. Después de instalar, antes de activar
- Confirmar que las tablas nuevas tienen RLS y no tienen políticas de
  escritura para `anon` ni `authenticated`.
- Confirmar que `start_verified_match`, `advance_verified_match_state`,
  `finalize_verified_match` y `consume_equipment_for_verified_match`
  solo tienen EXECUTE para `service_role`.
- Confirmar que `matches` conserva su trigger y sus datos históricos.
- Desplegar la Edge Function con el servicio protegido por JWT.
- Probar con una cuenta controlada, sin usar las cuentas de jugadores reales.
- Verificar 8 turnos, cierre idempotente, marcador, un solo registro de
  consumo y decremento de durabilidad exactamente una vez.
- Solo entonces considerar activar el flag y fusionar PR #1.

**Advertencia:** el éxito del build y de las pruebas unitarias no acredita
la compatibilidad de las migraciones con la base real.
