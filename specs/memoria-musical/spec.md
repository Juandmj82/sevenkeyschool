# Feature Specification: Memoria Musical (Estilo Simon)

**Feature Branch**: `master`
**Created**: 2026-07-28
**Status**: Implemented

## User Scenarios & Testing

### User Story 1 - Repetir la Secuencia (Priority: P1)
Como estudiante, quiero observar una secuencia de pads de colores que se iluminan y suenan, y luego repetirla en el mismo orden tocando los pads, para entrenar mi memoria musical.

**Acceptance Scenarios**:
1. **Given** el juego Memoria Musical (`juegos/memoria.html`), **When** la secuencia termina de reproducirse, **Then** el usuario debe tocar los pads en el mismo orden mostrado.
2. **Given** el usuario completó una ronda correctamente, **When** avanza a la siguiente ronda, **Then** la secuencia se reproduce de nuevo desde el inicio con una nota adicional agregada al final.
3. **Given** el usuario toca un pad fuera de orden, **When** ocurre el error, **Then** pierde una vida y la secuencia actual se repite tras un mensaje de ánimo de Teacher Juan Di.

## Requirements

### Functional Requirements
- **FR-001**: El tablero DEBE generarse con 4, 6 u 8 pads según la dificultad elegida, cada uno mapeado a una nota musical con color propio (mismos colores que Atrapa Notas y Pesca Notas).
- **FR-002**: La velocidad de reproducción de la secuencia DEBE ser configurable (Lento/Medio/Rápido) antes de iniciar.
- **FR-003**: El sistema DEBE reproducir el sonido real de cada nota (sintetizador propio vía Web Audio API) al iluminar cada pad.
- **FR-004**: El usuario DEBE contar con 3 vidas; al perderlas todas se muestra el modal de fin de juego con la ronda alcanzada.
- **FR-005**: El juego DEBE guardar la ronda más alta alcanzada (récord) en `localStorage`, persistente entre partidas.
- **FR-006**: Al alcanzar la ronda 10 el sistema DEBE mostrar una pantalla de victoria con confeti y la opción de continuar jugando para superar el récord.
- **FR-007**: En las rondas 3, 5, 7 y 9 el sistema DEBE mostrar un mensaje de ánimo distinto de Teacher Juan Di (toast positivo) para motivar el avance, dado que el juego no tiene niveles formales que desbloquear.
