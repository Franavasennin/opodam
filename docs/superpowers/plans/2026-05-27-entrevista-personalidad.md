# Simulador de Entrevista + Test de Personalidad — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Añadir un entrenador de entrevista por chat (Groq, feedback accionable + informe final, modos práctica/examen) y un test de personalidad determinista por rasgos, ambos accesibles desde el dashboard de cada oposición.

**Architecture:** La entrevista reutiliza el patrón `tutor-chat` (función Netlify CJS → Groq) con un system prompt de entrenador de tribunal; la página es un chat estilo `ProCoachChat`. El test de personalidad es 100% local: un banco JSON de ítems Likert + scoring determinista por rasgo.

**Tech Stack:** React 19 + TS + Vite + Tailwind, React Router, Netlify Functions (CJS), Groq (`llama-3.3-70b-versatile`), Vitest + Testing Library.

**Spec:** `docs/superpowers/specs/2026-05-27-entrevista-personalidad-design.md`

---

## File Structure

| Archivo | Responsabilidad |
|---|---|
| `netlify/functions/entrevista-chat.cjs` | Backend del entrenador (Groq); turnos + informe. |
| `src/services/entrevista.ts` | Cliente del endpoint. |
| `src/pages/Entrevista.tsx` | Chat del entrenador + modo + informe. |
| `src/data/personalidad/cuestionario.json` | Banco de ítems Likert por rasgo. |
| `src/data/personalidad/index.ts` | Carga + `puntuar()` + `interpretacion()`. |
| `src/pages/Personalidad.tsx` | Cuestionario + perfil. |
| `src/pages/OposicionDashboard.tsx` | 2 tarjetas nuevas. |
| `src/App.tsx` | 2 rutas nuevas. |

**Convenciones del repo:**
- Funciones Netlify `.cjs` con `exports.handler`, `corsHeaders(event)` honrando `ALLOWED_ORIGINS`, validación de `messages`, `AbortController` 25s, `GROQ_API_KEY` (ver `netlify/functions/tutor-chat.cjs`). Tests `.cjs` van en `netlify/functions-tests/` con `node --test`.
- Servicios cliente devuelven `{ content, error }` y POST a `/.netlify/functions/<fn>` (ver `services/tutor.ts`).
- Chat UI: patrón de `src/pages/ProCoachChat.tsx` (burbujas user/assistant, textarea Enter-envía, scroll a fin).
- Tests Vitest: `npm test -- --run <ruta>`. Setup `tests/setup.ts` ya stubea `scrollIntoView`. tsconfig ya incluye `@testing-library/jest-dom`.
- Tailwind `marca-*`/`slate-*`.

---

## Task 1: Función `entrevista-chat.cjs`

**Files:**
- Create: `netlify/functions/entrevista-chat.cjs`
- Test: `netlify/functions-tests/entrevista-chat.test.cjs`

- [ ] **Step 1: Write the failing test**

Create `netlify/functions-tests/entrevista-chat.test.cjs`:

```js
const { test } = require('node:test')
const assert = require('node:assert')
const { buildSystemPrompt, validarMensajes } = require('../functions/entrevista-chat.cjs')

test('buildSystemPrompt menciona el cuerpo y el modo practica', () => {
  const p = buildSystemPrompt({ cuerpo: 'cgpc', modo: 'practica' })
  assert.match(p, /cgpc/i)
  assert.match(p, /STAR/)
  assert.match(p, /entrenador/i)
})

test('buildSystemPrompt en modo examen pide feedback minimo', () => {
  const p = buildSystemPrompt({ cuerpo: 'policia-local', modo: 'examen' })
  assert.match(p, /examen/i)
})

test('validarMensajes acepta validos y rechaza invalidos', () => {
  assert.strictEqual(validarMensajes([{ role: 'user', content: 'hola' }]), null)
  assert.notStrictEqual(validarMensajes([]), null)
  assert.notStrictEqual(validarMensajes([{ role: 'x', content: 'y' }]), null)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test netlify/functions-tests/entrevista-chat.test.cjs`
Expected: FAIL — módulo no encontrado.

- [ ] **Step 3: Write the implementation**

Create `netlify/functions/entrevista-chat.cjs`:

