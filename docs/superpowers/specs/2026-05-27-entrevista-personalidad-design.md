# Simulador de Entrevista + Test de Personalidad — Diseño

**Fecha:** 2026-05-27
**Proyecto:** OpoDAM
**Objetivo:** Preparar al opositor para la **fase de entrevista personal** de CGPC y Policía Local con (1) un **entrenador de entrevista** por chat que da feedback accionable y un informe final, y (2) un **test de personalidad** orientativo. La entrevista usa Groq (patrón tutor/DELTA); la personalidad es 100% local y determinista.

---

## Principio rector

No es un Q&A genérico: es un **entrenador que ayuda a aprobar la entrevista real**. Cada interacción debe enseñar técnica, dar feedback accionable y, sesión a sesión, hacer progresar al alumno.

---

## Resumen de decisiones

1. **Entrevista por turnos**, solo texto. El entrevistador IA elige las preguntas en tiempo real (Groq), da feedback por respuesta y formula la siguiente pregunta.
2. **Feedback accionable**: evalúa estructura, contenido y *qué busca el tribunal*; enseña y exige el **método STAR** en situacionales; ofrece **versión modelo mejorada** cuando la respuesta es floja.
3. **Cobertura garantizada** de áreas clave: motivación, autoconocimiento, valores del servicio público/integridad, gestión de estrés y conflictos, trabajo en equipo, conocimiento del puesto.
4. **Informe final de entrenamiento** ("Terminar y ver informe"): fortalezas, áreas a mejorar priorizadas y 3-4 consejos concretos.
5. **Dos modos**: *Práctica* (feedback extenso y didáctico por respuesta) y *Examen real* (preguntas encadenadas con feedback mínimo; el análisis va al informe final, simulando presión).
6. **Test de personalidad**: cuestionario fijo con escala Likert agrupado por rasgos → puntuación determinista por rasgo + texto orientativo. Sin Groq.
7. Reutiliza la infraestructura Groq/Netlify endurecida (validación de entrada, CORS por `ALLOWED_ORIGINS`, timeout, `GROQ_API_KEY`).

---

## Arquitectura

### Componentes nuevos
- `netlify/functions/entrevista-chat.cjs` — backend del entrenador (Groq). Recibe historial + cuerpo + modo; devuelve el siguiente turno o el informe final.
- `src/services/entrevista.ts` — cliente del endpoint (patrón `services/tutor.ts`).
- `src/pages/Entrevista.tsx` — chat del entrenador por turnos + selector de modo + informe final.
- `src/data/personalidad/cuestionario.json` — ítems con escala etiquetados por rasgo.
- `src/data/personalidad/index.ts` — carga ítems, `puntuar()`, bandas e `interpretacion()`.
- `src/pages/Personalidad.tsx` — cuestionario + pantalla de perfil.
- `src/pages/OposicionDashboard.tsx` — 2 tarjetas nuevas.
- `src/App.tsx` — 2 rutas nuevas.

Sin infraestructura nueva: entrevista usa Groq (ya configurado); personalidad es local.

---

## Simulador de entrevista

### Backend `entrevista-chat.cjs`
Entrada (POST):
```js
{
  messages: [{ role: 'user' | 'assistant', content: string }],  // últimos ~12 turnos
  cuerpo: 'cgpc' | 'policia-local',
  modo: 'practica' | 'examen',
  accion?: 'informe'   // si presente, devuelve el informe final en vez de la siguiente pregunta
}
```
Salida: `{ content: string }` (texto del entrevistador o el informe).

System prompt (esquema):
> Eres un miembro de un tribunal de oposición a {cuerpo} y, a la vez, un **entrenador** que prepara al candidato para aprobar la entrevista personal real. Conduces una entrevista por turnos.
>
> En **modo práctica**, en cada turno: (1) da feedback breve y constructivo de la última respuesta —punto fuerte + 1 mejora concreta—, valorando estructura, contenido y lo que busca el tribunal; en preguntas situacionales evalúa y enseña el método STAR (Situación, Tarea, Acción, Resultado); si la respuesta es floja, incluye una versión modelo mejorada. (2) Formula la siguiente pregunta (una sola).
>
> En **modo examen**, encadena preguntas con feedback mínimo para simular presión; reserva el análisis para el informe final.
>
> Cubre a lo largo de la sesión: motivación, autoconocimiento, valores del servicio público e integridad, gestión de estrés y conflictos, trabajo en equipo, conocimiento del puesto. Repregunta para profundizar cuando proceda. Tono profesional y cercano. Nunca pongas nota numérica. Responde en español.
>
> Si recibes la acción "informe": redacta un INFORME DE ENTRENAMIENTO con: fortalezas, áreas a mejorar priorizadas y 3-4 consejos concretos para la entrevista real.

