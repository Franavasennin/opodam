# Tutor IA (Fase 1) — Diseño

**Fecha:** 2026-05-23
**Proyecto:** OpoDAM
**Objetivo:** Un tutor/agente IA al que el alumno pregunta dudas desde dentro de un tema, respondiendo anclado al contenido de ese tema (teoría + flashcards + tests).

---

## Resumen de decisiones

1. **Acceso:** botón flotante dentro de `TemaDetalle` → abre un panel de chat deslizante.
2. **Fuera de temario:** prioriza el contenido del tema; si la duda no está cubierta, puede usar conocimiento general **avisando claramente** de que no forma parte del temario oficial.
3. **Historial:** persistido en Supabase (tabla `tutor_conversaciones` + RLS), por (alumno, oposición, tema). Tolerante a fallos: si Supabase no responde, el chat sigue en memoria.
4. **Contexto del tutor:** teoría (secciones) + flashcards + preguntas tipo test del tema actual.
5. **Origen del contexto:** lo envía el frontend (Opción A) — `TemaDetalle` ya tiene el tema cargado.
6. **Componente:** `TutorPanel` propio, independiente de `ProCoachChat`.
7. **Modelo:** Groq `llama-3.3-70b-versatile`, definido en una constante para poder cambiar de proveedor (p. ej. OpenRouter/DeepSeek) editando 2 líneas.

---

## Arquitectura

### Componentes nuevos
- `netlify/functions/tutor-chat.cjs` — backend; proxea a Groq con un system prompt de tutor. Reutiliza la `GROQ_API_KEY` existente (no requiere variable nueva).
- `src/services/tutor.ts` — cliente frontend del endpoint (patrón de `services/delta.ts`).
- `src/components/tutor/TutorPanel.tsx` — panel de chat deslizante.
- `src/components/tutor/BotonTutor.tsx` — botón flotante dentro del tema.
- `src/services/tutorHistorial.ts` — lectura/escritura del historial en Supabase.
- `supabase/migrations/2026-05-23-tutor-conversaciones.sql` — migración (la ejecuta el usuario en Supabase).

### Flujo de datos
1. El alumno está en un tema y pulsa el botón flotante 💬 → se abre `TutorPanel`.
2. Al abrir, carga el historial de ese tema desde Supabase (si existe).
3. Escribe la duda y envía.
4. `TutorPanel` llama a `tutor-chat` con `{ messages (recientes), contexto: { oposicion, temaId, titulo, secciones, flashcards, preguntas } }`.
5. La función monta system prompt + contexto + mensajes → Groq → respuesta.
6. La respuesta se muestra y la conversación se guarda en Supabase (`user_id + oposicion + tema_id`).

---

## Backend: `tutor-chat.cjs`

### Entrada (POST body)
```js
{
  messages: [{ role: 'user' | 'assistant', content: string }],  // últimos ~10 turnos
  contexto: {
    oposicion: 'cgpc',
    temaId: 1,
    titulo: 'La Constitución Española de 1978...',
    secciones: [{ titulo: string, contenido: string }],
    flashcards: [{ anverso?: string, reverso?: string, pregunta?: string, respuesta?: string }],
    preguntas: [{ enunciado: string, opciones: string[], correcta?: number, respuestaCorrecta?: number }]
  }
}
```
Nota: flashcards y preguntas pueden venir en cualquiera de los dos formatos del proyecto (cgpc / policia-local). El builder del prompt normaliza igual que el frontend (anverso/pregunta, reverso/respuesta, correcta/respuestaCorrecta).

### System prompt (esquema)
> Eres TUTOR, un profesor experto que resuelve dudas sobre el tema **"{titulo}"** de la oposición.
> Responde **basándote en el CONTENIDO DEL TEMA** de abajo. Cita la sección cuando la respuesta esté en el temario.
> Si la duda **no está cubierta** por ese contenido, puedes responder con conocimiento general **avisando claramente**: "⚠️ Esto no aparece en el temario oficial de este tema:".
> Sé claro, didáctico y conciso. Responde en español.
>
> `## CONTENIDO DEL TEMA`
> {secciones (teoría)}
> {flashcards}
> {preguntas}

### Salida
```js
{ content: string }   // o { error: string } con statusCode adecuado
```

### Parámetros del modelo
- `MODEL = 'llama-3.3-70b-versatile'` (constante al inicio del archivo)
- `GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'`
- `temperature: 0.4` (más factual que DELTA)
- `max_tokens: 1024`
- Memoria: últimos 10 turnos de `messages`.

### Robustez (heredada de delta-chat)
- CORS (OPTIONS 204; POST; 405 en otros métodos).
- Validación: 400 si falta `messages`; 500 si falta `GROQ_API_KEY`.
- Guard de `fetch` global (500 si Node < 18).
- `AbortController` con timeout de 25 s → 502 con detalle (distingue timeout de fallo de red).

