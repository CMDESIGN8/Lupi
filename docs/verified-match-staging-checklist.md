# Verificación de partidos — entorno de pruebas

**No ejecutar en producción.** Las migraciones 20261031, 20261101,
20261102, 20261103, 20261104 y 20261105 deben aplicarse **en ese orden**
en un proyecto Supabase de pruebas. Revisar primero triggers existentes
de `matches`, tipos de columnas y permisos. Desplegar allí la Edge Function
`verified-match`. El frontend debe conservar
`VITE_VERIFIED_MATCHES` desactivado.

## Usuario de prueba

Crear un usuario exclusivo de staging con cinco cartas propias en las
posiciones 1–5 del mazo activo. Equipar medias y botines con durabilidad
10/10. Nunca usar credenciales de producción.

## Pruebas no destructivas

Con variables de entorno configuradas:

```sh
CONFIRM_STAGING_ONLY=YES \
STAGING_SUPABASE_URL=https://STAGING_PROJECT.supabase.co \
STAGING_SUPABASE_ANON_KEY=... \
STAGING_TEST_EMAIL=... \
STAGING_TEST_PASSWORD=... \
deno run --allow-env --allow-net scripts/test-verified-match-staging.ts
```

El script valida: inicio con mazo real, rechazo del cierre prematuro,
reanudación sin exposición de semilla, rechazo de decisiones no pendientes,
primer turno y rechazo de repetición con versión antigua.

## Pruebas manuales restantes

1. Completar ocho turnos y todas las decisiones, respetando al menos
   tres segundos entre turnos. Registrar marcador devuelto por servidor.
2. Finalizar una vez: verificar exactamente una fila en `matches`,
   una en `equipment_match_consumptions`, y 9/10 en medias y botines.
3. Repetir `finish` con el mismo ID: debe devolver el mismo `match_id`
   sin nueva fila ni desgaste adicional.
4. Verificar rechazo de `finish` antes del turno ocho y con una
   decisión pendiente.
5. Iniciar sesión con otro usuario de pruebas y comprobar que no pueda
   consultar, avanzar ni finalizar la sesión del primero.
6. Probar desconexión y `resume`, sesión expirada y dos solicitudes
   simultáneas de `turn` con la misma versión.
7. Confirmar que no se acreditan XP ni recompensas por solicitudes
   directas del navegador.

**Criterio de liberación:** no habilitar `VITE_VERIFIED_MATCHES` ni
fusionar el PR hasta que el circuito completo pase en staging.
