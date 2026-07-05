# Feature Specification: Landing Page & Games Dashboard

**Feature Branch**: `master`
**Created**: 2026-07-04
**Status**: Baseline (Documented Existing Functionality)

## User Scenarios & Testing

### User Story 1 - Navegación en la Landing Page (Priority: P1)
Como padre o estudiante potencial, quiero ver información sobre la escuela de música Seven Keys, sus programas y el botón de acceso para ingresar a la plataforma de juegos.

**Acceptance Scenarios**:
1. **Given** la landing page principal (`index.html`), **When** el usuario hace clic en el CTA de "Juegos", **Then** se le redirige al catálogo general (`juegos/index.html`).

### User Story 2 - Filtro de Juegos en el Dashboard (Priority: P1)
Como estudiante, quiero filtrar los juegos por categoría (Teoría, Melodía, Ritmo, Estimulación) para ver y seleccionar el desafío que quiero realizar.

**Acceptance Scenarios**:
1. **Given** el dashboard (`juegos/index.html`), **When** el usuario hace clic en una pestaña de categoría, **Then** se ocultan las secciones de las otras categorías y se muestra únicamente la seleccionada.

## Requirements

### Functional Requirements
- **FR-001**: La landing page DEBE presentar la propuesta de valor de Seven Keys usando tipografía Cinzel y Jakarta.
- **FR-002**: El dashboard DEBE listar todos los niveles de juego de lectura de notas y juegos complementarios en tarjetas con la clase `.level-card`.
- **FR-003**: Si es la primera vez que se ingresa al dashboard, el sistema DEBE mostrar el modal de bienvenida (`#welcome-modal-overlay`) con el mensaje de Teacher Juan Di.
- **FR-004**: Al hacer clic en un nivel bloqueado, el sistema DEBE mostrar un modal con la descripción detallada del nivel y sus requisitos.

### Non-Functional Requirements
- **NFR-001**: El dashboard de juegos DEBE usar una cuadrícula responsiva (`.levels-grid`) que configure las columnas usando `repeat(auto-fit, minmax(min(295px, 100%), 1fr))`.
- **NFR-002**: La tarjeta de Estimulación Temprana DEBE auto-limitar su ancho máximo a `295px` en desktop para alinearse simétricamente.