```js
// netlify/functions/entrevista-chat.cjs
// Entrenador de entrevista personal de oposición (Groq). Turnos + informe final.

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const MODEL = 'llama-3.3-70b-versatile'
const MEMORIA_MENSAJES = 12
const MAX_MENSAJES = 60
const MAX_CONTENIDO_CHARS = 8000

const NOMBRES_CUERPO = {
  'cgpc': 'CGPC — Cuerpo General de la Policía Canaria',
  'policia-local': 'Policía Local',
}

function resolverOrigen(event) {
  const permitidas = (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean)
  if (permitidas.length === 0) return '*'
  const origin = (event && event.headers && (event.headers.origin || event.headers.Origin)) || ''
  return permitidas.includes(origin) ? origin : permitidas[0]
}
function corsHeaders(event) {
  return {
    'Access-Control-Allow-Origin': resolverOrigen(event),
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin',
    'Content-Type': 'application/json',
  }
}

function validarMensajes(messages) {
  if (!Array.isArray(messages) || messages.length === 0) return 'Falta el array de mensajes'
  if (messages.length > MAX_MENSAJES) return 'Demasiados mensajes'
  for (const m of messages) {
    if (!m || typeof m !== 'object') return 'Mensaje inválido'
    if (m.role !== 'user' && m.role !== 'assistant') return 'Rol de mensaje inválido'
    if (typeof m.content !== 'string') return 'Contenido de mensaje inválido'
    if (m.content.length > MAX_CONTENIDO_CHARS) return 'Mensaje demasiado largo'
  }
  return null
}

function buildSystemPrompt(opts) {
  const o = opts || {}
  const cuerpo = NOMBRES_CUERPO[o.cuerpo] || o.cuerpo || 'la oposición'
  const examen = o.modo === 'examen'
  return `Eres un miembro de un tribunal de oposición a ${cuerpo} y, a la vez, un ENTRENADOR que prepara al candidato para APROBAR la entrevista personal real. Conduces una entrevista por turnos. Responde en español.

${examen
  ? 'MODO EXAMEN: encadena preguntas con feedback mínimo para simular presión real. Reserva el análisis para el informe final.'
  : 'MODO PRÁCTICA: en cada turno (1) da feedback breve y constructivo de la última respuesta —un punto fuerte + 1 mejora concreta—, valorando estructura, contenido y lo que busca el tribunal; en preguntas situacionales evalúa y enseña el método STAR (Situación, Tarea, Acción, Resultado); si la respuesta es floja, incluye una versión modelo mejorada. (2) Formula la siguiente pregunta (una sola).'}

A lo largo de la sesión cubre: motivación, autoconocimiento, valores del servicio público e integridad, gestión de estrés y conflictos, trabajo en equipo, conocimiento del puesto. Repregunta para profundizar cuando proceda. Tono profesional y cercano. Nunca pongas nota numérica. ${examen ? '' : 'Recuerda siempre el método STAR cuando sea relevante.'}

Si el último mensaje del usuario es exactamente "[GENERAR_INFORME]", NO hagas más preguntas: redacta un INFORME DE ENTRENAMIENTO con tres secciones: "Fortalezas", "Áreas a mejorar (priorizadas)" y "Consejos para la entrevista real" (3-4 consejos concretos).`
}

exports.handler = async function (event) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: corsHeaders(event), body: '' }
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: corsHeaders(event), body: JSON.stringify({ error: 'Method Not Allowed' }) }
  if (!process.env.GROQ_API_KEY) return { statusCode: 500, headers: corsHeaders(event), body: JSON.stringify({ error: 'GROQ_API_KEY no configurada en el servidor' }) }
  if (typeof fetch !== 'function') return { statusCode: 500, headers: corsHeaders(event), body: JSON.stringify({ error: 'Runtime sin fetch global (Node < 18)' }) }

  let payload
  try { payload = JSON.parse(event.body || '{}') } catch { return { statusCode: 400, headers: corsHeaders(event), body: JSON.stringify({ error: 'JSON invalido' }) } }
  const { messages, cuerpo, modo } = payload
  const err = validarMensajes(messages)
  if (err) return { statusCode: 400, headers: corsHeaders(event), body: JSON.stringify({ error: err }) }

  const recientes = messages.slice(-MEMORIA_MENSAJES)
  const groqBody = {
    model: MODEL,
    messages: [{ role: 'system', content: buildSystemPrompt({ cuerpo, modo }) }, ...recientes],
    temperature: 0.6,
    max_tokens: 1024,
  }
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 25000)
  try {
    const r = await fetch(GROQ_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
      body: JSON.stringify(groqBody),
      signal: controller.signal,
    })
    if (!r.ok) {
      const text = await r.text()
      return { statusCode: r.status, headers: corsHeaders(event), body: JSON.stringify({ error: 'Groq error', detail: text }) }
    }
    const data = await r.json()
    const content = (data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || ''
    return { statusCode: 200, headers: corsHeaders(event), body: JSON.stringify({ content }) }
  } catch (e) {
    const msg = e && e.name === 'AbortError' ? 'Tiempo de espera agotado contactando con Groq' : String(e && e.message ? e.message : e)
    return { statusCode: 502, headers: corsHeaders(event), body: JSON.stringify({ error: 'Error contactando con Groq', detail: msg }) }
  } finally {
    clearTimeout(timeout)
  }
}

exports.buildSystemPrompt = buildSystemPrompt
exports.validarMensajes = validarMensajes
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test netlify/functions-tests/entrevista-chat.test.cjs`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add netlify/functions/entrevista-chat.cjs netlify/functions-tests/entrevista-chat.test.cjs
git commit -m "feat(entrevista): funcion Netlify entrevista-chat (entrenador, Groq)"
```

---

## Task 2: Servicio `entrevista.ts`

**Files:**
- Create: `src/services/entrevista.ts`
- Test: `src/services/entrevista.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/services/entrevista.test.ts`:

```ts
import { describe, it, expect, vi, afterEach } from 'vitest'
import { enviarTurnoEntrevista } from './entrevista'

