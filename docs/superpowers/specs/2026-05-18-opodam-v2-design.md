# OpoDAM v2 — Diseño

**Fecha:** 2026-05-18
**Estado:** Aprobado por el usuario (diseño)

## Objetivo

Evolucionar OpoDAM con: acceso sin registro (sesión anónima de Supabase), rediseño visual estilo academia profesional (opositas.com / adams.es), nueva oposición Policía Local, secciones promocionales ProCoach AI y NUTRIPLAN, y reproductor de música de concentración.

## Arquitectura general

React + TypeScript + Vite + TailwindCSS, SPA mobile-first. Se mantiene la estructura actual: `pages/`, `components/`, `services/`, `data/topics/`. El progreso sigue en Supabase (tabla `progreso`), ahora indexado por el `user_id` de una sesión anónima en lugar de una sesión con email.

---

## 1. Acceso sin registro (sesión anónima)

**Qué cambia:**
- Al abrir la app se crea automáticamente una sesión anónima de Supabase mediante `supabase.auth.signInAnonymously()`. El usuario no ve ninguna pantalla de login ni email.
- Si ya existe sesión (anónima o no), se reutiliza.
- La app abre directamente en `/mis-oposiciones`.

**Componentes afectados:**
- `services/supabase.ts`: nueva función `iniciarSesionAnonima()` que llama a `signInAnonymously()` solo si no hay sesión activa.
- `App.tsx`: en el arranque (efecto inicial) se invoca `iniciarSesionAnonima()` antes de `sincronizar()`. `RootOrCallback` redirige a `/mis-oposiciones`.
- `components/layout/RutaProtegida.tsx`: deja de bloquear; mientras la sesión anónima se crea muestra el loader, después renderiza siempre los hijos. No redirige a onboarding.
- Rutas de onboarding (`/onboarding/email`, `/onboarding/confirmar`, `/onboarding/oposicion`) y `AuthCallback`: se **mantienen los ficheros** pero se **desconectan** del `Routes` de `App.tsx` (comentados con nota `// AUTH DESACTIVADO — reactivar más adelante`). No se borra código.

**Progreso:** `cargarProgresoRemoto` / `guardarProgresoRemoto` siguen igual; funcionan porque la sesión anónima aporta `user.id`. El respaldo en localStorage se mantiene.

**Configuración externa (el usuario):** activar *Authentication → Sign In / Providers → Anonymous sign-ins* en el panel de Supabase del proyecto `itmqjdupaquiggmmnyvf`.

**Errores:** si `signInAnonymously()` falla (p. ej. anonymous deshabilitado), la app funciona en modo solo-localStorage sin romperse; se registra el error en consola.

---

## 2. Rediseño visual (estilo academia profesional)

**Dirección de diseño:** aspecto de academia de oposiciones seria y profesional, inspirado en opositas.com y adams.es. Paleta corporativa azul (`#1e3a8a` / `#2563eb`) con un acento cálido, fondo `slate-50`, tarjetas con sombra suave y bordes redondeados, tipografía con jerarquía clara (títulos sólidos, subtítulos en gris medio), badges de bloque, cabeceras con logo y marca.

**Componentes afectados:**
- `components/ui/Card.tsx`, `Badge.tsx`, `ProgressBar.tsx`: refinar estilos (sombras, radios, colores).
- `components/layout/`: `Layout.tsx`, `BottomNav.tsx`, `SideNav.tsx` — cabecera de marca consistente, navegación pulida.
- `pages/MisOposiciones.tsx`, `OposicionDashboard.tsx`, `Temario.tsx`, `Tests.tsx`, `Estadisticas.tsx`: aplicar el nuevo lenguaje visual (hero, rejillas de tarjetas, jerarquía).
- `tailwind.config.js`: extender la paleta con los tokens corporativos.

Se mantiene mobile-first y la estructura de navegación actual. No se cambia la lógica, solo la capa visual.

---

## 3. Oposición Policía Local

**Datos de origen:** `E:\opodam\PLocal` contiene 37 PDFs — 15 de bloque General (`PL-GENERAL-TEMA-01..15`) y 22 de bloque Específico (`PL-ESPECIFICA-TEMA-01..07, 09..23`; el específico tema 08 no existe).

