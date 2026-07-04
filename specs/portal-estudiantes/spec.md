# Feature Specification: Portal de Tutoriales Protegidos para Estudiantes

**Feature Branch**: `master`
**Created**: 2026-07-04
**Status**: Draft

## Clarifications
### Session 2026-07-04
- Q: ¿Qué nivel de seguridad y complejidad de infraestructura prefieres implementar en esta primera iteración? → A: Opción A (Supabase - Serverless).
- Q: ¿Cómo deseas integrar los videos de Google Drive para proteger los enlaces y la reproducción? → A: Opción A (Google Drive Iframe Dinámico, guardando IDs en Supabase y cargando los iframes mediante renderizado dinámico en JS).
- Q: ¿Cómo planeas gestionar el alta de nuevos alumnos y la asignación/bloqueo de accesos de manera cómoda? → A: Opción A (Sincronización automática a través de tu bot de Python existente).
- Q: ¿Cómo obtendrán los alumnos su contraseña/código de acceso y cómo se maneja la seguridad/cambios? → A: Opción A híbrida (Bot genera contraseña segura, envía correo automático desde el Gmail de la escuela, y notifica por Telegram al Teacher con enlace pre-redactado de WhatsApp. El alumno puede cambiar la contraseña en la web, pero el Teacher mantiene control desactivando la cuenta desde Obsidian).
- Q: ¿Deseas incluir la característica de "Bitácora de Práctica del Alumno" en la primera versión? → A: Opción A (Sí, incluir Bitácora en v1: el alumno escribe notas por video en la web y el bot de Python las lee de Supabase y las escribe en el expediente de Obsidian).

## User Scenarios & Testing

### User Story 1 - Acceso Protegido por Alumno (Priority: P1)
Como estudiante activo de arpa o piano, quiero ingresar mis credenciales de acceso (correo y contraseña/código) en un portal seguro para ver la lista de tutoriales y videos exclusivos asociados a mi instrumento sin que personas externas puedan acceder a ellos.

**Why this priority**: Es la necesidad de negocio principal y el control de acceso a los videos.
**Independent Test**: Intentar acceder a la página de tutoriales sin ingresar credenciales válidas debe denegar el acceso. Al ingresar credenciales correctas, debe mostrarse la lista de videos correspondientes al instrumento del alumno.

### User Story 2 - Registro de Notas de Práctica (Priority: P2)
Como estudiante, quiero añadir anotaciones o reportar avances en cada video del tutorial para llevar un registro de lo que he estudiado y las dificultades que he tenido.

**Why this priority**: Permite que el estudio sea interactivo y que el profesor sepa el avance del alumno antes de la clase.
**Independent Test**: Agregar una anotación en un video del portal; verificar que se guarda en la web y que, al correr el bot, aparece en el archivo del estudiante en Obsidian.

## Requirements

### Functional Requirements
- **FR-001**: La plataforma DEBE proveer un formulario de autenticación para los alumnos.
- **FR-002**: El sistema DEBE filtrar los videos mostrados de acuerdo al instrumento que estudia el alumno (ej. Arpa para Juan Clavijo, Piano para Gabriel Clavijo).
- **FR-003**: Los enlaces a los videos de Google Drive o el almacenamiento de videos DEBEN estar protegidos contra descargas e inspección fácil de código.
- **FR-004**: Los administradores (Teacher Juan Di) DEBEN poder revocar el acceso a un alumno (por ejemplo, si deja de pagar sus mensualidades).
- **FR-005**: La autenticación del usuario y la validación de permisos se DEBE procesar mediante la API de Supabase Auth y base de datos relacional Supabase.
- **FR-006**: Las IDs de los videos de Google Drive DEBEN estar almacenadas en una tabla de base de datos segura en Supabase y ser consultadas dinámicamente solo tras confirmar una sesión válida del estudiante.
- **FR-007**: El estado de cuenta y accesos del alumno en Supabase DEBEN ser sincronizados por el script del bot local de Python leyendo los expedientes del Obsidian local (`Estado: Activo` o `Inactivo`).
- **FR-008**: El estudiante DEBE poder cambiar su contraseña desde un panel de perfil en la web de manera segura.
- **FR-009**: El sistema DEBE permitir al estudiante guardar comentarios/notas de progreso por video, almacenándolos en Supabase.
- **FR-010**: El bot local de Python DEBE leer periódicamente las notas de progreso de Supabase y anexarlas automáticamente al archivo `.md` de cada estudiante en Obsidian bajo la sección `## 📝 Bitácora de práctica del alumno`.

## Success Criteria

### Measurable Outcomes
- **SC-001**: Ningún usuario no autenticado debe ser capaz de reproducir o ver los enlaces de los videos.
- **SC-002**: El portal debe cargar y validar las credenciales del alumno en menos de 1.5 segundos.
- **SC-003**: El bot debe poder sincronizar las notas de práctica hacia Obsidian en menos de 10 segundos al ejecutarse.
