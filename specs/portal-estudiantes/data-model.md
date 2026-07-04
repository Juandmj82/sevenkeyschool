# Data Model: Portal de Tutoriales

## 1. Esquema Relacional de Base de Datos (PostgreSQL en Supabase)

### Tabla: `estudiantes`
```sql
CREATE TABLE public.estudiantes (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    nombre TEXT NOT NULL,
    instrumento TEXT NOT NULL CHECK (instrumento IN ('arpa', 'piano', 'guitarra', 'bateria')),
    estado TEXT NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

### Tabla: `videos`
```sql
CREATE TABLE public.videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    drive_id TEXT NOT NULL,
    instrumento TEXT NOT NULL CHECK (instrumento IN ('arpa', 'piano', 'guitarra', 'bateria')),
    orden INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

### Tabla: `bitacoras`
```sql
CREATE TABLE public.bitacoras (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    estudiante_id UUID NOT NULL REFERENCES public.estudiantes(id) ON DELETE CASCADE,
    video_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
    nota TEXT NOT NULL,
    fecha TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    sincronizado BOOLEAN DEFAULT false NOT NULL
);
```
