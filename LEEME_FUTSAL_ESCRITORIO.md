# Futsal PvP · Previa de escritorio

Copiar la carpeta src de este ZIP sobre tu proyecto, aceptando los reemplazos. No borrar tu carpeta src: este archivo es un parche para la previa de Futsal PvP mostrada en la captura.

## Cambios

- Composición más amplia con panel escénico, reflejos y bases para los jugadores.
- Personajes con encuadre y tamaño parejos. Futsal utiliza OwnedCardPortrait para consultar apariencia y equipamiento cuando faltan en la presencia del lobby, en lugar de mostrar una inicial. Depende de los datos y permisos disponibles del servidor.
- VS y cuenta regresiva integrados entre los jugadores, sin cubrir toda la pantalla.
- Datos del duelo en tres bloques y estados de preparación visibles durante la cuenta.
- Ajustes para escritorio de poca altura y preferencia de movimiento reducido.

No se cambian las reglas, el intercambio de confirmaciones, el tiempo de cuenta, los RPC del partido ni las recompensas. La cancha durante el partido no se modifica con este parche. Los estilos nuevos de escritorio están limitados a Futsal.

## Verificación

Compilación del componente y CSS con esbuild correcta. Sin diagnósticos de TypeScript en DuelVersus.tsx. Seis pruebas con conexión simulada: dos personajes sin presencia del lobby, orientación al ser visitante, cuenta central única, conexión/confirmación/salida, confirmación de búsqueda rápida y conservación de las otras modalidades. Falta verificar el aspecto en un navegador real y la carga de ambos personajes con una sesión conectada.

Pruebas opcionales:

```sh
npm install -D vitest jsdom @testing-library/react
npx vitest run --config tests/futsal-desktop.config.ts
```

## Resultado: dos columnas

Ver la cancha y Relato del partido se agrupan en una misma grilla de dos columnas desde 900 px, con ancho parejo y sin superposición. En móvil quedan en una columna. Cada panel puede abrirse de forma independiente. Se conserva el contenido del partido y la lógica de recompensas. Compilación del componente y CSS correcta.
