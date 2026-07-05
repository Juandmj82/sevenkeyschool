# Feature Specification: Teoría Interactiva del Pentagrama

**Feature Branch**: `master`
**Created**: 2026-07-04
**Status**: Baseline (Documented Existing Functionality)

## User Scenarios & Testing

### User Story 1 - Aprendizaje de Líneas y Espacios (Priority: P1)
Como estudiante principiante, quiero pasar a través de diapositivas interactivas que me expliquen qué es el pentagrama, las claves, y tocar las líneas/espacios del pentagrama para escuchar qué nota representan y ver su nombre.

**Acceptance Scenarios**:
1. **Given** el módulo de teoría (`juegos/teoria.html`), **When** el usuario hace clic en una línea o espacio en el pentagrama de práctica, **Then** suena la nota musical de piano y se resalta visualmente.

## Requirements

### Functional Requirements
- **FR-001**: El juego DEBE contar con un carrusel de diapositivas de lecciones explicativas con controles de "Anterior" y "Siguiente".
- **FR-002**: Las diapositivas DEBEN contener pentagramas SVG dinámicos que cambien de clave (Sol y Fa) según la lección.
- **FR-003**: El pentagrama interactivo final DEBE permitir tocar las 5 líneas y 4 espacios, mostrando dinámicamente el nombre de la nota musical y el color asignado.
