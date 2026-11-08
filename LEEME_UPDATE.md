# Update anime adaptado a PPT

Copiar la carpeta src de este ZIP sobre la carpeta src de tu proyecto, aceptando reemplazos. No borrar tu carpeta src: este ZIP contiene únicamente el parche y usa las imágenes y componentes que ya tiene LupiApp.

## Se conserva

- Nombres PIEDRA, PAPEL y TIJERA, sus reglas y nombres de jugadores.
- Usuario a la izquierda, rival a la derecha, caras grandes circulares y marcador entre ambas.
- Encuadre con margen del rostro del usuario, manos grandes, reglas bajo las opciones y resultado móvil compacto.
- Escena sin pelota ni emojis flotantes y sin franja superior duplicada.
- Acreditación del servidor y reintento de premios. No se cambian importes ni límites.

## Efectos integrados del update

Reflectores y luces de gradas, líneas de velocidad, ondas de choque, chispas, confeti al ganar, destello suave y gritos con los nombres de PPT. La capa de efectos queda en la zona de choque para respetar las caras y el marcador.

Expresiones: concentración durante la cuenta, sorpresa en el impacto y reacción según el resultado. Se conserva el +1 hacia el marcador y el aviso de próxima jugada. Sonidos de cuenta, impacto y público respetan el control de sonido. No se agrega sacudida de cámara. Se respeta movimiento reducido.

## Verificación

9 pruebas con Vitest y servidor de partida simulado: nombres y orientación, dos retratos y un marcador, ausencia de pelota/emojis, secuencia, bloqueo de doble envío, victoria, derrota, empate, resultado final diferido y cancelación al salir. Compilación con esbuild correcta. Sin diagnósticos TypeScript en los archivos de esta integración; el proyecto completo requiere sus dependencias y configuración originales. No se verificó visualmente en un navegador real ni se comprobó una acreditación real en Supabase en este entorno.

Para ejecutar las pruebas en tu proyecto (si faltan las dependencias):

```sh
npm install -D vitest jsdom @testing-library/react
npx vitest run --config tests/rps-anime.config.ts
```

La configuración de pruebas se entrega dentro de tests para no reemplazar tu configuración principal.

## Escena unificada

La cancha, las caras, las manos, el marcador, el sonido y el resultado comparten ahora un único contenedor y fondo continuo. Las recompensas y los controles de revancha quedan fuera de la escena. Se mantiene la versión compacta del resultado en móvil. Compilación correcta y 9 pruebas pasadas, incluida la presencia de un solo contenedor para cancha y estado.
