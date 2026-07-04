# Feature Specification: Juego Lectura de Notas

**Feature Branch**: `master`
**Created**: 2026-07-04
**Status**: Baseline (Documented Existing Functionality)

## User Scenarios & Testing

### User Story 1 - Identificación de Notas en el Pentagrama (Priority: P1)
Como estudiante, quiero ver una nota colocada de forma aleatoria en el pentagrama y presionar la tecla correcta en el piano en pantalla para ganar puntos y avanzar.

**Acceptance Scenarios**:
1. **Given** el juego de notas activo (`juegos/game.html`), **When** se muestra una nota en el pentagrama, **Then** el usuario debe presionar la tecla del piano correspondiente para que se considere un acierto.
2. **Given** una respuesta incorrecta, **When** el usuario falla, **Then** se le resta una vida del contador de corazones.

## Requirements

### Functional Requirements
- **FR-001**: El juego DEBE contar con 6 niveles progresivos y un nivel personalizado.
- **FR-002**: Las notas DEBEN ser representadas como cabezas de nota académicas en formato SVG.
- **FR-003**: El piano en pantalla DEBE sonar mediante muestras precargadas de audio real de piano al tocar cada tecla.
- **FR-004**: El pentagrama DEBE seguir las coordenadas de alineación para la Clave de Sol y Clave de Fa Unicode.

### Non-Functional Requirements
- **NFR-001**: El piano DEBE ser deslizable horizontalmente (`overflow-x: auto`) en móviles verticales para permitir tocar dos octavas sin comprometer el espacio táctil.