afterEach(() => { vi.restoreAllMocks() })

describe('enviarTurnoEntrevista', () => {
  const base = { messages: [{ role: 'user' as const, content: 'hola' }], cuerpo: 'cgpc', modo: 'practica' as const }

  it('devuelve content en 200', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve({ content: 'siguiente pregunta' }) }))
    const r = await enviarTurnoEntrevista(base.messages, base.cuerpo, base.modo)
    expect(r).toEqual({ content: 'siguiente pregunta', error: null })
  })

  it('devuelve error cuando no es ok', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 502, json: () => Promise.resolve({ error: 'boom' }) }))
    const r = await enviarTurnoEntrevista(base.messages, base.cuerpo, base.modo)
    expect(r.content).toBeNull()
    expect(r.error).toBe('boom')
  })

  it('captura excepciones de red', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
    const r = await enviarTurnoEntrevista(base.messages, base.cuerpo, base.modo)
    expect(r.error).toBe('offline')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --run src/services/entrevista.test.ts`
Expected: FAIL — no se resuelve `./entrevista`.

- [ ] **Step 3: Write the implementation**

Create `src/services/entrevista.ts`:

```ts
// src/services/entrevista.ts
// Cliente del entrenador de entrevista. POST a /.netlify/functions/entrevista-chat.

export interface MensajeEntrevista {
  role: 'user' | 'assistant'
  content: string
}
export type ModoEntrevista = 'practica' | 'examen'

const ENDPOINT = '/.netlify/functions/entrevista-chat'

export async function enviarTurnoEntrevista(
  messages: MensajeEntrevista[],
  cuerpo: string,
  modo: ModoEntrevista,
): Promise<{ content: string | null; error: string | null }> {
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, cuerpo, modo }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) return { content: null, error: (data && data.error) || `HTTP ${res.status}` }
    return { content: (data && data.content) || '', error: null }
  } catch (err) {
    return { content: null, error: err instanceof Error ? err.message : 'Error desconocido' }
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- --run src/services/entrevista.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/services/entrevista.ts src/services/entrevista.test.ts
git commit -m "feat(entrevista): servicio cliente enviarTurnoEntrevista"
```

---

## Task 3: Página `Entrevista.tsx`

**Files:**
- Create: `src/pages/Entrevista.tsx`
- Test: `src/pages/Entrevista.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/pages/Entrevista.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'

vi.mock('../services/entrevista', () => ({
  enviarTurnoEntrevista: vi.fn().mockResolvedValue({ content: 'Bienvenido. Primera pregunta: ¿por qué esta oposición?', error: null }),
}))

import Entrevista from './Entrevista'
import { enviarTurnoEntrevista } from '../services/entrevista'

function renderEn(ruta = '/oposicion/cgpc/entrevista') {
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <Routes><Route path="/oposicion/:slug/entrevista" element={<Entrevista />} /></Routes>
    </MemoryRouter>
  )
}

beforeEach(() => { vi.clearAllMocks(); localStorage.clear() })