**Modelo de temas:** se mapean a 37 temas con `id` 1..37: ids 1-15 = General, ids 16-37 = Específico. Cada PDF se convierte en un JSON con la estructura estándar de tema: `{id, titulo, bloque, secciones[], esquemas[], mapaMental{nodos,aristas}, flashcards[], preguntas[]}` (igual que CGPC).

**Estructura de ficheros:**
- Nueva carpeta `src/data/topics/policia-local/` con `index.ts` (define `TEMAS_META`, `TOTAL_TEMAS`, `cargarTema`) y `tema-01.json` … `tema-37.json`.
- `src/data/topics/index.ts` pasa de barrel fijo de CGPC a un **selector por oposición**: función `obtenerTopics(slug)` que devuelve `{ TEMAS_META, TOTAL_TEMAS, cargarTema }` del módulo correspondiente (`cgpc` o `policia-local`).
- Las páginas que hoy importan de `data/topics` (`Temario`, `TemaDetalle`, `Tests`, `Simulacro`, `FlashcardsGlobal`, `Estadisticas`, etc.) reciben el slug de la ruta y usan `obtenerTopics(slug)`.
- `data/oposiciones.ts`: la entrada `policia-local` se añade con `disponible: true` y `numTemas: 37`.

**Generación de contenido:** el texto de cada PDF se extrae y se genera el JSON estructurado tema a tema, por fases, igual que se hizo con los 45 temas de CGPC.

---

## 4. Sección ProCoach AI

Página informativa/promocional dentro de la app (`pages/ProCoachAI.tsx`, ruta `/procoach`), accesible desde la home.

**Contenido:**
- Título **ProCoach AI** y descripción: app móvil con 1 agente IA especializado de disciplina deportiva. Chat en tiempo real, gym mode, análisis de fotos, voz, planes personalizados. Backend Express + SQLite.
- Tabla del agente **DELTA**: `Oposiciones físicas` — `Especialista GC, Policía, FF.AA. España`.
- Capacidades del agente: memoria activa (últimos 20 mensajes), modo gym (≤150 tokens), detección de problemas, límites profesionales.
- Nota de posicionamiento: nicho oposiciones como entrada — sin competencia directa en España, demanda constante.

Diseño: tarjeta destacada coherente con el nuevo lenguaje visual.

---

## 5. Colofón NUTRIPLAN

Banner de cierre al pie de la home (`pages/MisOposiciones.tsx`) — componente `components/promo/BannerNutriplan.tsx`.

**Contenido:** anuncio de **NUTRIPLAN**, app de nutrición para mejorar físico, peso y salud, con la especialista en nutrición **Ester Correa**. Estilo banner llamativo pero sobrio, acorde a la paleta.

---

## 6. Música de concentración

Botón flotante persistente para activar/desactivar música ambiental en bucle.

**Componentes:**
- `components/audio/BotonMusica.tsx`: botón flotante (esquina inferior), montado en `Layout.tsx` para que persista en toda la app protegida.
- `hooks/useMusica.ts`: hook que gestiona un elemento `<audio loop>` (creado una sola vez), expone `activa` y `alternar()`, y persiste el estado on/off en localStorage (clave `opodam.musica`).
- Pista de audio: fichero lo-fi/ambiental libre de derechos en `public/audio/concentracion.mp3`.

**Comportamiento:** al pulsar, alterna reproducción; el estado se recuerda entre sesiones. Si el navegador bloquea el autoplay, la música solo suena tras la primera interacción del usuario (el propio botón).

---

## Orden de ejecución

1. Acceso sin registro (sesión anónima) — desbloquea el uso inmediato.
2. Rediseño visual.
3. Música de concentración + secciones ProCoach AI y NUTRIPLAN.
4. Temario Policía Local (37 JSON, por fases).

## Pruebas

- Acceso sin registro: la app abre en `/mis-oposiciones` sin pedir email; existe sesión anónima; el progreso persiste y sincroniza.
- Rediseño: revisión visual de cada pantalla afectada en móvil y escritorio.
- Policía Local: la oposición aparece disponible, el temario carga los 37 temas, tests y estadísticas funcionan con su slug.
- ProCoach AI / NUTRIPLAN: contenido correcto y accesible desde la home.
- Música: el botón alterna la reproducción y recuerda el estado entre recargas.

## Fuera de alcance

- Registro real con email (se reactivará más adelante; el código se conserva desconectado).
- Backend o integración real de ProCoach AI y NUTRIPLAN (solo secciones promocionales).
