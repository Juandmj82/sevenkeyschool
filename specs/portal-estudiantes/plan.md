# Implementation Plan: Portal de Tutoriales Protegidos para Estudiantes

**Branch**: `master` | **Date**: 2026-07-04 | **Spec**: [spec.md](file:///Users/juand/CascadeProjects/seven-keys-website/specs/portal-estudiantes/spec.md)

**Input**: Feature specification from `/specs/portal-estudiantes/spec.md`

## Summary
Diseñar e implementar un portal web privado y protegido para los alumnos de la escuela de música Seven Keys. La solución utilizará **Supabase** como backend serverless para autenticación y base de datos de perfiles y videos. El bot de Python existente en el sistema local se extenderá para leer el estado del alumno en Obsidian, actualizar automáticamente Supabase y generar links pre-redactados para el envío de credenciales vía correo (Gmail de la escuela) y WhatsApp. Los videos se incrustarán dinámicamente usando iframes de Google Drive cargados solo a usuarios con sesión activa. Adicionalmente, se incluirá una bitácora interactiva donde los alumnos registren sus notas de progreso por video, las cuales serán leídas por el bot local de Python y anexadas en Obsidian.

## Technical Context
- **Language/Version**: JavaScript (ES6+), Python 3.11 (para el bot local).
- **Primary Dependencies**: Supabase JS SDK (@supabase/supabase-js), Gmail API / SMTP para el envío de correos, API de Telegram para las notificaciones del bot.
- **Storage**: Supabase Database (PostgreSQL) para usuarios, videos, y bitácoras.
- **Testing**: Pruebas de integración locales del flujo de autenticación y scripts unitarios para el bot de Python.
- **Target Platform**: Navegadores Web (Mobile-First responsive, compatibilidad con iOS y Android) y entorno local macOS para el bot de Obsidian.
- **Project Type**: Web Application (Frontend en GitHub Pages + Backend Serverless en Supabase + Script de sincronización local en Python).
- **Performance Goals**: Carga de autenticación y renderizado de videos en menos de 1.5 segundos.
- **Constraints**: No-scroll locks, latencia de reproducción mínima, enlaces no expuestos en el código HTML de manera directa.
- **Scale/Scope**: < 50 alumnos activos inicialmente.

## Constitution Check
- **Spec-Driven & Documentation-First**: ✅ Creado spec.md y este plan.md antes del desarrollo.
- **Preservation of Existing Features**: ✅ El código del portal se creará en un archivo nuevo (`juegos/tutoriales.html`) para no alterar el index de juegos ni los juegos interactivos.
- **Responsive & Mobile-First Design**: ✅ El portal de tutoriales será optimizado para móviles verticales con flexbox y `dvh`.
- **Acoustic & Performance Excellence**: ✅ Se utilizará la API nativa de Google Drive para la reproducción eficiente sin latencia de renderizado.

## Project Structure

### Documentation (this feature)
```text
specs/portal-estudiantes/
├── plan.md              # Este archivo
├── research.md          # Investigación de APIs y esquema Supabase
├── data-model.md        # Definición de tablas y campos en PostgreSQL
├── quickstart.md        # Escenarios de prueba end-to-end
└── tasks.md             # TODO List para la ejecución
```

### Source Code
```text
estudiantes/
├── index.html           # [NEW] Interfaz del portal del estudiante
└── css/
    └── tutoriales.css   # [NEW] Estilos responsivos del portal
/Users/juand/Developer/Asistente/
├── sync_portal.py       # [NEW] Script del bot de Python para sincronizar Obsidian -> Supabase
├── credentials.json
└── .env
```

**Structure Decision**: El portal web se implementará como una página nueva independiente en la carpeta `/estudiantes/`, consumiendo Supabase mediante JS. El bot de sincronización residirá en la carpeta del asistente local.
