# Feature Specification: Estimulación Temprana (Baseline)

**Feature Branch**: `master`

**Created**: 2026-07-04

**Status**: Baseline (Documented Existing Functionality)

**Input**: Documentación del estado actual del juego de Estimulación Temprana (Xilófono e Cielo y Tierra).

## User Scenarios & Testing

### User Story 1 - Juego Libre en el Xilófono (Priority: P1)
Como bebé/niño pequeño, quiero tocar libremente barras de colores en la pantalla para escuchar sus sonidos y ver destellos de partículas de colores que coincidan con la barra presionada.

**Why this priority**: Es la base interactiva y el primer juego visible en el catálogo de estimulación.
**Independent Test**: Tocar cada barra en la pantalla. Cada barra debe reproducir un sonido musical afinado correspondiente y emitir partículas de su color.

**Acceptance Scenarios**:
1. **Given** la pantalla del Xilófono activa, **When** el usuario hace clic o pulsa una barra, **Then** la barra se anima, reproduce un sonido afinado y genera partículas de colores.

---

### User Story 2 - Cielo y Tierra: Nivel 1 Descubrir (Priority: P1)
Como bebé, quiero explorar los elementos en la zona de Cielo (arriba) y de Tierra (abajo) para aprender la asociación espacial entre altura física y altura musical (agudo arriba, grave abajo).

**Why this priority**: Establece la base pedagógica fundamental del juego de dos alturas.
**Independent Test**: Tocar estrellas/pájaros en la zona del Cielo y tambores/ranas en la zona de la Tierra. El cielo debe producir timbres cristalinos y agudos; la tierra debe producir timbres tipo marimba graves y cálidos.

**Acceptance Scenarios**:
1. **Given** Cielo y Tierra Nivel 1 activo, **When** el usuario toca una estrella o el sol, **Then** suena un chime cristalino agudo y brilla el elemento.
2. **Given** Cielo y Tierra Nivel 1 activo, **When** el usuario toca una rana o el caracol, **Then** suena una nota grave de marimba cálida (Octava 3) y brilla el elemento.

---

### User Story 3 - Cielo y Tierra: Nivel 2 El Reto (Priority: P2)
Como niño pequeño, quiero escuchar un sonido del parlante amarillo y presionar el dibujo que emite ese mismo sonido para probar mi discriminación y memoria auditiva.

**Why this priority**: Introduce el juego estructurado guiado y la retroalimentación.
**Independent Test**: Hacer clic en el altavoz, escuchar el tono y tocar el dibujo. Si se acierta, el Teacher celebra. Si se falla, se da retroalimentación visual de apoyo.

**Acceptance Scenarios**:
1. **Given** Cielo y Tierra Nivel 2 activo, **When** el usuario pulsa el altavoz por segunda vez, **Then** el elemento correcto brilla y se mueve temporalmente como una pista táctil.
2. **Given** Cielo y Tierra Nivel 2 activo, **When** el usuario selecciona la figura correcta, **Then** suena la fanfarria de éxito, el avatar de Teacher Juan Di sonríe y se avanza al siguiente reto.

## Requirements

### Functional Requirements
- **FR-001**: El juego DEBE estar dividido en dos pantallas accesibles mediante pestañas superiores: Xilófono y Cielo y Tierra.
- **FR-002**: Las barras del xilófono DEBEN ser de colores planos sin etiquetas de texto (DO, RE, MI...) para evitar sobrecargar visualmente al niño.
- **FR-003**: En Cielo y Tierra, la pantalla DEBE estar dividida en dos mitades (Cielo arriba y Tierra abajo).
- **FR-004**: Los sonidos de la Tierra DEBEN ser sintetizados como marimba de madera (fundamental en sine, segundo armónico en sine y cuarto armónico en triangle para ataque) en la Octava 3 real (261Hz - 440Hz).
- **FR-005**: Si en Nivel 2 el usuario no recuerda o no asocia el sonido, tocar el altavoz central una segunda vez DEBE activar la pista visual (resplandor y movimiento del elemento objetivo).
- **FR-006**: El avatar de Teacher Juan Di DEBE reaccionar al estado de acierto (celebración) o error (apoyo visual) en tiempo real en el banner superior.

### Non-Functional Requirements
- **NFR-001**: La interfaz DEBE ser 100% responsiva en orientación vertical en celulares, tabletas y ordenadores. El contenedor de juego (`.sandbox-area`) DEBE limitarse a una altura máxima de `460px` y pegarse directamente al header para optimizar la proporción visual.
- **NFR-002**: Al rotar a horizontal (landscape), el sitio DEBE usar el flujo vertical fluido adaptado sin bloquear con overlays de rotación forzada.

## Success Criteria

### Measurable Outcomes
- **SC-001**: Latencia de respuesta de audio menor a 50ms al tocar un elemento (latencia cero real usando Web Audio API).
- **SC-002**: Compatibilidad completa de visualización en pantallas desde 320px de ancho sin scroll horizontal.

## Assumptions
- Los navegadores de los usuarios soportan Web Audio API de forma nativa.
- No se requiere persistencia en base de datos para los puntajes en este nivel de estimulación.
