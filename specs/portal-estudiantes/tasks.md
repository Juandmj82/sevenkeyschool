# Tasks: Portal de Tutoriales Protegidos para Estudiantes

**Input**: Design documents from `/specs/portal-estudiantes/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Puede correr en paralelo (diferentes archivos, sin dependencias cruzadas).
- **[Story]**: A qué historia de usuario pertenece (US1, US2, US3).

---

## Phase 1: Setup (Shared Infrastructure)
- [x] T001 Inicializar tablas y esquemas relacionales en PostgreSQL de Supabase ejecutando las sentencias DDL definidas en `specs/portal-estudiantes/data-model.md`.
- [x] T002 Crear la estructura de archivos en la web: `estudiantes/index.html` y `estudiantes/css/tutoriales.css`.
- [x] T003 Configurar variables de entorno en el bot de Python local (`/Users/juand/Developer/Asistente/.env`) para incluir las credenciales de Supabase y el Gmail de la escuela.

---

## Phase 2: Foundational (Blocking Prerequisites)
- [x] T004 Configurar e inicializar el cliente JS de Supabase en `estudiantes/index.html` usando la CDN oficial y claves públicas anonimizadas.
- [x] T005 Implementar la lógica del formulario de inicio de sesión (`Supabase Auth`) en `estudiantes/index.html` para validar correos y contraseñas.
- [x] T006 [P] Diseñar los estilos CSS base de marca unificada (Premium Dark Gold) con tipografías **Cinzel** y **Plus Jakarta Sans** en `estudiantes/css/tutoriales.css`.

---

## Phase 3: User Story 1 - Acceso Protegido y Carga de Videos (Priority: P1) 🎯 MVP
**Goal**: Permitir a los alumnos loguearse, filtrar sus videos por instrumento e incrustarlos de forma dinámica con iframe de Drive con descargas desactivadas.
**Independent Test**: Seguir el escenario de pruebas #1 en `quickstart.md`.

- [x] T007 [P] [US1] Desarrollar la maquetación HTML/CSS responsiva de la vista principal del estudiante en `estudiantes/index.html`.
- [x] T008 [US1] Implementar la función de consulta a la base de datos de Supabase para obtener las IDs de los videos de Google Drive del instrumento del alumno tras un login exitoso.
- [x] T009 [US1] Crear el renderizado dinámico en JavaScript para inyectar los iframes de Google Drive (visualización privada) en el contenedor seguro.
- [x] T010 [US1] Crear script básico de sincronización de estudiantes en el asistente local (`/Users/juand/Developer/Asistente/sync_portal.py`) para dar de alta/baja cuentas desde Obsidian.

---

## Phase 4: User Story 2 - Registro de Notas de Práctica y Sincronización (Priority: P2)
**Goal**: Permitir que el estudiante agregue comentarios de progreso sobre cada video y que el bot los vuelque en Obsidian.
**Independent Test**: Seguir el escenario de pruebas #2 en `quickstart.md`.

- [x] T011 [US2] Diseñar la sección y formulario de comentarios/bitácora para cada video en `estudiantes/index.html`.
- [x] T012 [US2] Implementar la lógica JS para registrar notas de práctica en la tabla `bitacoras` de Supabase vinculadas al alumno.
- [x] T013 [US2] Extender el script de Python `sync_portal.py` para consultar las nuevas notas no sincronizadas de Supabase y anexarlas automáticamente a los expedientes en Obsidian.

---

## Phase 5: User Story 3 - Personalización, Saludo y Consejo de Teacher Juan Di (Priority: P3)
**Goal**: Saludo personalizado con avatar de Teacher Juan Di, subida de foto de perfil y consejo rítmico/práctica aleatorio dinámico.
**Independent Test**: Acceder con diferentes cuentas y comprobar saludos dinámicos y frases motivadoras.

- [x] T014 [US3] Agregar sección de edición de perfil (cambiar nombre y URL de foto) en el portal de estudiantes.
- [x] T015 [US3] Crear una lista en JavaScript de consejos motivadores y renderizar aleatoriamente uno en el portal al cargar, junto con el avatar de Teacher Juan Di.

---

## Phase 6: Polish & Cross-Cutting Concerns
- [x] T016 [P] Asegurar coherencia tipográfica de fuentes Cinzel y Plus Jakarta Sans en todo el portal.
- [x] T017 Probar el comportamiento responsivo en móviles verticales y asegurar la no existencia de scrolls horizontales o elementos cortados.
- [x] T018 Ejecutar todas las pruebas del documento `quickstart.md`.
