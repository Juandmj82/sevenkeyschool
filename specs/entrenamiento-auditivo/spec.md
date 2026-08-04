# Feature Specification: Entrenamiento Auditivo

**Feature Branch**: `master`
**Created**: 2026-07-28
**Status**: Implemented

## User Scenarios & Testing

### User Story 1 - Entrenar el Oído por Fases (Priority: P1)
Como estudiante, quiero escuchar sonidos y responder preguntas sobre ellos (dirección melódica, intervalos, calidad de acorde, cantidad de notas) para desarrollar mi oído musical de forma progresiva.

**Acceptance Scenarios**:
1. **Given** el juego Entrenamiento Auditivo (`juegos/oido.html`) en la Fase 1, **When** el usuario escucha dos notas consecutivas, **Then** debe indicar si la segunda nota subió o bajó respecto a la primera.
2. **Given** una respuesta correcta, **When** el usuario alcanza el número de aciertos objetivo de la fase, **Then** se muestra la pantalla de victoria y se desbloquea la siguiente fase.
3. **Given** el usuario pierde las 3 vidas, **When** ocurre la tercera respuesta incorrecta, **Then** se muestra el modal de fin de juego con opción de reintentar.

## Requirements

### Functional Requirements
- **FR-001**: El sistema DEBE ofrecer 5 fases progresivas, cada una con un tipo de ejercicio distinto: Sube o Baja, Nombra el Intervalo, Mayor o Menor, Cuenta las Notas, y un Desafío Mixto Contrarreloj que combina los 4 anteriores.
- **FR-002**: El usuario DEBE poder reproducir el sonido de la pregunta actual las veces que necesite antes de responder.
- **FR-003**: Las Fases 1-4 NO DEBEN tener límite de tiempo por pregunta; la Fase 5 DEBE limitar cada respuesta a 6 segundos.
- **FR-004**: El sistema DEBE generar las preguntas de audio mediante un sintetizador propio (Web Audio API), sin depender de samples externos por red.
- **FR-005**: El usuario DEBE contar con 3 vidas por fase; al perderlas se muestra el modal de fin de juego.
- **FR-006**: Cada fase DEBE tener una meta de aciertos configurada (8 para las Fases 1-4, 12 para la Fase 5) para considerarse completada.
