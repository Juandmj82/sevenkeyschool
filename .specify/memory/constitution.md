<!--
Version change: 0.0.0 -> 1.0.0
List of modified principles: None (Adopted new constitution v1.0.0)
Added sections: Core Principles, Technical Constraints & Architecture, Review & Quality Gates, Governance
Templates updated: ✅ updated
-->
# Seven Keys School Constitution

## Core Principles

### I. Spec-Driven & Documentation-First
Toda nueva funcionalidad, nivel, juego o modificación significativa en el comportamiento de la plataforma debe documentarse primero como una especificación funcional en `specs/` y planificarse en `plan.md` antes de escribir cualquier línea de código. No se alterarán los archivos existentes para desarrollo sin un plan aprobado.

### II. Preservation of Existing Features
El desarrollo de nuevas características debe garantizar la absoluta compatibilidad con los juegos y lecciones ya existentes (Lectura de Notas, Teoría, Aventura Rítmica, Atrapa Notas, Tiro al Blanco y Estimulación). Queda prohibida la remoción o alteración de funcionalidades existentes a menos que sea explícitamente requerido por el usuario en una especificación.

### III. Responsive & Mobile-First Design
Todo desarrollo visual debe ser 100% responsivo y cómodo en dispositivos móviles (vertical y horizontal) sin forzar de manera artificial giros de pantalla, utilizando layouts fluidos basados en flexbox, variables dinámicas como `dvh` y `clamp()`, y protecciones contra desbordamiento y scroll accidental en iOS y Android.

### IV. Acoustic & Performance Excellence
Los motores de sonido (muestras acústicas reales y generadores sintéticos) deben poseer latencia cero cargando y decodificando buffers de audio en RAM. Para los rangos graves en dispositivos móviles, se priorizará la síntesis aditiva percusiva armónicamente rica (como la síntesis marimba) para garantizar que las notas sigan siendo audibles y musicales en altavoces pequeños.

## Technical Constraints & Architecture

### A. Core Stack
La plataforma de juegos se mantiene estrictamente sobre tecnologías web nativas (HTML5, Vanilla CSS, JS ES6 y Web Audio API) para maximizar la velocidad de carga y evitar dependencias de compilación externas complejas.

### B. SVG Academic Alignment Rules
La ubicación y tamaño de las claves en formato texto Unicode (`𝄞` y `𝄢`) sobre elementos SVG deben seguir estrictamente las proporciones académicas definidas en la memoria de desarrollo para evitar desalineaciones con las líneas del pentagrama.

## Review & Quality Gates

### A. Static Code & Clean Syntax
El código debe evitar la redeclaración de variables, redundancias o dependencias muertas. Las variables globales compartidas deben declararse limpiamente y documentarse en la memoria.

### B. Local Verification Loop
Todo cambio en el diseño estético o funcionalidad debe ser validado localmente a través del servidor local antes de ser empaquetado para su despliege.

## Governance

Cualquier cambio de arquitectura, alteración de la paleta de colores corporativos o redefinición de mecánicas pedagógicas de los juegos existentes debe ser ratificado modificando esta Constitución e incrementando su número de versión bajo versionamiento semántico.

**Version**: 1.0.0 | **Ratified**: 2026-07-04 | **Last Amended**: 2026-07-04
