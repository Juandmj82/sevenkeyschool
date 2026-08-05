# Constructor de Melodías — Especificación

## Descripción

Juego educativo de construcción de melodías para niños que aprenden música en Seven Keys School. El jugador coloca notas y silencios sobre un pentagrama interactivo y puede escuchar el resultado en tiempo real.

## Archivos

- `juegos/constructor.html` — estructura y estilos de la interfaz
- `juegos/constructor.js` — lógica del juego, renderizado SVG y audio

## Modos de juego

### Modo Libre
El jugador construye libremente una melodía hasta completar los tiempos del compás. Puede escucharla con el botón ▶ Escuchar.

### Modo Reto
El juego genera una melodía objetivo aleatoria, la reproduce, y el jugador debe recrearla. Tiene vidas (corazones) y puntaje. En cada ronda el jugador puede volver a escuchar la melodía objetivo hasta 3 veces.

## Sistema de niveles

Cada nivel introduce exactamente un concepto musical nuevo:

| Nivel | Nombre | Figuras disponibles | Silencios | Compases | Etiquetas DO-RE-MI |
|-------|--------|---------------------|-----------|----------|--------------------|
| 1 | Solo negras | Negra | No | 1 (4/4) | Sí |
| 2 | + Silencios | Negra | Sí | 1 (4/4) | Sí |
| 3 | + Blanca | Negra, Blanca | Sí | 1 (4/4) | Sí |
| 4 | + Redonda | Negra, Blanca, Redonda | Sí | 1 (4/4) | Sí |
| 5 | Dos compases | Todas | Sí | 2 (4/4) | No |

La configuración de cada nivel vive en el objeto `LEVELS` en `constructor.js`:

```js
const LEVELS = {
  1: { allowedDurations: ["negra"], restAllowed: false, maxBeats: 4, numMeasures: 1, showNoteLabels: true },
  2: { allowedDurations: ["negra"], restAllowed: true,  maxBeats: 4, numMeasures: 1, showNoteLabels: true },
  3: { allowedDurations: ["negra","blanca"], restAllowed: true, maxBeats: 4, numMeasures: 1, showNoteLabels: true },
  4: { allowedDurations: ["negra","blanca","redonda"], restAllowed: true, maxBeats: 4, numMeasures: 1, showNoteLabels: true },
  5: { allowedDurations: ["negra","blanca","redonda"], restAllowed: true, maxBeats: 8, numMeasures: 2, showNoteLabels: false }
};
```

## Notación musical

Todas las figuras y silencios siguen la notación estándar:

| Símbolo | Representación SVG |
|---------|-------------------|
| Negra | Cabeza rellena + plica vertical |
| Blanca | Cabeza hueca (solo trazo) + plica vertical |
| Redonda | Cabeza hueca, sin plica |
| Silencio de negra | Zigzag (garabato estándar) |
| Silencio de blanca | Rectángulo negro sentado encima de una línea |
| Silencio de redonda | Rectángulo negro colgando bajo una línea |

Las funciones de renderizado son `drawNoteAt(x, y, duration)` y `drawRestAt(x, duration)` en `constructor.js`.

## Pentagrama

- Dibujado en SVG, 5 líneas con espaciado de 20px
- Clave de Sol al inicio
- Indicación de compás 4/4
- Barras de compás según `numMeasures` del nivel
- Líneas adicionales (ledger lines) para notas fuera del pentagrama
- Etiquetas DO-RE-MI bajo cada nota en niveles 1-4

## Audio

- Samples de piano real cargados desde `assets/piano/` (formato OGG/MP3)
- Fallback a síntesis con Web Audio API si los samples no cargan
- Guard `isPlaying` para evitar reproducciones simultáneas

## Modo Reto — Escuchar otra vez

- Constante `MAX_REPLAYS = 3`
- El botón `#btn-replay` aparece solo en Modo Reto
- Cada clic decrementa `replaysLeft` y actualiza el texto del botón
- Al llegar a 0 el botón se deshabilita con texto "Sin más escuchas"
- `startNewRound()` reinicia `replaysLeft = MAX_REPLAYS` al comenzar cada ronda

## Historial de cambios relevantes

| Fecha | Cambio |
|-------|--------|
| 2026-08-04 | Implementación inicial de 5 niveles progresivos |
| 2026-08-04 | Notación musical fiel para blanca, redonda y silencios |
| 2026-08-04 | Pentagrama con compás 4/4 y barras de compás |
| 2026-08-04 | Corrección botón "Volver al Menú" (apuntaba a index.html en vez de constructor.html) |
| 2026-08-05 | Botón "Escuchar otra vez" en Modo Reto con límite de 3 escuchas por ronda |
