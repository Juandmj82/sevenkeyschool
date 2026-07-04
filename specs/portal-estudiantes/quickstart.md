# Quickstart: Escenarios de Prueba del Portal de Estudiantes

Este documento define la guía paso a paso para verificar que la autenticación, la carga de videos y la bitácora de práctica funcionen correctamente en el portal web y mediante la sincronización del bot.

## 1. Escenario de Prueba: Autenticación del Alumno
- **Objetivo**: Garantizar que solo alumnos activos puedan acceder a los videos de su respectivo instrumento.
- **Preparación**: Crear un estudiante de prueba en Supabase con correo `test@sevenkeys.com`, instrumento `arpa` y estado `activo`.
- **Pasos**:
  1. Abrir la página `/juegos/tutoriales.html`.
  2. Verificar que se muestra el formulario de inicio de sesión y no se expone ningún video.
  3. Ingresar las credenciales correctas.
  4. Confirmar que se redirige al portal, se muestra el saludo del Teacher Juan Di y se cargan los videos de *Arpa*.
  5. Cerrar sesión y confirmar que se limpian los datos y se bloquea el acceso.

## 2. Escenario de Prueba: Bitácora de Progreso y Sincronización
- **Objetivo**: Confirmar que los comentarios de práctica del alumno se guarden y se importen a Obsidian.
- **Pasos**:
  1. En la tarjeta de un video, escribir una nota de prueba: *"Practiqué compás 3 al 8"* y presionar "Guardar nota".
  2. Confirmar en la base de datos de Supabase que se crea el registro en la tabla `bitacoras` con `sincronizado = false`.
  3. Ejecutar el script del bot local: `python3 sync_portal.py`.
  4. Abrir la carpeta de estudiantes en Obsidian y verificar que en la nota del estudiante de prueba se creó la sección `## 📝 Bitácora de práctica del alumno` con la fecha y el texto del comentario.
  5. Verificar que en Supabase el registro ahora tiene `sincronizado = true`.
