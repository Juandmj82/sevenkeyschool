# Feature Specification: Rediseño moderno de la Landing Page

**Feature Branch**: `claude/modern-page-redesign-au5tax`
**Created**: 2026-09-02
**Status**: Propuesta (pendiente de aprobación de merge a `master`)
**Base**: tag `v1.1.0` (producción `v1.0.0` + mejoras SEO/rendimiento)

## Motivación

La landing (`index.html`) mezclaba Tailwind 2, ~280 líneas de CSS inline, ~160 líneas de JS inline y un `js/main.js` sin enlazar. Visualmente resultaba genérica: degradados planos, tarjetas repetidas (tres bloques con las mismas "características"), 15 iframes de YouTube cargando de forma anticipada y un embed de Instagram huérfano. El objetivo es una landing extremadamente profesional, moderna y fresca, con transiciones y elementos tipo motion graphic, **sin perder ni una línea de contenido ni el trabajo de SEO**.

## Decisiones de diseño

| Tema | Decisión |
|---|---|
| Paleta | Se conserva la corporativa: azul profundo `#2A4365`, azul `#4299E1`, dorado `#F6AD55`; se añade una superficie crema `#FBF8F3` y un navy oscuro `#16243C` como acentos de superficie. No hay cambio de paleta (constitución, Governance). |
| Tipografía | Display: **Fraunces** (variable, itálica para citas). Texto/UI: **Plus Jakarta Sans**. Google Fonts con `preconnect` y `display=swap`. |
| Stack | HTML5 + CSS moderno propio (variables, `clamp()`, grid, container queries, `@layer`) + JS ES6 vanilla. **Sin Tailwind ni librerías de animación.** |
| Motion | CSS keyframes, `IntersectionObserver`, Web Animations API, SVG animado (`stroke-dashoffset`), scroll-driven animations bajo `@supports`. Todo respeta `prefers-reduced-motion`. |

## User Scenarios & Testing

### User Story 1 - Primera impresión y navegación (P1)
Como padre/madre o estudiante potencial, quiero llegar a la landing y entender en segundos qué ofrece Seven Keys, con una experiencia visual cuidada que invite a seguir bajando.

**Acceptance Scenarios**:
1. **Given** la landing en un móvil de 390px o un escritorio de 1440px, **When** carga, **Then** el hero ocupa la primera pantalla con titular, cita, CTAs (WhatsApp, Programas, Juegos) y el motion graphic musical (pentagrama que se dibuja, notas flotantes, 7 teclas que se iluminan, ecualizador), sin scroll horizontal.
2. **Given** cualquier ancho, **When** el usuario hace scroll, **Then** la barra de navegación se compacta con efecto vidrio, el enlace de la sección visible se marca como activo y una barra de progreso dorada refleja el avance.
3. **Given** un móvil, **When** pulsa el botón hamburguesa, **Then** se abre un menú a pantalla completa con enlaces en cascada, el scroll del fondo se bloquea y se cierra con Esc, con la X o al navegar.

### User Story 2 - Ver clases reales sin penalizar la carga (P1)
Como visitante, quiero ver videos de clases y de la trayectoria del fundador, pero la página debe cargar rápido.

**Acceptance Scenarios**:
1. **Given** las secciones "Nuestras Clases" y "Galería de Experiencia", **When** carga la página, **Then** no se carga ningún `<iframe>` de YouTube; cada video muestra su miniatura y un botón de reproducción.
2. **When** el usuario pulsa una miniatura, **Then** se inyecta el `<iframe>` de YouTube con `autoplay=1` en su lugar, conservando el `title` accesible.
3. **When** el usuario filtra "Virtuales" / "Presenciales", **Then** las tarjetas se reordenan con una transición suave (FLIP).

### User Story 3 - Confiar gracias a los testimonios (P1)
Como padre/madre, quiero leer opiniones reales de otras familias.

**Acceptance Scenarios**:
1. **Given** la sección de testimonios, **Then** están los 11 testimonios con su texto íntegro, nombre y procedencia.
2. **When** el usuario usa flechas, puntos, teclado o swipe, **Then** el carrusel avanza; el autoplay se pausa con hover/foco o al ocultar la pestaña.
3. **When** un testimonio largo aparece recortado, **Then** un botón "Leer más" lo expande.

### User Story 4 - Contactar (P1)
1. **Given** cualquier punto de la página tras el hero, **Then** hay un botón flotante de WhatsApp; en la sección Contacto están WhatsApp, Instagram, TikTok y Email con los mismos enlaces actuales.

### User Story 5 - Coherencia con la Zona de Juegos y el Portal (P2)
1. **Given** `juegos/index.html` y `estudiantes/index.html`, **Then** su cabecera (logo, botón "Volver al Inicio") comparte el lenguaje visual de la landing; la lógica y los juegos no cambian.

## Requirements

### Functional Requirements
- **FR-001**: La landing DEBE conservar íntegros: meta tags, Open Graph/Twitter, canonical, Clarity, JSON-LD `EducationalOrganization` y `FAQPage`, y todo el copy actual (historia, programas, metodología, 11 testimonios, biografía del fundador, 15 videos, artículo, 5 FAQ, enlaces de contacto).
- **FR-002**: Los ids de sección existentes (`inicio`, `nuestra-escuela`, `nuestras-clases`, `programas`, `metodologia`, `fundador`, `preguntas-frecuentes`, `contacto`) DEBEN mantenerse como anclas.
- **FR-003**: Los videos de YouTube y el embed de Instagram DEBEN cargarse solo bajo demanda (facade con miniatura/botón).
- **FR-004**: Las imágenes del artículo DEBEN abrirse en un lightbox (`<dialog>`) que se cierra con Esc, clic fuera o botón.
- **FR-005**: Las FAQ DEBEN ser un acordeón nativo (`<details>`) accesible por teclado.
- **FR-006**: Todo movimiento DEBE desactivarse con `prefers-reduced-motion: reduce`, mostrando el contenido visible de inmediato.
- **FR-007**: La landing NO DEBE depender de `css/tailwind.min.css` ni de ninguna librería JS externa (Font Awesome solo para íconos de marcas sociales).
- **FR-008**: Los indicadores numéricos del hero DEBEN basarse solo en datos ya presentes en el sitio (fundación 2020, 10 instrumentos, estudiantes en 4 países según testimonios/videos).

### Non-Functional Requirements
- **NFR-001**: Sin scroll horizontal entre 360px y 1920px; layouts fluidos con `clamp()`, `dvh` y `minmax()`.
- **NFR-002**: Todas las `<img>` con `width`/`height` y `loading="lazy"` salvo el logo/hero (CLS estable).
- **NFR-003**: `css/styles.css` ≤ 55 KB y `js/main.js` ≤ 20 KB sin minificar (sin frameworks ni librerías externas).
- **NFR-004**: Contraste AA: el dorado `#F6AD55` solo como texto sobre navy; sobre fondos claros se usa `--navy-700`.
- **NFR-005**: Un único `<h1>`; jerarquía de encabezados consistente; `:focus-visible` visible en todos los controles.

## Fuera de alcance
- Los juegos individuales (`juegos/*.html` salvo cabecera del dashboard), la lógica del Portal y `coming-soon.html` (que sigue usando el CSS de Tailwind ya construido).
