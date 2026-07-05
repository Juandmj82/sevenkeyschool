# Research: Portal de Tutoriales y Autenticación Supabase

## 1. Supabase Configuración y Autenticación
- **Servicio**: Supabase Auth (correo y contraseña).
- **Esquema de BD sugerido**:
  - `estudiantes` (tabla):
    - `id`: UUID (Primary Key, enlazada a `auth.users`).
    - `email`: TEXT.
    - `nombre`: TEXT.
    - `instrumento`: TEXT (arpa / piano).
    - `estado`: TEXT (activo / inactivo).
  - `videos` (tabla):
    - `id`: UUID.
    - `title`: TEXT.
    - `drive_id`: TEXT (el ID del archivo de Google Drive).
    - `instrumento`: TEXT (para filtrar).
    - `orden`: INTEGER.
  - `bitacoras` (tabla):
    - `id`: UUID.
    - `estudiante_id`: UUID (FK a `estudiantes`).
    - `video_id`: UUID (FK a `videos`).
    - `nota`: TEXT.
    - `fecha`: TIMESTAMP.
    - `sincronizado`: BOOLEAN (default: false, para que el bot solo extraiga lo nuevo).

## 2. Integración de Videos (Google Drive)
- **Método**: Iframe dinámico usando la URL de visualización de Drive:
  - `https://drive.google.com/file/d/{DRIVE_ID}/preview`
- **Configuración de Google Drive**: 
  - Los archivos deben compartirse como "Cualquier persona con el enlace puede ver".
  - En la configuración avanzada del recurso compartido de Drive, se debe marcar: "Desactivar opciones para descargar, imprimir y copiar para lectores y comentadores". Esto oculta el botón de descarga en el reproductor.

## 3. Sincronización con Bot de Python
- **API**: Biblioteca `supabase-py` (o peticiones HTTP directas a la API REST de Supabase mediante `requests`).
- **Gmail**: Se usarán las credenciales de SMTP para enviar correos transaccionales desde el correo de la escuela.
- **WhatsApp**: Se usará el enlace pre-redactado `https://wa.me/{telefono}?text={mensaje}` para notificar vía Telegram y permitir envío rápido.
