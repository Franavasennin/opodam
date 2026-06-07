# Tutor IA (Fase 3) — Diseño

**Fecha:** 2026-05-31
**Proyecto:** OpoDAM
**Base previa:** [`2026-05-23-tutor-fase1-design.md`](./2026-05-23-tutor-fase1-design.md) (tutor por tema) + Fase 2 ya implementada (tutor global con BM25, `services/retrieval.ts`, `pages/TutorGlobal.tsx`, índice `public/search/<slug>.json`).
**Objetivo:** Mejorar el tutor global con (1) recuperación híbrida BM25 + semántica, (2) memoria persistente de la conversación global, y (3) acciones rápidas a partir de la duda (mini-test, flashcards, resumen). Todo gratis, sin infra nueva salvo una tabla en Supabase.

---

## Principios

- **No empeorar nunca lo actual.** BM25 sigue siendo el suelo garantizado (cero descarga, cero almacenamiento). Lo semántico es una mejora progresiva que, si el dispositivo no puede con el modelo, **falla en silencio** y se queda con BM25. Sin toggles, sin nags, sin pantallas de instalación.
- **Gratis y sin servicios nuevos** para la recuperación: embeddings precalculados en build + modelo en navegador (transformers.js). Única infra nueva: una tabla Supabase para la memoria global.
- **Tolerante a fallos:** memoria y acciones degradan con elegancia; el chat nunca se rompe.

---

## Bloque 1 — Recuperación híbrida (BM25 + semántica)

### Build: `scripts/gen-search-index.mjs`
- Tras trocear los temas (ya lo hace), por cada fragmento calcula su embedding con `@xenova/transformers`, modelo `Xenova/multilingual-e5-small` (384 dims), ejecutado en Node.
- **Cuantización int8** para no inflar el JSON: cada vector pasa de 384 floats a 384 bytes. Se guarda `scale` (min/max global o por-vector) para descuantizar. Estimación: ~600 fragmentos ≈ +230 KB por oposición (aceptable, cacheable).
- Formato nuevo del índice: `{ chunks: [{t,ti,c}], vectors: int8[][], scale: {min,max} }`. El campo `chunks` se mantiene igual (retrocompatible con BM25).
- Prefijo del modelo e5: a los embeddings de pasajes se les antepone `"passage: "` y a la query `"query: "` (requisito de e5). El build usa `"passage: "`.

### Runtime: `src/services/retrieval.ts`
- `cargarModelo()` perezoso: importa `@xenova/transformers` dinámicamente y descarga el modelo **solo la primera vez que se llama a buscar** (no al arrancar la app). transformers.js cachea el modelo en IndexedDB del navegador.
- `buscar(slug, consulta, k)` pasa a híbrido:
  1. **BM25** como ahora → lista con score léxico.
  2. **Semántico:** si el modelo está disponible, embed de `"query: " + consulta` → similitud coseno contra los vectores descuantizados → score semántico. Si el modelo NO está listo/falla → se omite este paso.
  3. **Fusión:** normalizar cada lista de scores a [0,1] (min-max) y combinar `PESO_LEXICO·léxico + PESO_SEMANTICO·semántico` con `PESO_LEXICO = PESO_SEMANTICO = 0.5` (constantes exportadas, fáciles de tunear). Fragmentos que solo aparecen en una lista cuentan con 0 en la otra.
  4. Ordenar por score fusionado, devolver top-k.
- **Fallback total a BM25** si el modelo no carga (sin espacio, descarga fallida, navegador incompatible). La función nunca lanza por culpa del modelo.
- La carga del modelo es **no bloqueante**: si la primera búsqueda llega antes de que el modelo esté listo, responde solo con BM25; turnos siguientes ya usan híbrido.

### UX
- En `TutorGlobal`, la primera vez que se dispara una búsqueda mientras el modelo carga en segundo plano, no se bloquea nada (BM25 responde). Opcional: un texto sutil "Afinando resultados…" si el modelo está cargando; no imprescindible.

---

## Bloque 2 — Memoria del tutor global

### Tabla nueva (migración que ejecuta el usuario en Supabase)
`supabase/migrations/2026-05-31-tutor-global.sql`:
```sql
create table public.tutor_global_conversaciones (
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  oposicion  text not null,
  mensajes   jsonb not null default '[]'::jsonb,  -- [{role:'user'|'assistant', content:string}]
  updated_at timestamptz not null default now(),
  primary key (user_id, oposicion)
);

alter table public.tutor_global_conversaciones enable row level security;

create policy "tg_select" on public.tutor_global_conversaciones
  for select using (auth.uid() = user_id);
create policy "tg_insert" on public.tutor_global_conversaciones
  for insert with check (auth.uid() = user_id);
create policy "tg_update" on public.tutor_global_conversaciones
  for update using (auth.uid() = user_id);
```
- Una fila por (alumno, oposición). `primary key (user_id, oposicion)` para el upsert.
- No se guardan las `fuentes` (chips Tema N) ni los resultados de acciones; solo los turnos de texto.

### `src/services/tutorHistorial.ts` (se amplía)
- `cargarHistorialGlobal(oposicion: string): Promise<MensajeChat[]>` → mensajes de la fila o `[]`.
- `guardarHistorialGlobal(oposicion: string, mensajes: MensajeChat[]): Promise<void>` → `upsert` por `(user_id, oposicion)`.
- Tolerante a fallos: ante error de Supabase, cargar devuelve `[]` y guardar no lanza.

