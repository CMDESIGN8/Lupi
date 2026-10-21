# Lupi World — Identidad de jugadores V1

## Instalación
1. Reemplazar `src/components/SigningWelcome.tsx` por el incluido.
2. `SigningWelcome.css` es copia de la versión previa, para referencia; si ya ajustaste el diseño en tu proyecto, **conservá tu CSS actual**.
3. Crear `public/player-art/` y copiar allí imágenes individuales con fondo transparente (WebP/PNG).
4. En `PLAYER_ART_BY_ID` del TSX, asociar el `card.id` real a la URL del arte. También existe `PLAYER_ART_BY_NAME` para pruebas sin ID.

Ejemplo:
```tsx
const PLAYER_ART_BY_ID: Record<string,string> = {
  "uuid-real-del-jugador": "/player-art/juan-perez.webp",
};
```

## Comportamiento
- Se priorizan `image_url`, `imageUrl`, `portrait_url`, `portraitUrl` si existen en la carta.
- Luego se busca ID y después nombre normalizado en el registro.
- Si no hay imagen o falla, aparece el SVG original, con variante estable por identidad.
- Se eliminó el reparto por hash % 5: ningún jugador recibe automáticamente la imagen de otro.
- El marco y efectos de rareza siguen determinados por `overall_rating`.
- No se modifican Supabase, inventario, puntos, referidos, apertura ni recompensas.

## Importante
Esto implementa **asignación única y estable**, pero no crea ilustraciones nuevas. Para que los cinco jugadores del ejemplo tengan cinco retratos distintos, hay que generar/guardar cinco imágenes distintas y registrarlas. Los nombres por sí solos no garantizan identidad única si hay homónimos: en producción, usar IDs.