Parámetros: `llama-3.3-70b-versatile`, `temperature: 0.6`, memoria últimos ~12 turnos. Robustez: validación de `messages`, CORS por `ALLOWED_ORIGINS`, `AbortController` 25s, guard de `fetch`, 500 si falta `GROQ_API_KEY`.

### Frontend `Entrevista.tsx`
- Selector de **modo** (Práctica / Examen real) al inicio.
- Chat (estética `ProCoachChat`/`TutorPanel`): cabecera con volver, mensajes (entrevistador vs alumno), input abajo (Enter envía).
- Primer turno: se pide al backend la apertura (mensaje de bienvenida + primera pregunta).
- Estado "El entrevistador está pensando…" y manejo de error.
- Botón **"Terminar y ver informe"** → llama con `accion: 'informe'` y muestra el debrief.
- Botón "Reiniciar entrevista".
- Persistencia opcional en `localStorage` por oposición (retomar sesión).

---

## Test de personalidad

### Datos `src/data/personalidad/cuestionario.json`
Array de ítems:
```json
[
  { "id": "p-est-01", "texto": "Mantengo la calma en situaciones de presión.", "rasgo": "estabilidad", "invertido": false },
  { "id": "p-est-02", "texto": "Me alteran con facilidad los imprevistos.", "rasgo": "estabilidad", "invertido": true }
]
```
~30 ítems (≈6 por rasgo). Escala Likert 1-5 (Muy en desacuerdo → Muy de acuerdo).

Rasgos: `estabilidad`, `responsabilidad`, `sociabilidad`, `autocontrol`, `trabajo_equipo`.

### `src/data/personalidad/index.ts`
```ts
export interface ItemPersonalidad { id: string; texto: string; rasgo: string; invertido: boolean }
export interface ResultadoRasgo { rasgo: string; titulo: string; puntuacion: number; banda: 'bajo' | 'medio' | 'alto' }

export const RASGOS: { id: string; titulo: string; descripcion: string }[]
export function cargarCuestionario(): ItemPersonalidad[]
export function puntuar(respuestas: Record<string, number>): ResultadoRasgo[]   // puntuacion 0-100 normalizada, con inversión
export function interpretacion(rasgo: string, banda: 'bajo' | 'medio' | 'alto'): string
```
Puntuación: por rasgo, media de los ítems (invirtiendo `invertido` como `6 - valor`), normalizada a 0-100. Bandas: <40 bajo, 40-70 medio, >70 alto. `interpretacion` devuelve texto orientativo por (rasgo, banda).

### `src/pages/Personalidad.tsx`
- Ítems con escala 1-5 (radios/botones) + barra de progreso.
- Botón "Ver resultado" deshabilitado hasta completar todos los ítems.
- Pantalla de perfil: por rasgo, barra con la puntuación + texto orientativo.
- Aviso visible: "Resultado orientativo, no es un diagnóstico psicológico."
- Botón "Repetir test".

---

## Navegación
- Rutas (protegidas): `/oposicion/:slug/entrevista` → `Entrevista`; `/oposicion/:slug/personalidad` → `Personalidad`.
- `OposicionDashboard`: tarjetas "🎤 Entrevista" (sub: "Entrena la entrevista personal") y "🧩 Test de personalidad" (sub: "Conoce tu perfil").

---

## Manejo de errores
- Entrevista: Groq falla/timeout → "No se pudo contactar con el entrevistador, inténtalo de nuevo"; la conversación se mantiene. Falta key → 500 claro.
- Personalidad: 100% local; el botón de resultado se habilita solo al completar el cuestionario.

---

## Testing
- `entrevista-chat.cjs`: `buildSystemPrompt`/validación + handler → 400 sin `messages`, 500 sin key, 200 con mensajes válidos (mock o smoke). Test en `netlify/functions-tests/`.
- `services/entrevista.ts`: `fetch` mockeado (ok/error).
- `data/personalidad/index.ts`: `puntuar()` — normalización 0-100, inversión de ítems `invertido`, asignación de banda. (Test puro, alto valor.)
- `Personalidad.tsx`: render del cuestionario, completar → ver perfil.
- `Entrevista.tsx`: render + envío con servicio mockeado.
- Final: `npm run build` verde + prueba manual con `netlify dev`.

---

## Fuera de alcance (futuro)
- Respuestas por voz (Web Speech API).
- Interpretación de personalidad redactada por IA.
- Fase 2 del tutor (RAG global con embeddings).
- Persistencia del historial/informe en Supabase (se puede añadir luego).