### `src/pages/TutorGlobal.tsx`
- Al montar (con `slug`): `cargarHistorialGlobal(slug)` y rellena `mensajes` (sin `fuentes`, que solo viven en memoria de la sesión).
- Tras cada turno completo (respuesta del tutor recibida): `guardarHistorialGlobal(slug, mensajesDeTexto)` en segundo plano (no bloquea la UI).

---

## Bloque 3 — Acciones desde la duda

En `TutorGlobal`, bajo cada mensaje **del tutor** (no del usuario) aparecen 3 botones. Se deshabilitan mientras la acción genera. Cada acción es independiente.

### 3a · "Ponérmelo a prueba" (mini-test) y "Crear flashcards"
- Amplío `netlify/functions/practica-generate.cjs` con dos `tipo` nuevos:
  - `tipo: 'tutor-test'` → body `{ tipo, duda, contexto }` → devuelve `{ preguntas: [{enunciado, opciones[3], correcta, explicacion}] }` (3-5 ítems).
  - `tipo: 'tutor-flashcards'` → body `{ tipo, duda, contexto }` → devuelve `{ flashcards: [{pregunta, respuesta}] }` (3-5 ítems).
  - `duda` = último mensaje del usuario; `contexto` = texto de los fragmentos recuperados para esa duda (lo que ya se calcula en `enviar()`).
  - Reutiliza la validación anti-duplicados y el manejo de errores/CORS que la función ya tiene.
- Cliente `src/services/practica.ts` gana:
  - `generarTestDuda(duda, contexto): Promise<{ preguntas: PreguntaTest[]; error }>`
  - `generarFlashcardsDuda(duda, contexto): Promise<{ flashcards: {pregunta,respuesta}[]; error }>`
- **Mini-test:** se abre en el `MotorTest` existente con esas preguntas efímeras (no se guardan en el progreso del temario). Patrón: estado local en `TutorGlobal` que muestra un overlay/panel con `<MotorTest preguntas=...>`.
- **Flashcards:** se muestran en un panel simple de repaso (voltear), efímeras, sin tocar el SM-2 del temario.

### 3b · "Resúmemelo"
- Reutiliza `tutor-chat` (sin endpoint nuevo): se envía la conversación + una instrucción "Resume tu última respuesta en 3-4 puntos clave en formato lista". La respuesta se añade como un mensaje normal del tutor.

### Errores
- Si una acción falla (`practica-generate` o `tutor-chat`): aviso breve inline "No se pudo generar, inténtalo de nuevo". El chat sigue intacto.

---

## Componentes / archivos afectados

| Acción | Archivo |
|---|---|
| Modificar | `scripts/gen-search-index.mjs` — añadir embeddings cuantizados al índice |
| Modificar | `src/services/retrieval.ts` — híbrido BM25+semántico + carga perezosa del modelo + fallback |
| Modificar | `src/services/tutorHistorial.ts` — `cargarHistorialGlobal` / `guardarHistorialGlobal` |
| Modificar | `src/pages/TutorGlobal.tsx` — memoria + botones de acción + paneles de test/flashcards |
| Modificar | `netlify/functions/practica-generate.cjs` — modos `tutor-test` y `tutor-flashcards` |
| Modificar | `src/services/practica.ts` — `generarTestDuda` / `generarFlashcardsDuda` |
| Crear | `supabase/migrations/2026-05-31-tutor-global.sql` (la ejecuta el usuario) |
| Dependencia | `@xenova/transformers` (devDependency para el build; import dinámico en runtime) |

---

## Testing

- `retrieval.ts`: test de la **fusión** con scores mockeados (sin modelo real) → orden correcto; test de fallback (modelo no disponible → solo BM25, no lanza). El embedding real no se testea en unidad (se valida a mano).
- `tutorHistorial.ts`: Supabase mockeado — cargar/guardar global, y "Supabase falla → []/no lanza".
- `practica-generate.cjs`: handler directo → 200 con `tutor-test` y `tutor-flashcards` válidos, 400 sin `duda`, 500 sin `GROQ_API_KEY`.
- `practica.ts`: `fetch` mockeado (ok y error) para las dos funciones nuevas.
- Verificación final: `npm run build` verde (incluye generación del índice con embeddings) + prueba real en `TutorGlobal` con `netlify dev`.

---

## Manejo de errores (resumen)

- Modelo de embeddings no carga → fallback silencioso a BM25.
- Índice sin `vectors` (build antiguo) → se usa solo BM25 (retrocompatible).
- Supabase no responde → memoria global en RAM; chat sigue.
- `practica-generate` / `tutor-chat` fallan en una acción → aviso inline, chat intacto.
- Primera carga del modelo en móvil sin espacio → descarga falla → BM25; el usuario no pierde nada.

---

## Fuera de alcance (Fase 4+)

- pgvector / RAG server-side (se descartó por añadir infra; el híbrido en cliente cubre el objetivo gratis).
- Guardar test/flashcards generados por el tutor en el progreso permanente (ahora son efímeros).
- Analítica de dudas frecuentes.
- Streaming de respuestas.
- Cambio de proveedor del LLM (sigue preparado vía constante de modelo).