describe('Entrevista', () => {
  it('muestra el selector de modo al inicio', () => {
    renderEn()
    expect(screen.getByText(/práctica/i)).toBeInTheDocument()
    expect(screen.getByText(/examen real/i)).toBeInTheDocument()
  })

  it('al elegir modo arranca y pide el primer turno', async () => {
    renderEn()
    fireEvent.click(screen.getByRole('button', { name: /práctica/i }))
    await waitFor(() => expect(enviarTurnoEntrevista).toHaveBeenCalled())
    await waitFor(() => expect(screen.getByText(/primera pregunta/i)).toBeInTheDocument())
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --run src/pages/Entrevista.test.tsx`
Expected: FAIL — no se resuelve `./Entrevista`.

- [ ] **Step 3: Write the implementation**

Create `src/pages/Entrevista.tsx`:

```tsx
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { enviarTurnoEntrevista, type MensajeEntrevista, type ModoEntrevista } from '../services/entrevista'

export default function Entrevista() {
  const navigate = useNavigate()
  const { slug } = useParams<{ slug: string }>()
  const cuerpo = slug ?? 'cgpc'
  const [modo, setModo] = useState<ModoEntrevista | null>(null)
  const [mensajes, setMensajes] = useState<MensajeEntrevista[]>([])
  const [input, setInput] = useState('')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const finRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => { finRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [mensajes, cargando])

  async function pedirTurno(historial: MensajeEntrevista[], m: ModoEntrevista) {
    setCargando(true); setError(null)
    const { content, error: err } = await enviarTurnoEntrevista(historial, cuerpo, m)
    setCargando(false)
    if (err || !content) { setError('No se pudo contactar con el entrevistador, inténtalo de nuevo.'); return }
    setMensajes(prev => [...prev, { role: 'assistant', content }])
  }

  async function elegirModo(m: ModoEntrevista) {
    setModo(m)
    await pedirTurno([{ role: 'user', content: 'Empieza la entrevista, por favor.' }], m)
  }

  async function enviar() {
    const texto = input.trim()
    if (!texto || cargando || !modo) return
    const nuevos: MensajeEntrevista[] = [...mensajes, { role: 'user', content: texto }]
    setMensajes(nuevos); setInput('')
    await pedirTurno(nuevos, modo)
  }

  async function verInforme() {
    if (cargando || !modo) return
    const nuevos: MensajeEntrevista[] = [...mensajes, { role: 'user', content: '[GENERAR_INFORME]' }]
    setMensajes(nuevos)
    await pedirTurno(nuevos, modo)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar() }
  }

  if (!modo) {
    return (
      <div className="min-h-screen bg-slate-50">
        <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
          <button onClick={() => navigate(`/oposicion/${slug}`)} className="text-marca-600 text-sm font-medium">←</button>
          <h1 className="text-lg font-bold text-slate-900">Entrevista</h1>
        </header>
        <main className="p-4 max-w-2xl mx-auto space-y-3">
          <p className="text-sm text-slate-600">Elige un modo de entrenamiento:</p>
          <button onClick={() => elegirModo('practica')}
            className="w-full bg-white border border-slate-200 rounded-2xl shadow-sm px-4 py-4 text-left hover:shadow-md transition-shadow">
            <div className="text-sm font-bold text-slate-900">🎯 Práctica</div>
            <div className="text-xs text-slate-500 mt-0.5">Feedback didáctico tras cada respuesta (método STAR, versión modelo).</div>
          </button>
          <button onClick={() => elegirModo('examen')}
            className="w-full bg-white border border-slate-200 rounded-2xl shadow-sm px-4 py-4 text-left hover:shadow-md transition-shadow">
            <div className="text-sm font-bold text-slate-900">⏱️ Examen real</div>
            <div className="text-xs text-slate-500 mt-0.5">Preguntas encadenadas con presión; el análisis va al informe final.</div>
          </button>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(`/oposicion/${slug}`)} className="text-marca-600 text-sm font-medium">←</button>
        <span className="font-bold text-slate-900">Entrevista</span>
        <span className="text-xs text-slate-400">· {modo === 'examen' ? 'Examen real' : 'Práctica'}</span>
        <button onClick={() => { setModo(null); setMensajes([]); setError(null) }} className="ml-auto text-xs text-marca-600 font-medium">Reiniciar</button>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-4">
        <div className="max-w-2xl mx-auto space-y-3">
          {mensajes.map((m, i) => (
            <div key={i} className={m.role === 'user'
              ? 'ml-auto max-w-[85%] rounded-2xl bg-marca-600 text-white px-4 py-2.5 text-sm whitespace-pre-wrap'
              : 'mr-auto max-w-[85%] rounded-2xl bg-white border border-slate-200 px-4 py-2.5 text-sm text-slate-800 whitespace-pre-wrap'}>
              {m.content}
            </div>
          ))}
          {cargando && <div className="mr-auto rounded-2xl bg-white border border-slate-200 px-4 py-2.5 text-sm text-slate-400">El entrevistador está pensando…</div>}
          {error && <div className="rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">{error}</div>}
          <div ref={finRef} />
        </div>
      </main>

      <footer className="bg-white border-t border-slate-200 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="max-w-2xl mx-auto space-y-2">
          <div className="flex items-end gap-2">
            <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
              placeholder="Tu respuesta… (Enter para enviar)" rows={2}
              className="flex-1 resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-marca-600" />
            <button onClick={enviar} disabled={cargando || !input.trim()}
              className="bg-marca-600 hover:bg-marca-700 disabled:opacity-40 text-white text-sm font-semibold rounded-xl px-4 py-2 transition-colors">Enviar</button>
          </div>
          {mensajes.length > 1 && (
            <button onClick={verInforme} disabled={cargando}
              className="w-full border border-marca-200 text-marca-700 rounded-xl py-2 text-sm font-semibold disabled:opacity-40">
              Terminar y ver informe
            </button>
          )}
        </div>
      </footer>
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- --run src/pages/Entrevista.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/pages/Entrevista.tsx src/pages/Entrevista.test.tsx
git commit -m "feat(entrevista): pagina del entrenador de entrevista (modos + informe)"
```

---

## Task 4: Datos y scoring de personalidad

**Files:**
- Create: `src/data/personalidad/cuestionario.json`
- Create: `src/data/personalidad/index.ts`
- Test: `src/data/personalidad/index.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/data/personalidad/index.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { RASGOS, cargarCuestionario, puntuar, interpretacion } from './index'

describe('personalidad', () => {
  it('RASGOS y cuestionario no vacíos; ítems con rasgo válido', () => {
    expect(RASGOS.length).toBeGreaterThan(0)
    const items = cargarCuestionario()
    expect(items.length).toBeGreaterThan(0)
    const ids = RASGOS.map(r => r.id)
    for (const it of items) expect(ids).toContain(it.rasgo)
  })

  it('puntuar normaliza 0-100 y aplica inversión', () => {
    const items = cargarCuestionario()
    const rasgo = items[0].rasgo
    const delRasgo = items.filter(i => i.rasgo === rasgo)
    const respuestas: Record<string, number> = {}
    delRasgo.forEach(i => { respuestas[i.id] = i.invertido ? 1 : 5 }) // máximo a favor del rasgo
    const res = puntuar(respuestas)
    const r = res.find(x => x.rasgo === rasgo)!
    expect(r.puntuacion).toBe(100)
    expect(r.banda).toBe('alto')
  })

  it('interpretacion devuelve texto para cada banda', () => {
    expect(typeof interpretacion(RASGOS[0].id, 'alto')).toBe('string')
    expect(interpretacion(RASGOS[0].id, 'bajo').length).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --run src/data/personalidad/index.test.ts`
Expected: FAIL — no se resuelve `./index`.

- [ ] **Step 3: Create the seed questionnaire**

Create `src/data/personalidad/cuestionario.json` (30 ítems, 6 por rasgo):

```json
[
  { "id": "p-est-01", "texto": "Mantengo la calma en situaciones de presión.", "rasgo": "estabilidad", "invertido": false },
  { "id": "p-est-02", "texto": "Me alteran con facilidad los imprevistos.", "rasgo": "estabilidad", "invertido": true },
  { "id": "p-est-03", "texto": "Recupero el ánimo rápido tras un contratiempo.", "rasgo": "estabilidad", "invertido": false },
  { "id": "p-est-04", "texto": "Suelo preocuparme en exceso por las cosas.", "rasgo": "estabilidad", "invertido": true },
  { "id": "p-est-05", "texto": "Tomo decisiones con serenidad aunque haya tensión.", "rasgo": "estabilidad", "invertido": false },
  { "id": "p-est-06", "texto": "Me bloqueo cuando algo sale mal.", "rasgo": "estabilidad", "invertido": true },
  { "id": "p-res-01", "texto": "Cumplo siempre con lo que me comprometo.", "rasgo": "responsabilidad", "invertido": false },
  { "id": "p-res-02", "texto": "A veces dejo tareas a medias.", "rasgo": "responsabilidad", "invertido": true },
  { "id": "p-res-03", "texto": "Soy organizado y planifico mi trabajo.", "rasgo": "responsabilidad", "invertido": false },
  { "id": "p-res-04", "texto": "Me cuesta seguir las normas establecidas.", "rasgo": "responsabilidad", "invertido": true },
  { "id": "p-res-05", "texto": "Asumo mis errores y los corrijo.", "rasgo": "responsabilidad", "invertido": false },
  { "id": "p-res-06", "texto": "Suelo posponer mis obligaciones.", "rasgo": "responsabilidad", "invertido": true },
  { "id": "p-soc-01", "texto": "Me relaciono con facilidad con personas nuevas.", "rasgo": "sociabilidad", "invertido": false },
  { "id": "p-soc-02", "texto": "Prefiero evitar el trato con desconocidos.", "rasgo": "sociabilidad", "invertido": true },
  { "id": "p-soc-03", "texto": "Disfruto ayudando y atendiendo a la gente.", "rasgo": "sociabilidad", "invertido": false },
  { "id": "p-soc-04", "texto": "Me siento incómodo siendo el centro de atención.", "rasgo": "sociabilidad", "invertido": true },
  { "id": "p-soc-05", "texto": "Comunico mis ideas con claridad.", "rasgo": "sociabilidad", "invertido": false },
  { "id": "p-soc-06", "texto": "Me cuesta iniciar una conversación.", "rasgo": "sociabilidad", "invertido": true },
  { "id": "p-aut-01", "texto": "Controlo mis impulsos antes de actuar.", "rasgo": "autocontrol", "invertido": false },
  { "id": "p-aut-02", "texto": "Reacciono de forma airada cuando me provocan.", "rasgo": "autocontrol", "invertido": true },
  { "id": "p-aut-03", "texto": "Pienso las consecuencias antes de decidir.", "rasgo": "autocontrol", "invertido": false },
  { "id": "p-aut-04", "texto": "Pierdo la paciencia con facilidad.", "rasgo": "autocontrol", "invertido": true },
  { "id": "p-aut-05", "texto": "Mantengo el autocontrol ante una agresión verbal.", "rasgo": "autocontrol", "invertido": false },
  { "id": "p-aut-06", "texto": "Me dejo llevar por el enfado.", "rasgo": "autocontrol", "invertido": true },
  { "id": "p-equ-01", "texto": "Colaboro bien dentro de un equipo.", "rasgo": "trabajo_equipo", "invertido": false },
  { "id": "p-equ-02", "texto": "Prefiero trabajar siempre por mi cuenta.", "rasgo": "trabajo_equipo", "invertido": true },
  { "id": "p-equ-03", "texto": "Apoyo a mis compañeros cuando lo necesitan.", "rasgo": "trabajo_equipo", "invertido": false },
  { "id": "p-equ-04", "texto": "Me cuesta aceptar opiniones distintas a la mía.", "rasgo": "trabajo_equipo", "invertido": true },
  { "id": "p-equ-05", "texto": "Acepto las instrucciones de un mando con naturalidad.", "rasgo": "trabajo_equipo", "invertido": false },
  { "id": "p-equ-06", "texto": "Tiendo a imponer mi criterio sobre el del grupo.", "rasgo": "trabajo_equipo", "invertido": true }
]
```

- [ ] **Step 4: Write the implementation**

Create `src/data/personalidad/index.ts`:

```ts
import cuestionario from './cuestionario.json'

export interface ItemPersonalidad { id: string; texto: string; rasgo: string; invertido: boolean }
export interface ResultadoRasgo { rasgo: string; titulo: string; puntuacion: number; banda: 'bajo' | 'medio' | 'alto' }

export const RASGOS = [
  { id: 'estabilidad', titulo: 'Estabilidad emocional', descripcion: 'Calma y equilibrio ante la presión.' },
  { id: 'responsabilidad', titulo: 'Responsabilidad', descripcion: 'Compromiso, orden y cumplimiento.' },
  { id: 'sociabilidad', titulo: 'Sociabilidad', descripcion: 'Trato y comunicación con las personas.' },
  { id: 'autocontrol', titulo: 'Autocontrol', descripcion: 'Gestión de impulsos y reacciones.' },
  { id: 'trabajo_equipo', titulo: 'Trabajo en equipo', descripcion: 'Cooperación y aceptación de jerarquía.' },
] as const

export function cargarCuestionario(): ItemPersonalidad[] {
  return cuestionario as ItemPersonalidad[]
}

function banda(p: number): 'bajo' | 'medio' | 'alto' {
  if (p < 40) return 'bajo'
  if (p <= 70) return 'medio'
  return 'alto'
}

// Likert 1-5. Ítem invertido puntúa 6 - valor. Normaliza la media (1-5) a 0-100.
export function puntuar(respuestas: Record<string, number>): ResultadoRasgo[] {
  const items = cargarCuestionario()
  return RASGOS.map(r => {
    const delRasgo = items.filter(i => i.rasgo === r.id)
    const valores = delRasgo
      .map(i => ({ v: respuestas[i.id], inv: i.invertido }))
      .filter(x => typeof x.v === 'number')
      .map(x => (x.inv ? 6 - x.v : x.v))
    const media = valores.length ? valores.reduce((a, b) => a + b, 0) / valores.length : 0
    const puntuacion = valores.length ? Math.round(((media - 1) / 4) * 100) : 0
    return { rasgo: r.id, titulo: r.titulo, puntuacion, banda: banda(puntuacion) }
  })
}

const TEXTOS: Record<string, Record<'bajo' | 'medio' | 'alto', string>> = {
  estabilidad: {
    alto: 'Gestionas muy bien la presión; transmites serenidad, una cualidad clave en el servicio.',
    medio: 'Sueles mantener el equilibrio, aunque ciertas situaciones tensas pueden afectarte. Trabaja técnicas de gestión del estrés.',
    bajo: 'La presión te afecta con facilidad. Practica respiración y exposición gradual a situaciones tensas.',
  },
  responsabilidad: {
    alto: 'Muy comprometido y organizado; cumples y asumes tus obligaciones.',
    medio: 'Responsable en general; refuerza la planificación y la constancia.',
    bajo: 'Conviene reforzar el orden, la puntualidad y el cumplimiento de compromisos.',
  },
  sociabilidad: {
    alto: 'Te relacionas y comunicas con soltura; ideal para la atención al ciudadano.',
    medio: 'Trato correcto; gana confianza iniciando más interacciones.',
    bajo: 'El trato social te cuesta; practica la comunicación y la escucha activa.',
  },
  autocontrol: {
    alto: 'Excelente control de impulsos; reaccionas con cabeza ante provocaciones.',
    medio: 'Autocontrol aceptable; trabaja la pausa antes de reaccionar.',
    bajo: 'Tiendes a reaccionar en caliente. Entrena la gestión del enfado y la pausa.',
  },
  trabajo_equipo: {
    alto: 'Gran cooperador; aceptas jerarquía y apoyas al grupo.',
    medio: 'Trabajas en equipo bien; abre más espacio a otras opiniones.',
    bajo: 'Mejora la cooperación y la aceptación de criterios ajenos y del mando.',
  },
}

export function interpretacion(rasgo: string, b: 'bajo' | 'medio' | 'alto'): string {
  return (TEXTOS[rasgo] && TEXTOS[rasgo][b]) || ''
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- --run src/data/personalidad/index.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 6: Commit**

```bash
git add src/data/personalidad/
git commit -m "feat(personalidad): cuestionario + scoring determinista por rasgos"
```

---

## Task 5: Página `Personalidad.tsx`

**Files:**
- Create: `src/pages/Personalidad.tsx`
- Test: `src/pages/Personalidad.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/pages/Personalidad.test.tsx`:

```tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import Personalidad from './Personalidad'
import { cargarCuestionario } from '../data/personalidad/index'

function renderEn() {
  return render(
    <MemoryRouter initialEntries={['/oposicion/cgpc/personalidad']}>
      <Routes><Route path="/oposicion/:slug/personalidad" element={<Personalidad />} /></Routes>
    </MemoryRouter>
  )
}

beforeEach(() => { localStorage.clear() })

describe('Personalidad', () => {
  it('renderiza todos los ítems del cuestionario', () => {
    renderEn()
    const items = cargarCuestionario()
    expect(screen.getByText(items[0].texto)).toBeInTheDocument()
    expect(screen.getByText(items[items.length - 1].texto)).toBeInTheDocument()
  })

  it('al completar todos los ítems y ver resultado muestra el perfil', () => {
    renderEn()
    const items = cargarCuestionario()
    items.forEach(it => {
      fireEvent.click(screen.getByLabelText(`${it.id}-3`))
    })
    fireEvent.click(screen.getByRole('button', { name: /ver resultado/i }))
    expect(screen.getByText(/tu perfil/i)).toBeInTheDocument()
    expect(screen.getByText(/orientativo/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --run src/pages/Personalidad.test.tsx`
Expected: FAIL — no se resuelve `./Personalidad`.

- [ ] **Step 3: Write the implementation**

Create `src/pages/Personalidad.tsx`:

```tsx
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { cargarCuestionario, puntuar, interpretacion, type ResultadoRasgo } from '../data/personalidad/index'

const ESCALA = [1, 2, 3, 4, 5]

export default function Personalidad() {
  const navigate = useNavigate()
  const { slug } = useParams<{ slug: string }>()
  const items = cargarCuestionario()
  const [respuestas, setRespuestas] = useState<Record<string, number>>({})
  const [resultado, setResultado] = useState<ResultadoRasgo[] | null>(null)

  const completos = Object.keys(respuestas).length
  const total = items.length

  function elegir(id: string, valor: number) {
    setRespuestas(prev => ({ ...prev, [id]: valor }))
  }

  if (resultado) {
    return (
      <div className="min-h-screen bg-slate-50">
        <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
          <button onClick={() => navigate(`/oposicion/${slug}`)} className="text-marca-600 text-sm font-medium">←</button>
          <h1 className="text-lg font-bold text-slate-900">Tu perfil</h1>
        </header>
        <main className="p-4 max-w-2xl mx-auto space-y-3">
          <p className="text-xs text-slate-500 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">⚠️ Resultado orientativo, no es un diagnóstico psicológico.</p>
          {resultado.map(r => (
            <div key={r.rasgo} className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-900">{r.titulo}</span>
                <span className="text-xs text-slate-500">{r.puntuacion}/100</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full mt-2 overflow-hidden">
                <div className="h-full bg-marca-600" style={{ width: `${r.puntuacion}%` }} />
              </div>
              <p className="text-xs text-slate-600 mt-2">{interpretacion(r.rasgo, r.banda)}</p>
            </div>
          ))}
          <button onClick={() => { setRespuestas({}); setResultado(null) }}
            className="w-full bg-marca-600 hover:bg-marca-700 text-white rounded-2xl py-3 text-sm font-semibold">Repetir test</button>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => navigate(`/oposicion/${slug}`)} className="text-marca-600 text-sm font-medium">←</button>
        <h1 className="text-lg font-bold text-slate-900">Test de personalidad</h1>
        <span className="ml-auto text-xs text-slate-400">{completos}/{total}</span>
      </header>
      <main className="p-4 max-w-2xl mx-auto space-y-3">
        {items.map(it => (
          <div key={it.id} className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4">
            <p className="text-sm text-slate-800 mb-3">{it.texto}</p>
            <div className="flex justify-between gap-1">
              {ESCALA.map(v => (
                <label key={v} className="flex flex-col items-center text-[10px] text-slate-400 cursor-pointer">
                  <input type="radio" aria-label={`${it.id}-${v}`} name={it.id}
                    checked={respuestas[it.id] === v} onChange={() => elegir(it.id, v)} />
                  <span>{v}</span>
                </label>
              ))}
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 mt-1"><span>En desacuerdo</span><span>De acuerdo</span></div>
          </div>
        ))}
        <button onClick={() => setResultado(puntuar(respuestas))} disabled={completos < total}
          className="w-full bg-marca-600 hover:bg-marca-700 disabled:opacity-40 text-white rounded-2xl py-3 text-sm font-semibold">
          Ver resultado
        </button>
      </main>
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- --run src/pages/Personalidad.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/pages/Personalidad.tsx src/pages/Personalidad.test.tsx
git commit -m "feat(personalidad): pagina de cuestionario y perfil"
```

---

## Task 6: Rutas + tarjetas dashboard

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/pages/OposicionDashboard.tsx`

- [ ] **Step 1: Add lazy imports in `src/App.tsx`**

Tras `const SupuestoDetalle = lazy(() => import('./pages/SupuestoDetalle'))` añade:

```tsx
const Entrevista = lazy(() => import('./pages/Entrevista'))
const Personalidad = lazy(() => import('./pages/Personalidad'))
```

- [ ] **Step 2: Add routes in `src/App.tsx`**

Tras la ruta `<Route path="/oposicion/:slug/supuestos/:id" .../>` añade:

```tsx
        <Route path="/oposicion/:slug/entrevista" element={<RutaProtegida><Entrevista /></RutaProtegida>} />
        <Route path="/oposicion/:slug/personalidad" element={<RutaProtegida><Personalidad /></RutaProtegida>} />
```

- [ ] **Step 3: Add cards in `OposicionDashboard.tsx`**

Añade estas dos entradas al array `MENU`, justo antes de la entrada de "Estadísticas":

```tsx
  { icon: '🎤', label: 'Entrevista', sub: 'Entrena la entrevista personal', path: 'entrevista' },
  { icon: '🧩', label: 'Test de personalidad', sub: 'Conoce tu perfil', path: 'personalidad' },
```

- [ ] **Step 4: Verify build and tests**

Run: `npm run build`
Expected: build verde.

Run: `npm test -- --run src/services/entrevista.test.ts src/pages/Entrevista.test.tsx src/data/personalidad/index.test.ts src/pages/Personalidad.test.tsx`
Expected: todos verdes.

Run: `node --test netlify/functions-tests/entrevista-chat.test.cjs`
Expected: 3 PASS.

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx src/pages/OposicionDashboard.tsx
git commit -m "feat(entrevista/personalidad): rutas y tarjetas en el dashboard"
```

---

## Task 7: Verificación manual end-to-end

**Files:** ninguno.

- [ ] **Step 1: Arrancar Netlify Dev**

Run: `netlify dev` → abrir `http://localhost:8888`.

- [ ] **Step 2: Probar el flujo**
- Dashboard de una oposición → ver tarjetas "🎤 Entrevista" y "🧩 Test de personalidad".
- Entrevista → "Práctica" → primera pregunta → responder → feedback (STAR) + nueva pregunta → "Terminar y ver informe" → informe con fortalezas/mejoras/consejos. Probar también "Examen real".
- Personalidad → responder todos los ítems → "Ver resultado" → perfil por rasgos con interpretación y aviso orientativo. "Repetir test".

- [ ] **Step 3: Commit final (si hubo ajustes)**

```bash
git add -A && git commit -m "chore(entrevista/personalidad): ajustes tras verificacion manual"
```

---

## Notas de cierre
- La función reutiliza `GROQ_API_KEY` y `ALLOWED_ORIGINS` ya configuradas en Netlify.
- Despliegue: push a `main` (recordar el posible bloqueo "Unrecognized Git contributor" → deploy manual si aplica).
- Tests `.cjs` van en `netlify/functions-tests/` para que Netlify no los trate como funciones.