---

## Frontend

### `BotonTutor.tsx`
- Burbuja fija abajo-derecha (💬 "Tutor"), visible en cualquier pestaña del tema.
- Posición ajustada para no solaparse con `BotonMusica` (global): el botón del tutor se coloca por encima de él (offset vertical) o abajo-izquierda.
- Al pulsar, abre `TutorPanel`.

### `TutorPanel.tsx`
- Panel deslizante desde la derecha con overlay; se cierra con ✕ o tocando el overlay.
- Cabecera: "Tutor · {título corto}" + cerrar.
- Lista de mensajes (burbujas usuario/tutor, estética de ProCoachChat).
- Input abajo: Enter envía, Shift+Enter salto de línea.
- Estado "Tutor está escribiendo…" y bloque de error.
- Al abrir: carga historial del tema desde Supabase.
- Bienvenida si no hay historial: "Hola, soy tu tutor de este tema. Pregúntame cualquier duda sobre {título}."
- Props: `{ oposicion: string, tema: Tema, abierto: boolean, onCerrar: () => void }`.

### `services/tutor.ts`
- `preguntarTutor(messages, contexto): Promise<{ content: string | null; error: string | null }>`
- POST a `/.netlify/functions/tutor-chat` (mismo patrón que `delta.ts`).

### Integración en `TemaDetalle`
- Monta `<BotonTutor onClick={abrir}/>` y `<TutorPanel oposicion={slug} tema={tema} abierto={abierto} onCerrar={cerrar}/>`.
- Construye el `contexto` desde el `tema` ya cargado (`titulo`, `secciones`, `flashcards`, `preguntas`).
- El botón solo se muestra si el tema tiene contenido.

---

## Persistencia en Supabase

### Tabla `tutor_conversaciones`
```sql
create table public.tutor_conversaciones (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  oposicion   text not null,            -- slug: 'cgpc' | 'policia-local'
  tema_id     int  not null,
  mensajes    jsonb not null default '[]'::jsonb,  -- [{role, content}]
  updated_at  timestamptz not null default now(),
  unique (user_id, oposicion, tema_id)
);

alter table public.tutor_conversaciones enable row level security;

create policy "propias_select" on public.tutor_conversaciones
  for select using (auth.uid() = user_id);
create policy "propias_insert" on public.tutor_conversaciones
  for insert with check (auth.uid() = user_id);
create policy "propias_update" on public.tutor_conversaciones
  for update using (auth.uid() = user_id);
```
- Una fila por (alumno, oposición, tema); mensajes como array JSON.
- RLS activado: cada alumno solo accede a sus propias conversaciones (vía `auth.uid()` de la sesión anónima existente).
- La migración la ejecuta el usuario en el SQL Editor de Supabase.

### `services/tutorHistorial.ts`
- `cargarHistorial(oposicion, temaId): Promise<MensajeChat[]>` → mensajes de la fila o `[]`.
- `guardarHistorial(oposicion, temaId, mensajes): Promise<void>` → `upsert` por la clave única.
- Tolerante a fallos: ante error de Supabase, `cargarHistorial` devuelve `[]` y `guardarHistorial` no lanza; el chat sigue en memoria.

---

## Manejo de errores

- Falta `GROQ_API_KEY` → 500 mensaje claro.
- Groq caído / timeout 25 s → 502; el panel muestra "No se pudo contactar con el tutor, inténtalo de nuevo".
- Supabase no responde → se ignora; el chat funciona en memoria.
- Tema sin contenido → el botón del tutor no se muestra.
- Payload muy grande → si hiciera falta, recortar el contenido enviado a un tope de caracteres (no esperado en Fase 1; cabe en 128k).

---

## Testing

- `tutor-chat.cjs`: invocar el handler directo → 200 con contexto válido, 400 sin `messages`, 500 sin key.
- `services/tutor.ts`: `fetch` mockeado (caso ok y caso error).
- `services/tutorHistorial.ts`: Supabase mockeado, incluyendo "Supabase falla → devuelve []".
- `TutorPanel`: render (bienvenida, envío, estado cargando) con el servicio mockeado.
- Verificación final: `npm run build` verde + prueba real en un tema con `netlify dev`.

---

## Fuera de alcance (Fase 2+)

- RAG real con embeddings (`pgvector`) para preguntar sobre toda la oposición, no solo el tema abierto.
- Tutor global (ruta `/tutor`).
- Generación de tests a partir de la duda.
- Analítica de dudas frecuentes.
- Cambio de proveedor a OpenRouter/DeepSeek (preparado vía constante de modelo/endpoint).
