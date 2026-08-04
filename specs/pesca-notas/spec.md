# Feature Specification: Pesca Notas

**Feature Branch**: `master`
**Created**: 2026-07-28
**Status**: Implemented

**Origen**: Idea propuesta por un alumno de la escuela.

## User Scenarios & Testing

### User Story 1 - Pescar la Nota Correcta (Priority: P1)
Como estudiante, quiero leer o escuchar una nota objetivo y lanzar un anzuelo sobre el pez correcto en un estanque para practicar lectura de pentagrama y/o entrenamiento auditivo de forma lúdica.

**Acceptance Scenarios**:
1. **Given** el juego Pesca Notas (`juegos/pesca.html`) en modo "Ver y Pescar", **When** el sistema muestra una nota en el mini-pentagrama, **Then** el usuario debe tocar la pantalla sobre el pez que lleva esa nota para pescarlo.
2. **Given** el modo "Escuchar y Pescar", **When** el usuario toca el botón de reproducir sonido, **Then** el sistema reproduce la nota objetivo sin mostrarla visualmente.
3. **Given** un pez pescado con la nota correcta, **When** ocurre la captura, **Then** el pez desaparece con animación de captura y reaparece luego con la MISMA nota, manteniendo siempre exactamente un pez por cada nota activa (nunca puede quedar una nota sin pez correspondiente en el agua).
4. **Given** el usuario toca la pantalla, **When** hace clic/tap, **Then** se lanza un anzuelo animado desde arriba que desciende hasta el punto tocado y solo al llegar se resuelve si atrapó el pez correcto, uno equivocado, o si el anzuelo salió vacío (sin penalización en este último caso).

### User Story 2 - Ajustar la Dificultad (Priority: P2)
Como estudiante, quiero elegir la clave musical, la cantidad de peces, y si se muestran o no colores distintivos, para adaptar el reto a mi nivel.

**Acceptance Scenarios**:
1. **Given** la pantalla de configuración, **When** el usuario elige clave de Fa, **Then** el pool de notas y el mini-pentagrama usan el rango y el glifo de clave de Fa (C3-C4) en vez de Sol (C4-C5).
2. **Given** el modo "Sin Color (Desafío)", **When** se activa, **Then** todos los peces pierden su color distintivo (color neutro gris) pero conservan el nombre de la nota impreso, forzando lectura real en vez de emparejamiento visual por color.
3. **Given** la selección de dificultad, **When** el usuario elige 4, 6 u 8 peces, **Then** el estanque muestra esa cantidad de peces, cada uno con una nota distinta del pool activo.

### User Story 3 - Modo Contrarreloj (Priority: P2)
Como estudiante, quiero un modo cronometrado que registre mi tiempo total y mi captura más rápida, para tener una marca personal que superar.

**Acceptance Scenarios**:
1. **Given** el chip "Contrarreloj" activado, **When** el usuario inicia el juego, **Then** un cronómetro corre en el HUD durante toda la partida.
2. **Given** una partida contrarreloj completada (12 capturas correctas), **When** se muestra la pantalla de victoria, **Then** se despliega el tiempo total y la nota pescada más rápido, marcando "(RÉCORD)" en cada métrica si supera la marca guardada previamente.
3. **Given** un récord de contrarreloj ya guardado, **When** el usuario vuelve a la pantalla de inicio, **Then** se muestra una tarjeta "Marca del Estanque" con el récord total y la nota más veloz pescada hasta ahora.

## Requirements

### Functional Requirements
- **FR-001**: El sistema DEBE ofrecer dos modos de juego: "Ver y Pescar" (lectura en mini-pentagrama) y "Escuchar y Pescar" (solo audio, con botón de repetir sonido).
- **FR-002**: El sistema DEBE ofrecer selector de clave (Sol/Fa), cada una con su propio pool de notas y su glifo de clave vectorial (Bravura/SMuFL) anclado correctamente a su línea de referencia (Sol → 2da línea, Fa → 4ta línea).
- **FR-003**: El sistema DEBE ofrecer selector de dificultad por cantidad de peces (4/6/8) y modo de ayuda visual (Con Color / Sin Color).
- **FR-004**: Cada pez DEBE siempre representar exactamente una nota del pool activo; el respawn tras cualquier captura (correcta o incorrecta) DEBE preservar la misma nota del pez, y la selección del objetivo DEBE tomarse de las notas realmente presentes en el agua (nunca de la lista teórica), garantizando que el juego nunca pida una nota sin pez correspondiente.
- **FR-005**: La captura DEBE resolverse mediante una animación de anzuelo (caña) que desciende desde arriba hasta el punto tocado, con tiempos de bajada/subida configurados, en vez de una detección de clic instantánea sobre el pez.
- **FR-006**: En modo "Ver y Pescar", al pescar el pez correcto el sistema DEBE reproducir la nota real de ese pez (en vez de un sonido genérico de captura), para preparar el oído del usuario de cara al modo "Escuchar y Pescar".
- **FR-007**: El sistema DEBE cargar muestras reales de piano acústico (mismo soundfont FluidR3_GM usado en Atrapa Notas y el juego de Niveles 1-5) para la reproducción de notas, con reversión automática a un sintetizador propio si una muestra falla al cargar.
- **FR-008**: El usuario DEBE contar con 3 vidas; pescar un pez equivocado resta una vida sin terminar la partida hasta agotarlas.
- **FR-009**: La meta de victoria DEBE ser 12 capturas correctas, mostrando pantalla de victoria con confeti.
- **FR-010**: En modo Contrarreloj, el sistema DEBE medir el tiempo total de partida y el tiempo de la captura más rápida (desde que aparece el objetivo hasta que se pesca), guardando ambos récords (y la nota asociada a la captura más rápida) en `localStorage`, y mostrando el récord vigente en la pantalla de inicio antes de jugar.
