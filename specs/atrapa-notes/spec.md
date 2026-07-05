# Feature Specification: Atrapa Notas (Burbujas en Movimiento)

**Feature Branch**: `master`
**Created**: 2026-07-04
**Status**: Baseline (Documented Existing Functionality)

## User Scenarios & Testing

### User Story 1 - Atrapando Burbujas Musicales (Priority: P1)
Como estudiante, quiero ver burbujas de colores con letras de notas musicales caer desde la parte superior del pentagrama y presionar la tecla del piano antes de que toquen la línea inferior para acumular puntos y evitar que exploten.

**Acceptance Scenarios**:
1. **Given** el juego Atrapa Notas (`juegos/atrapa.html`), **When** una burbuja marcada con la nota "DO" cae en el pentagrama, **Then** el usuario debe presionar la tecla "DO" del piano en pantalla para destruirla y sumar puntos.

## Requirements

### Functional Requirements
- **FR-001**: Las burbujas DEBEN generarse en la línea o espacio exacto del pentagrama SVG correspondiente a su nota musical.
- **FR-002**: El renderizado del juego y el movimiento de las burbujas DEBE ser manejado por un motor de Canvas 2D interactivo.
- **FR-003**: El piano en pantalla DEBE acoplarse con la detección de colisiones de las burbujas activas en tiempo real.
- **FR-004**: Si una burbuja toca el fondo de la pantalla sin ser atrapada, el usuario DEBE perder una vida.
