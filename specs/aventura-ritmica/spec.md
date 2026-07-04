# Feature Specification: Aventura Rítmica

**Feature Branch**: `master`
**Created**: 2026-07-04
**Status**: Baseline (Documented Existing Functionality)

## User Scenarios & Testing

### User Story 1 - Balanza de Tiempos (Priority: P1)
Como estudiante, quiero arrastrar figuras rítmicas (negras, corcheas, blancas) a los platos de una balanza digital para entender su peso rítmico y equilibrar el compás.

**Acceptance Scenarios**:
1. **Given** la Balanza de Tiempos activa, **When** el usuario coloca figuras que sumen exactamente 4 tiempos en un compás de 4/4, **Then** la balanza se equilibra y marca el compás como completado.

### User Story 2 - Seguir el Ritmo (Metrónomo) (Priority: P1)
Como estudiante, quiero presionar un botón rítmico siguiendo los golpes de un metrónomo para entrenar mi precisión de tempo musical.

**Acceptance Scenarios**:
1. **Given** el ejercicio de Seguir el Ritmo, **When** el metrónomo emite un pulso, **Then** el usuario debe presionar el botón táctil en el instante correcto para ganar puntos de precisión.

## Requirements

### Functional Requirements
- **FR-001**: El juego DEBE dividirse en 3 fases: Balanza de Tiempos, Eco Rítmico y Sigue el Ritmo.
- **FR-002**: El metrónomo DEBE ser generado usando el oscilador del Web Audio API.
- **FR-003**: El botón de entrada rítmica DEBE registrar eventos de pantalla táctil (`touchstart` / `mousedown`) con latencia cero.
- **FR-004**: El sistema DEBE calcular la precisión en milisegundos en comparación con el tempo ideal definido por los BPM.
