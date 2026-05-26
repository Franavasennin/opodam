# Psicotécnicos y Supuestos Prácticos — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Añadir dos modos de práctica tipo examen — psicotécnicos (compartidos) y supuestos prácticos (por oposición, anclados al temario) — con banco fijo en JSON y opción de "generar más" efímera vía Groq.

**Architecture:** Un componente `MotorTest` reutilizable corrige y puntúa cualquier lista de preguntas. Dos páginas (`Psicotecnicos`, `Supuestos`+detalle) cargan su banco desde JSON y montan el motor. Una función Netlify (`practica-generate`) genera ítems nuevos bajo demanda con Groq. Scripts pregeneran el banco.

**Tech Stack:** React 19 + TypeScript + Vite + Tailwind, React Router, Netlify Functions (CJS), Groq (`llama-3.1-8b-instant`), Vitest + Testing Library.

**Spec:** `docs/superpowers/specs/2026-05-26-psicotecnicos-supuestos-design.md`

---

## File Structure

| Archivo | Responsabilidad |
|---|---|
| `src/components/test/MotorTest.tsx` | Motor de test reutilizable (responder, corregir, puntuar, revisar). |
| `src/data/psicotecnicos/index.ts` | Catálogo de categorías + `cargarCategoria`. |
| `src/data/psicotecnicos/<categoria>.json` | Banco de preguntas por categoría (semilla inicial). |
| `src/data/supuestos/<slug>/index.ts` | `SUPUESTOS_META` + `cargarSupuesto`. |
| `src/data/supuestos/<slug>/supuesto-NN.json` | Caso + preguntas (semilla inicial). |
| `src/services/practica.ts` | Cliente de `practica-generate`. |
| `src/pages/Psicotecnicos.tsx` | Selección de categoría + test. |
| `src/pages/Supuestos.tsx` | Lista de supuestos. |
| `src/pages/SupuestoDetalle.tsx` | Caso + test del supuesto. |
| `netlify/functions/practica-generate.cjs` | Generación efímera (Groq). |
| `scripts/generate-psicotecnicos.cjs` | Generación del banco de psicotécnicos. |
| `scripts/generate-supuestos.cjs` | Generación del banco de supuestos. |
| `src/pages/OposicionDashboard.tsx` | Añadir 2 tarjetas. |
| `src/App.tsx` | Añadir 3 rutas. |

**Convenciones del repo:**
- Servicios cliente devuelven `{ ..., error }` y POST a `/.netlify/functions/<fn>` (ver `services/tutor.ts`).
- Funciones Netlify `.cjs` con `exports.handler`, `corsHeaders(event)` con `ALLOWED_ORIGINS`, validación de entrada, `AbortController` 25s, `GROQ_API_KEY` (ver `netlify/functions/tutor-chat.cjs`).
- Tipo `PreguntaTest`: `{ id, enunciado, opciones: string[], respuestaCorrecta: number, explicacion: string }`.
- Puntuación: `calcularPuntuacionTest(aciertos, errores, total)` de `src/services/progress.ts`.
- Tests: `npm test -- --run <ruta>`; `node --test` para funciones `.cjs` (ubicadas en `netlify/functions-tests/`).
- Tailwind: colores `marca-*`, `slate-*`. JSON con BOM → al leer en scripts usar `.replace(/^﻿/, '')`.

---

## Task 1: Componente `MotorTest`

**Files:**
- Create: `src/components/test/MotorTest.tsx`
- Test: `src/components/test/MotorTest.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/components/test/MotorTest.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MotorTest } from './MotorTest'

const preguntas = [
  { id: 'q1', enunciado: '¿2+2?', opciones: ['3', '4', '5'], respuestaCorrecta: 1, explicacion: 'Dos más dos son cuatro.' },
  { id: 'q2', enunciado: '¿Capital de España?', opciones: ['Madrid', 'París'], respuestaCorrecta: 0, explicacion: 'Madrid.' },
]

describe('MotorTest', () => {
  it('muestra la primera pregunta y su título', () => {
    render(<MotorTest preguntas={preguntas} titulo="Prueba" />)
    expect(screen.getByText('Prueba')).toBeInTheDocument()
    expect(screen.getByText('¿2+2?')).toBeInTheDocument()
  })

  it('corrige y puntúa, llamando onTerminar con aciertos', () => {
    const onTerminar = vi.fn()
    render(<MotorTest preguntas={preguntas} titulo="Prueba" onTerminar={onTerminar} />)
    fireEvent.click(screen.getByText('4'))            // q1 correcta
    fireEvent.click(screen.getByRole('button', { name: /siguiente/i }))
    fireEvent.click(screen.getByText('Madrid'))       // q2 correcta
    fireEvent.click(screen.getByRole('button', { name: /finalizar/i }))
    expect(onTerminar).toHaveBeenCalledWith({ aciertos: 2, errores: 0, total: 2 })
    expect(screen.getByText(/2 aciertos/i)).toBeInTheDocument()
  })

  it('en revisión muestra la explicación', () => {
    render(<MotorTest preguntas={preguntas} titulo="Prueba" />)
    fireEvent.click(screen.getByText('3'))            // q1 incorrecta
    fireEvent.click(screen.getByRole('button', { name: /siguiente/i }))
    fireEvent.click(screen.getByText('París'))        // q2 incorrecta
    fireEvent.click(screen.getByRole('button', { name: /finalizar/i }))
    expect(screen.getByText('Dos más dos son cuatro.')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --run src/components/test/MotorTest.test.tsx`
Expected: FAIL — no se resuelve `./MotorTest`.

- [ ] **Step 3: Write the implementation**

Create `src/components/test/MotorTest.tsx`:

```tsx
import { useState } from 'react'
import { calcularPuntuacionTest } from '../../services/progress'

export interface PreguntaTest {
  id: string
  enunciado: string
  opciones: string[]
  respuestaCorrecta: number
  explicacion: string
}

interface Props {
  preguntas: PreguntaTest[]
  titulo: string
  onTerminar?: (resultado: { aciertos: number; errores: number; total: number }) => void
}

export function MotorTest({ preguntas, titulo, onTerminar }: Props) {
  const [indice, setIndice] = useState(0)
  const [respuestas, setRespuestas] = useState<(number | null)[]>(() => preguntas.map(() => null))
  const [terminado, setTerminado] = useState(false)

  if (!preguntas.length) {
    return <p className="text-slate-400 text-sm text-center py-8">Aún no hay preguntas aquí.</p>
  }

  const aciertos = respuestas.filter((r, i) => r === preguntas[i].respuestaCorrecta).length
  const errores = respuestas.filter((r, i) => r !== null && r !== preguntas[i].respuestaCorrecta).length

  function elegir(j: number) {
    setRespuestas(prev => prev.map((r, i) => (i === indice ? j : r)))
  }

  function finalizar() {
    setTerminado(true)
    onTerminar?.({ aciertos, errores, total: preguntas.length })
  }

  if (terminado) {
    const nota = calcularPuntuacionTest(aciertos, errores, preguntas.length)
    return (
      <div className="space-y-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center shadow-sm">
          <p className="text-5xl font-bold text-marca-600">{nota.toFixed(2)}</p>
          <p className="text-slate-500 text-sm mt-1">sobre 10</p>
          <p className="text-sm text-slate-700 mt-3">✅ {aciertos} aciertos · ❌ {errores} errores</p>
        </div>
        {preguntas.map((p, i) => (
          <div key={p.id} className={`bg-white border border-slate-200 rounded-2xl shadow-sm p-4 border-l-4 ${respuestas[i] === p.respuestaCorrecta ? 'border-l-emerald-500' : 'border-l-red-500'}`}>
            <p className="text-sm font-semibold text-slate-900">{p.enunciado}</p>
            <p className="text-xs text-slate-500 mt-1">Correcta: {p.opciones[p.respuestaCorrecta]}</p>
            <p className="text-xs text-slate-400 mt-1 italic">{p.explicacion}</p>
          </div>
        ))}
      </div>
    )
  }

  const p = preguntas[indice]
  const sel = respuestas[indice]
  const esUltima = indice + 1 >= preguntas.length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-slate-900">{titulo}</h2>
        <span className="text-xs text-slate-400">{indice + 1}/{preguntas.length}</span>
      </div>
      <p className="text-sm font-medium leading-relaxed">{p.enunciado}</p>
      {p.opciones.map((op, j) => (
        <label key={j} className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-colors ${sel === j ? 'border-marca-500 bg-marca-50' : 'border-slate-200 hover:bg-slate-50'}`}>
          <input type="radio" checked={sel === j} onChange={() => elegir(j)} />
          <span className="text-sm">{op}</span>
        </label>
      ))}
      <div className="flex justify-between pt-2">
        <button onClick={() => setIndice(i => Math.max(0, i - 1))} disabled={indice === 0}
          className="text-sm text-slate-500 disabled:opacity-30">← Anterior</button>
        {esUltima
          ? <button onClick={finalizar} className="bg-marca-600 hover:bg-marca-700 text-white text-sm font-semibold rounded-xl px-4 py-2">Finalizar</button>
          : <button onClick={() => setIndice(i => Math.min(preguntas.length - 1, i + 1))}
              className="bg-marca-600 hover:bg-marca-700 text-white text-sm font-semibold rounded-xl px-4 py-2">Siguiente →</button>}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- --run src/components/test/MotorTest.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/test/MotorTest.tsx src/components/test/MotorTest.test.tsx
git commit -m "feat(practica): motor de test reutilizable MotorTest"
```

---

## Task 2: Loader y banco semilla de psicotécnicos

**Files:**
- Create: `src/data/psicotecnicos/index.ts`
- Create: `src/data/psicotecnicos/series-numericas.json` (semilla; el resto de categorías se llenan en Task 7)
- Test: `src/data/psicotecnicos/index.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/data/psicotecnicos/index.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { CATEGORIAS, cargarCategoria } from './index'

describe('psicotecnicos index', () => {
  it('expone 5 categorías con id y titulo', () => {
    expect(CATEGORIAS).toHaveLength(5)
    expect(CATEGORIAS[0]).toHaveProperty('id')
    expect(CATEGORIAS[0]).toHaveProperty('titulo')
  })

  it('cargarCategoria devuelve un array de preguntas', async () => {
    const preguntas = await cargarCategoria('series-numericas')
    expect(Array.isArray(preguntas)).toBe(true)
    expect(preguntas[0]).toHaveProperty('enunciado')
    expect(preguntas[0]).toHaveProperty('respuestaCorrecta')
  })

  it('categoría inexistente devuelve []', async () => {
    expect(await cargarCategoria('no-existe')).toEqual([])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --run src/data/psicotecnicos/index.test.ts`
Expected: FAIL — no se resuelve `./index`.

- [ ] **Step 3: Create the seed bank**

Create `src/data/psicotecnicos/series-numericas.json`:

```json
[
  { "id": "psico-series-001", "categoria": "series-numericas", "enunciado": "¿Qué número continúa la serie: 2, 4, 8, 16, ...?", "opciones": ["24", "32", "30", "20"], "respuestaCorrecta": 1, "explicacion": "Cada término se multiplica por 2: 16×2=32." },
  { "id": "psico-series-002", "categoria": "series-numericas", "enunciado": "Serie: 3, 6, 9, 12, ... ¿Cuál sigue?", "opciones": ["14", "15", "16", "18"], "respuestaCorrecta": 1, "explicacion": "Progresión aritmética de razón 3: 12+3=15." },
  { "id": "psico-series-003", "categoria": "series-numericas", "enunciado": "Serie: 1, 1, 2, 3, 5, 8, ... ¿Cuál sigue?", "opciones": ["11", "12", "13", "10"], "respuestaCorrecta": 2, "explicacion": "Fibonacci: cada término es la suma de los dos anteriores: 5+8=13." }
]
```

- [ ] **Step 4: Write the implementation**

Create `src/data/psicotecnicos/index.ts`:

```ts
import type { PreguntaTest } from '../../components/test/MotorTest'

export const CATEGORIAS = [
  { id: 'series-numericas', titulo: 'Series numéricas' },
  { id: 'razonamiento-verbal', titulo: 'Razonamiento verbal' },
  { id: 'razonamiento-logico', titulo: 'Razonamiento lógico' },
  { id: 'ortografia-calculo', titulo: 'Ortografía y cálculo' },
  { id: 'razonamiento-mecanico', titulo: 'Razonamiento mecánico' },
] as const

export type CategoriaId = typeof CATEGORIAS[number]['id']

export async function cargarCategoria(id: string): Promise<PreguntaTest[]> {
  try {
    const modulo = await import(`./${id}.json`)
    return (modulo.default as PreguntaTest[]) ?? []
  } catch {
    return []
  }
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- --run src/data/psicotecnicos/index.test.ts`
Expected: PASS (3 tests). (La categoría inexistente cae al `catch` → `[]`.)

- [ ] **Step 6: Commit**

```bash
git add src/data/psicotecnicos/
git commit -m "feat(practica): loader y banco semilla de psicotecnicos"
```

---

## Task 3: Loaders y banco semilla de supuestos (cgpc + policia-local)

**Files:**
- Create: `src/data/supuestos/cgpc/index.ts`
- Create: `src/data/supuestos/cgpc/supuesto-01.json` (semilla)
- Create: `src/data/supuestos/policia-local/index.ts`
- Create: `src/data/supuestos/policia-local/supuesto-01.json` (semilla)
- Test: `src/data/supuestos/cgpc/index.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/data/supuestos/cgpc/index.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { SUPUESTOS_META, cargarSupuesto } from './index'

describe('supuestos cgpc index', () => {
  it('SUPUESTOS_META tiene al menos un supuesto con id y titulo', () => {
    expect(SUPUESTOS_META.length).toBeGreaterThan(0)
    expect(SUPUESTOS_META[0]).toHaveProperty('id')
    expect(SUPUESTOS_META[0]).toHaveProperty('titulo')
  })

  it('cargarSupuesto devuelve caso y preguntas', async () => {
    const s = await cargarSupuesto(SUPUESTOS_META[0].id)
    expect(s).not.toBeNull()
    expect(typeof s!.caso).toBe('string')
    expect(Array.isArray(s!.preguntas)).toBe(true)
  })

  it('id inexistente devuelve null', async () => {
    expect(await cargarSupuesto('no-existe')).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --run src/data/supuestos/cgpc/index.test.ts`
Expected: FAIL — no se resuelve `./index`.

- [ ] **Step 3: Create seed supuestos**

Create `src/data/supuestos/cgpc/supuesto-01.json`:

```json
{
  "id": "sup-cgpc-01",
  "titulo": "Identificación en la vía pública",
  "caso": "Durante un servicio de patrulla, observa a una persona con actitud nerviosa que, al ver la presencia policial, cambia bruscamente de dirección. Decide identificarla conforme a la normativa de seguridad ciudadana.",
  "preguntas": [
    { "id": "sup-cgpc-01-p01", "enunciado": "¿Qué ley regula con carácter general la identificación de personas?", "opciones": ["LO 4/2015 de Protección de la Seguridad Ciudadana", "LO 2/1986 de FCS", "Ley 39/2015", "Código Penal"], "respuestaCorrecta": 0, "explicacion": "La identificación se regula en la LO 4/2015, de protección de la seguridad ciudadana." },
    { "id": "sup-cgpc-01-p02", "enunciado": "Si la persona se niega a identificarse, la conducción a dependencias procede para...", "opciones": ["Sancionar de inmediato", "Practicar la identificación cuando no sea posible por otros medios", "Detener por desobediencia siempre", "Registrar el domicilio"], "respuestaCorrecta": 1, "explicacion": "Solo procede el traslado para identificar cuando no es posible por otros medios y resulte necesario." }
  ]
}
```

Create `src/data/supuestos/policia-local/supuesto-01.json`:

```json
{
  "id": "sup-pl-01",
  "titulo": "Estacionamiento indebido y vía pública",
  "caso": "Recibe un aviso por un vehículo estacionado en un vado señalizado que obstaculiza la salida de un garaje. Acude al lugar para resolver la incidencia conforme a la normativa de tráfico municipal.",
  "preguntas": [
    { "id": "sup-pl-01-p01", "enunciado": "El estacionamiento en un vado señalizado es una infracción...", "opciones": ["Leve", "Grave", "Muy grave", "No es infracción"], "respuestaCorrecta": 1, "explicacion": "Estacionar en un vado señalizado correctamente se tipifica como infracción grave." },
    { "id": "sup-pl-01-p02", "enunciado": "¿Qué medida cautelar puede adoptarse con el vehículo?", "opciones": ["Inmovilización o retirada con grúa", "Precinto definitivo", "Subasta inmediata", "Ninguna"], "respuestaCorrecta": 0, "explicacion": "Puede ordenarse la retirada del vehículo por la grúa al obstaculizar el tráfico/accesos." }
  ]
}
```

- [ ] **Step 4: Write the loaders**

Create `src/data/supuestos/cgpc/index.ts`:

```ts
export interface PreguntaSupuesto {
  id: string
  enunciado: string
  opciones: string[]
  respuestaCorrecta: number
  explicacion: string
}
export interface Supuesto {
  id: string
  titulo: string
  caso: string
  preguntas: PreguntaSupuesto[]
}

export const SUPUESTOS_META = [
  { id: 'sup-cgpc-01', titulo: 'Identificación en la vía pública' },
] as const

export async function cargarSupuesto(id: string): Promise<Supuesto | null> {
  const meta = SUPUESTOS_META.find(s => s.id === id)
  if (!meta) return null
  try {
    const fichero = id.replace('sup-cgpc-', 'supuesto-')
    const modulo = await import(`./${fichero}.json`)
    return modulo.default as Supuesto
  } catch {
    return null
  }
}
```

Create `src/data/supuestos/policia-local/index.ts`:

```ts
export interface PreguntaSupuesto {
  id: string
  enunciado: string
  opciones: string[]
  respuestaCorrecta: number
  explicacion: string
}
export interface Supuesto {
  id: string
  titulo: string
  caso: string
  preguntas: PreguntaSupuesto[]
}

export const SUPUESTOS_META = [
  { id: 'sup-pl-01', titulo: 'Estacionamiento indebido y vía pública' },
] as const

export async function cargarSupuesto(id: string): Promise<Supuesto | null> {
  const meta = SUPUESTOS_META.find(s => s.id === id)
  if (!meta) return null
  try {
    const fichero = id.replace('sup-pl-', 'supuesto-')
    const modulo = await import(`./${fichero}.json`)
    return modulo.default as Supuesto
  } catch {
    return null
  }
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- --run src/data/supuestos/cgpc/index.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 6: Commit**

```bash
git add src/data/supuestos/
git commit -m "feat(practica): loaders y banco semilla de supuestos (cgpc, policia-local)"
```

---

## Task 4: Función Netlify `practica-generate.cjs`

**Files:**
- Create: `netlify/functions/practica-generate.cjs`
- Test: `netlify/functions-tests/practica-generate.test.cjs`

> Coloca el test en `netlify/functions-tests/` (NO en `netlify/functions/`) para que Netlify no lo trate como función (lección de `tutor-chat`).

- [ ] **Step 1: Write the failing test**

Create `netlify/functions-tests/practica-generate.test.cjs`:

```js
const { test } = require('node:test')
const assert = require('node:assert')
const { buildPrompt, validarItems } = require('../functions/practica-generate.cjs')

test('buildPrompt psicotecnico menciona la categoría', () => {
  const p = buildPrompt({ tipo: 'psicotecnico', categoria: 'series-numericas' })
  assert.match(p, /series/i)
  assert.match(p, /JSON/i)
})

test('buildPrompt supuesto incluye el contexto del temario', () => {
  const p = buildPrompt({ tipo: 'supuesto', slug: 'cgpc', contexto: 'texto del temario X' })
  assert.match(p, /texto del temario X/)
  assert.match(p, /caso/i)
})

test('validarItems acepta preguntas válidas y rechaza inválidas', () => {
  const ok = [{ enunciado: 'e', opciones: ['a', 'b'], respuestaCorrecta: 1, explicacion: 'x' }]
  assert.strictEqual(validarItems(ok), true)
  assert.strictEqual(validarItems([{ enunciado: 'e', opciones: ['a'], respuestaCorrecta: 5 }]), false)
  assert.strictEqual(validarItems('no-array'), false)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test netlify/functions-tests/practica-generate.test.cjs`
Expected: FAIL — módulo no encontrado.

- [ ] **Step 3: Write the implementation**

Create `netlify/functions/practica-generate.cjs`:

```js
// netlify/functions/practica-generate.cjs
// Genera ítems de práctica (psicotécnicos o supuestos) bajo demanda con Groq.
// Efímero: no persiste. Reutiliza GROQ_API_KEY.

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const MODEL = 'llama-3.1-8b-instant'

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

const TITULOS_CATEGORIA = {
  'series-numericas': 'series numéricas',
  'razonamiento-verbal': 'razonamiento verbal (sinónimos, antónimos, analogías)',
  'razonamiento-logico': 'razonamiento lógico y abstracto (silogismos, deducción)',
  'ortografia-calculo': 'ortografía y cálculo matemático',
  'razonamiento-mecanico': 'razonamiento mecánico descrito en texto (sin imágenes)',
}

function buildPrompt(payload) {
  const p = payload || {}
  if (p.tipo === 'supuesto') {
    return `Genera un supuesto práctico de oposición para el cuerpo "${p.slug || 'policía'}", basándote EN EL TEMARIO de abajo.
Devuelve SOLO JSON: { "titulo": "...", "caso": "...", "preguntas": [{ "enunciado": "...", "opciones": ["a","b","c","d"], "respuestaCorrecta": 0, "explicacion": "..." }] }.
El "caso" es un escenario realista. Genera 10 preguntas tipo test (4 opciones, respuestaCorrecta índice 0-3). Solo información del temario. Español.
TEMARIO:
${(p.contexto || '').slice(0, 6000)}`
  }
  const cat = TITULOS_CATEGORIA[p.categoria] || 'aptitud general'
  return `Genera preguntas psicotécnicas de ${cat} para una oposición.
Devuelve SOLO JSON: { "preguntas": [{ "enunciado": "...", "opciones": ["a","b","c","d"], "respuestaCorrecta": 0, "explicacion": "..." }] }.
Genera 8 preguntas con una única opción correcta (respuestaCorrecta índice 0-3) y explicación breve. Español.`
}

function validarItems(items) {
  if (!Array.isArray(items) || items.length === 0) return false
  for (const q of items) {
    if (!q || typeof q.enunciado !== 'string') return false
    if (!Array.isArray(q.opciones) || q.opciones.length < 2) return false
    if (typeof q.respuestaCorrecta !== 'number' || q.respuestaCorrecta < 0 || q.respuestaCorrecta >= q.opciones.length) return false
  }
  return true
}

function extraerJSON(texto) {
  const t = (texto || '').trim().replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim()
  const i = t.indexOf('{'); const j = t.lastIndexOf('}')
  if (i < 0 || j < 0) return null
  try { return JSON.parse(t.slice(i, j + 1)) } catch { return null }
}

exports.handler = async function (event) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: corsHeaders(event), body: '' }
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: corsHeaders(event), body: JSON.stringify({ error: 'Method Not Allowed' }) }
  if (!process.env.GROQ_API_KEY) return { statusCode: 500, headers: corsHeaders(event), body: JSON.stringify({ error: 'GROQ_API_KEY no configurada en el servidor' }) }
  if (typeof fetch !== 'function') return { statusCode: 500, headers: corsHeaders(event), body: JSON.stringify({ error: 'Runtime sin fetch global (Node < 18)' }) }

  let payload
  try { payload = JSON.parse(event.body || '{}') } catch { return { statusCode: 400, headers: corsHeaders(event), body: JSON.stringify({ error: 'JSON invalido' }) } }
  if (payload.tipo !== 'psicotecnico' && payload.tipo !== 'supuesto') {
    return { statusCode: 400, headers: corsHeaders(event), body: JSON.stringify({ error: 'tipo invalido' }) }
  }

  const groqBody = {
    model: MODEL,
    messages: [{ role: 'user', content: buildPrompt(payload) }],
    temperature: 0.4,
    max_tokens: 3000,
    response_format: { type: 'json_object' },
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
    const content = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content
    const parsed = extraerJSON(content)
    if (payload.tipo === 'supuesto') {
      if (!parsed || typeof parsed.caso !== 'string' || !validarItems(parsed.preguntas)) {
        return { statusCode: 502, headers: corsHeaders(event), body: JSON.stringify({ error: 'Respuesta no valida' }) }
      }
      return { statusCode: 200, headers: corsHeaders(event), body: JSON.stringify({ supuesto: parsed }) }
    }
    const items = parsed && parsed.preguntas
    if (!validarItems(items)) {
      return { statusCode: 502, headers: corsHeaders(event), body: JSON.stringify({ error: 'Respuesta no valida' }) }
    }
    return { statusCode: 200, headers: corsHeaders(event), body: JSON.stringify({ preguntas: items }) }
  } catch (err) {
    const msg = err && err.name === 'AbortError' ? 'Tiempo de espera agotado' : String(err && err.message ? err.message : err)
    return { statusCode: 502, headers: corsHeaders(event), body: JSON.stringify({ error: 'Error contactando con Groq', detail: msg }) }
  } finally {
    clearTimeout(timeout)
  }
}

exports.buildPrompt = buildPrompt
exports.validarItems = validarItems
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test netlify/functions-tests/practica-generate.test.cjs`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add netlify/functions/practica-generate.cjs netlify/functions-tests/practica-generate.test.cjs
git commit -m "feat(practica): funcion Netlify practica-generate (Groq, efimero)"
```

---

## Task 5: Servicio cliente `practica.ts`

**Files:**
- Create: `src/services/practica.ts`
- Test: `src/services/practica.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/services/practica.test.ts`:

```ts
import { describe, it, expect, vi, afterEach } from 'vitest'
import { generarPsicotecnicos, generarSupuesto } from './practica'

afterEach(() => { vi.restoreAllMocks() })

describe('practica service', () => {
  it('generarPsicotecnicos devuelve preguntas en 200', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true, status: 200, json: () => Promise.resolve({ preguntas: [{ enunciado: 'e', opciones: ['a', 'b'], respuestaCorrecta: 0, explicacion: 'x' }] }),
    }))
    const r = await generarPsicotecnicos('series-numericas')
    expect(r.error).toBeNull()
    expect(r.preguntas).toHaveLength(1)
  })

  it('generarPsicotecnicos devuelve error en fallo', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 502, json: () => Promise.resolve({ error: 'boom' }) }))
    const r = await generarPsicotecnicos('series-numericas')
    expect(r.preguntas).toEqual([])
    expect(r.error).toBe('boom')
  })

  it('generarSupuesto devuelve supuesto en 200', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true, status: 200, json: () => Promise.resolve({ supuesto: { titulo: 't', caso: 'c', preguntas: [] } }),
    }))
    const r = await generarSupuesto('cgpc', 'temario')
    expect(r.error).toBeNull()
    expect(r.supuesto?.caso).toBe('c')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --run src/services/practica.test.ts`
Expected: FAIL — no se resuelve `./practica`.

- [ ] **Step 3: Write the implementation**

Create `src/services/practica.ts`:

```ts
// src/services/practica.ts
// Cliente de generación efímera de práctica (psicotécnicos / supuestos).

import type { PreguntaTest } from '../components/test/MotorTest'

const ENDPOINT = '/.netlify/functions/practica-generate'

export interface SupuestoGenerado {
  titulo: string
  caso: string
  preguntas: PreguntaTest[]
}

async function post(body: unknown): Promise<{ data: any; error: string | null }> {
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) return { data: null, error: (data && data.error) || `HTTP ${res.status}` }
    return { data, error: null }
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Error desconocido' }
  }
}

export async function generarPsicotecnicos(categoria: string): Promise<{ preguntas: PreguntaTest[]; error: string | null }> {
  const { data, error } = await post({ tipo: 'psicotecnico', categoria })
  if (error || !data) return { preguntas: [], error }
  return { preguntas: (data.preguntas as PreguntaTest[]) ?? [], error: null }
}

export async function generarSupuesto(slug: string, contexto: string): Promise<{ supuesto: SupuestoGenerado | null; error: string | null }> {
  const { data, error } = await post({ tipo: 'supuesto', slug, contexto })
  if (error || !data) return { supuesto: null, error }
  return { supuesto: (data.supuesto as SupuestoGenerado) ?? null, error: null }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- --run src/services/practica.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/services/practica.ts src/services/practica.test.ts
git commit -m "feat(practica): servicio cliente de generacion (psicotecnicos/supuestos)"
```

---

## Task 6: Páginas + rutas + dashboard

**Files:**
- Create: `src/pages/Psicotecnicos.tsx`
- Create: `src/pages/Supuestos.tsx`
- Create: `src/pages/SupuestoDetalle.tsx`
- Modify: `src/App.tsx`
- Modify: `src/pages/OposicionDashboard.tsx` (array `MENU`, líneas 5-10)

- [ ] **Step 1: Create `Psicotecnicos.tsx`**

```tsx
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { CATEGORIAS, cargarCategoria } from '../data/psicotecnicos/index'
import { MotorTest, type PreguntaTest } from '../components/test/MotorTest'
import { generarPsicotecnicos } from '../services/practica'

export default function Psicotecnicos() {
  const navigate = useNavigate()
  const { slug } = useParams<{ slug: string }>()
  const [catId, setCatId] = useState<string | null>(null)
  const [titulo, setTitulo] = useState('')
  const [preguntas, setPreguntas] = useState<PreguntaTest[]>([])
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function abrir(id: string, label: string) {
    setCatId(id); setTitulo(label); setError(null)
    setPreguntas(await cargarCategoria(id))
  }

  async function generarMas() {
    if (!catId) return
    setCargando(true); setError(null)
    const { preguntas: nuevas, error: err } = await generarPsicotecnicos(catId)
    setCargando(false)
    if (err || !nuevas.length) { setError('No se pudo generar, inténtalo de nuevo.'); return }
    setPreguntas(prev => [...prev, ...nuevas])
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => catId ? setCatId(null) : navigate(`/oposicion/${slug}`)} className="text-marca-600 text-sm font-medium">←</button>
        <h1 className="text-lg font-bold text-slate-900">Psicotécnicos</h1>
      </header>
      <main className="p-4 max-w-2xl mx-auto space-y-3">
        {!catId && CATEGORIAS.map(c => (
          <button key={c.id} onClick={() => abrir(c.id, c.titulo)}
            className="w-full flex items-center gap-3 bg-white border border-slate-200 rounded-2xl shadow-sm px-4 py-4 text-left hover:shadow-md transition-shadow">
            <span className="flex-1 text-sm font-bold text-slate-900">{c.titulo}</span>
            <span className="text-slate-300 text-lg">›</span>
          </button>
        ))}
        {catId && (
          <>
            <MotorTest preguntas={preguntas} titulo={titulo} />
            <button onClick={generarMas} disabled={cargando}
              className="w-full border border-marca-200 text-marca-700 rounded-xl py-2 text-sm font-semibold disabled:opacity-40">
              {cargando ? 'Generando…' : '+ Generar más preguntas'}
            </button>
            {error && <p className="text-xs text-red-600">{error}</p>}
          </>
        )}
      </main>
    </div>
  )
}
```

- [ ] **Step 2: Create `Supuestos.tsx`**

```tsx
import { useNavigate, useParams } from 'react-router-dom'
import * as cgpc from '../data/supuestos/cgpc/index'
import * as pl from '../data/supuestos/policia-local/index'

const MODULOS: Record<string, { SUPUESTOS_META: readonly { id: string; titulo: string }[] }> = {
  'cgpc': cgpc,
  'policia-local': pl,
}

export default function Supuestos() {
  const navigate = useNavigate()
  const { slug } = useParams<{ slug: string }>()
  const modulo = MODULOS[slug ?? 'cgpc']
  const metas = modulo ? modulo.SUPUESTOS_META : []

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => navigate(`/oposicion/${slug}`)} className="text-marca-600 text-sm font-medium">←</button>
        <h1 className="text-lg font-bold text-slate-900">Supuestos prácticos</h1>
      </header>
      <main className="p-4 max-w-2xl mx-auto space-y-3">
        {metas.length === 0 && <p className="text-slate-400 text-sm text-center py-8">Aún no hay supuestos para esta oposición.</p>}
        {metas.map(m => (
          <button key={m.id} onClick={() => navigate(`/oposicion/${slug}/supuestos/${m.id}`)}
            className="w-full flex items-center gap-3 bg-white border border-slate-200 rounded-2xl shadow-sm px-4 py-4 text-left hover:shadow-md transition-shadow">
            <span className="flex-1 text-sm font-bold text-slate-900">{m.titulo}</span>
            <span className="text-slate-300 text-lg">›</span>
          </button>
        ))}
      </main>
    </div>
  )
}
```

- [ ] **Step 3: Create `SupuestoDetalle.tsx`**

```tsx
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import * as cgpc from '../data/supuestos/cgpc/index'
import * as pl from '../data/supuestos/policia-local/index'
import { MotorTest, type PreguntaTest } from '../components/test/MotorTest'

const MODULOS: Record<string, { cargarSupuesto: (id: string) => Promise<any> }> = {
  'cgpc': cgpc,
  'policia-local': pl,
}

export default function SupuestoDetalle() {
  const navigate = useNavigate()
  const { slug, id } = useParams<{ slug: string; id: string }>()
  const [supuesto, setSupuesto] = useState<{ titulo: string; caso: string; preguntas: PreguntaTest[] } | null>(null)
  const [cargado, setCargado] = useState(false)

  useEffect(() => {
    const modulo = MODULOS[slug ?? 'cgpc']
    if (!modulo || !id) { setCargado(true); return }
    modulo.cargarSupuesto(id).then(s => { setSupuesto(s); setCargado(true) })
  }, [slug, id])

  useEffect(() => {
    if (cargado && !supuesto) navigate(`/oposicion/${slug}/supuestos`)
  }, [cargado, supuesto, navigate, slug])

  if (!supuesto) return <div className="min-h-screen flex items-center justify-center text-slate-400">Cargando…</div>

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => navigate(`/oposicion/${slug}/supuestos`)} className="text-marca-600 text-sm font-medium">←</button>
        <h1 className="text-base font-bold text-slate-900 truncate">{supuesto.titulo}</h1>
      </header>
      <main className="p-4 max-w-2xl mx-auto space-y-4">
        <details open className="bg-white border border-slate-200 rounded-2xl p-4">
          <summary className="text-sm font-semibold text-slate-900 cursor-pointer">Enunciado del supuesto</summary>
          <p className="text-sm text-slate-700 mt-2 whitespace-pre-wrap">{supuesto.caso}</p>
        </details>
        <MotorTest preguntas={supuesto.preguntas} titulo="Preguntas del supuesto" />
      </main>
    </div>
  )
}
```

- [ ] **Step 4: Add routes in `src/App.tsx`**

Tras la línea `const Equivalencias = lazy(() => import('./pages/Equivalencias'))` añade:

```tsx
const Psicotecnicos = lazy(() => import('./pages/Psicotecnicos'))
const Supuestos = lazy(() => import('./pages/Supuestos'))
const SupuestoDetalle = lazy(() => import('./pages/SupuestoDetalle'))
```

Tras la ruta `<Route path="/oposicion/:slug/perfil" .../>` añade:

```tsx
        <Route path="/oposicion/:slug/psicotecnicos" element={<RutaProtegida><Psicotecnicos /></RutaProtegida>} />
        <Route path="/oposicion/:slug/supuestos" element={<RutaProtegida><Supuestos /></RutaProtegida>} />
        <Route path="/oposicion/:slug/supuestos/:id" element={<RutaProtegida><SupuestoDetalle /></RutaProtegida>} />
```

- [ ] **Step 5: Add cards in `OposicionDashboard.tsx`**

Reemplaza el array `MENU` (líneas 5-10) por:

```tsx
const MENU = [
  { icon: '📚', label: 'Temario', sub: 'Estudia los temas', path: 'temario' },
  { icon: '🃏', label: 'Flashcards', sub: 'Repaso rápido', path: 'flashcards' },
  { icon: '📝', label: 'Tests y simulacros', sub: 'Practica preguntas', path: 'tests' },
  { icon: '🧠', label: 'Psicotécnicos', sub: 'Aptitudes y razonamiento', path: 'psicotecnicos' },
  { icon: '📋', label: 'Supuestos prácticos', sub: 'Casos tipo examen', path: 'supuestos' },
  { icon: '📊', label: 'Estadísticas', sub: 'Ver mi progreso', path: 'estadisticas' },
]
```

- [ ] **Step 6: Verify build and tests**

Run: `npm run build`
Expected: build verde.

Run: `npm test -- --run src/components/test/MotorTest.test.tsx src/data/psicotecnicos/index.test.ts src/data/supuestos/cgpc/index.test.ts src/services/practica.test.ts`
Expected: todos verdes.

- [ ] **Step 7: Commit**

```bash
git add src/pages/Psicotecnicos.tsx src/pages/Supuestos.tsx src/pages/SupuestoDetalle.tsx src/App.tsx src/pages/OposicionDashboard.tsx
git commit -m "feat(practica): paginas de psicotecnicos y supuestos + rutas + tarjetas dashboard"
```

---

## Task 7: Script `generate-psicotecnicos.cjs` y banco

**Files:**
- Create: `scripts/generate-psicotecnicos.cjs`
- (genera) `src/data/psicotecnicos/*.json`

> Sin test automatizado (utilidad de contenido). Verificación: ejecutar y comprobar JSON válido.

- [ ] **Step 1: Write the script**

Create `scripts/generate-psicotecnicos.cjs`:

```js
// scripts/generate-psicotecnicos.cjs
// Genera el banco de psicotécnicos por categoría con Groq.
// Uso: node scripts/generate-psicotecnicos.cjs [categoria] [n]

const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const MODEL = 'llama-3.1-8b-instant'
const DIR = path.join(ROOT, 'src', 'data', 'psicotecnicos')

const CATS = {
  'series-numericas': 'series numéricas',
  'razonamiento-verbal': 'razonamiento verbal (sinónimos, antónimos, analogías, frases incompletas)',
  'razonamiento-logico': 'razonamiento lógico y abstracto (silogismos, deducción)',
  'ortografia-calculo': 'ortografía y cálculo matemático',
  'razonamiento-mecanico': 'razonamiento mecánico descrito en texto (sin imágenes)',
}

function leerKey() {
  if (process.env.GROQ_API_KEY) return process.env.GROQ_API_KEY
  const env = fs.readFileSync(path.join(ROOT, '.env.local'), 'utf8')
  return env.match(/GROQ_API_KEY\s*=\s*(.+)/)[1].trim()
}
const KEY = leerKey()
const sleep = ms => new Promise(r => setTimeout(r, ms))

function extraerJSON(t) {
  const s = (t || '').trim(); const i = s.indexOf('{'); const j = s.lastIndexOf('}')
  if (i < 0 || j < 0) return null
  try { return JSON.parse(s.slice(i, j + 1)) } catch { return null }
}

async function generar(catId, n) {
  const body = {
    model: MODEL,
    messages: [{ role: 'user', content: `Genera ${n} preguntas psicotécnicas de ${CATS[catId]} para oposición. Devuelve SOLO JSON {"preguntas":[{"enunciado":"..","opciones":["a","b","c","d"],"respuestaCorrecta":0,"explicacion":".."}]}. 4 opciones, respuestaCorrecta índice 0-3. Español.` }],
    temperature: 0.5, max_tokens: 4000, response_format: { type: 'json_object' },
  }
  for (let i = 0; i < 4; i++) {
    const r = await fetch(GROQ_URL, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${KEY}` }, body: JSON.stringify(body) })
    if (r.status === 429) { await sleep(15000); continue }
    if (!r.ok) { await sleep(2000); continue }
    const j = await r.json()
    const d = extraerJSON(j.choices?.[0]?.message?.content)
    if (d && Array.isArray(d.preguntas) && d.preguntas.length) return d.preguntas
    await sleep(1500)
  }
  return null
}

async function run(soloCat, n) {
  const cats = soloCat ? [soloCat] : Object.keys(CATS)
  for (const catId of cats) {
    const preguntas = await generar(catId, n)
    if (!preguntas) { console.log(catId, 'FALLO'); continue }
    const items = preguntas.map((q, i) => ({ id: `psico-${catId}-${String(i + 1).padStart(3, '0')}`, categoria: catId, enunciado: q.enunciado, opciones: q.opciones, respuestaCorrecta: q.respuestaCorrecta, explicacion: q.explicacion || '' }))
    fs.writeFileSync(path.join(DIR, `${catId}.json`), JSON.stringify(items, null, 2) + '\n', 'utf8')
    console.log(catId, items.length, 'preguntas')
    await sleep(7000)
  }
}

run(process.argv[2] || null, Number(process.argv[3]) || 15)
```

- [ ] **Step 2: Run it to populate the bank**

Run: `node scripts/generate-psicotecnicos.cjs`
Expected: escribe `<categoria>.json` para las 5 categorías (≈15 preguntas cada una). Reintentar categorías con FALLO individualmente: `node scripts/generate-psicotecnicos.cjs razonamiento-verbal`.

- [ ] **Step 3: Commit**

```bash
git add scripts/generate-psicotecnicos.cjs src/data/psicotecnicos/
git commit -m "feat(practica): script y banco generado de psicotecnicos"
```

---

## Task 8: Script `generate-supuestos.cjs` y banco

**Files:**
- Create: `scripts/generate-supuestos.cjs`
- (genera) `src/data/supuestos/<slug>/supuesto-NN.json` + actualiza `index.ts`

> Genera supuestos (caso + ~25 preguntas) desde el temario. Para no truncar, genera el caso + 13 preguntas y luego 12 más, y las une.

- [ ] **Step 1: Write the script**

Create `scripts/generate-supuestos.cjs`:

```js
// scripts/generate-supuestos.cjs
// Genera supuestos prácticos (caso + preguntas) desde el temario de la oposición.
// Uso: node scripts/generate-supuestos.cjs <cgpc|policia-local> [nSupuestos]

const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const MODEL = 'llama-3.1-8b-instant'

function leerKey() {
  if (process.env.GROQ_API_KEY) return process.env.GROQ_API_KEY
  return fs.readFileSync(path.join(ROOT, '.env.local'), 'utf8').match(/GROQ_API_KEY\s*=\s*(.+)/)[1].trim()
}
const KEY = leerKey()
const sleep = ms => new Promise(r => setTimeout(r, ms))
function extraerJSON(t) { const s = (t || '').trim(); const i = s.indexOf('{'); const j = s.lastIndexOf('}'); if (i < 0 || j < 0) return null; try { return JSON.parse(s.slice(i, j + 1)) } catch { return null } }

function contextoTemario(slug) {
  const dir = path.join(ROOT, 'src', 'data', 'topics', slug)
  const files = fs.readdirSync(dir).filter(f => /^tema-\d+\.json$/.test(f))
  const elegidos = files.sort(() => Math.random() - 0.5).slice(0, 3)
  let txt = ''
  for (const f of elegidos) {
    const t = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8').replace(/^﻿/, ''))
    txt += (t.secciones || []).map(s => s.contenido).join(' ') + ' '
  }
  return txt.slice(0, 6000)
}

async function llamar(prompt, maxTokens) {
  const body = { model: MODEL, messages: [{ role: 'user', content: prompt }], temperature: 0.5, max_tokens: maxTokens, response_format: { type: 'json_object' } }
  for (let i = 0; i < 4; i++) {
    const r = await fetch(GROQ_URL, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${KEY}` }, body: JSON.stringify(body) })
    if (r.status === 429) { await sleep(15000); continue }
    if (!r.ok) { await sleep(2000); continue }
    const j = await r.json()
    const d = extraerJSON(j.choices?.[0]?.message?.content)
    if (d) return d
    await sleep(1500)
  }
  return null
}

async function generarSupuesto(slug, n) {
  const ctx = contextoTemario(slug)
  const base = await llamar(`Genera un supuesto práctico de oposición (cuerpo ${slug}) basado en el TEMARIO. Devuelve SOLO JSON {"titulo":"..","caso":"..","preguntas":[{"enunciado":"..","opciones":["a","b","c","d"],"respuestaCorrecta":0,"explicacion":".."}]} con 13 preguntas. Solo info del temario. Español. TEMARIO: ${ctx}`, 4000)
  if (!base || !base.caso || !Array.isArray(base.preguntas)) return null
  const extra = await llamar(`Para este CASO de oposición (${slug}): "${base.caso}". Genera 12 preguntas MÁS tipo test (distintas). SOLO JSON {"preguntas":[{"enunciado":"..","opciones":["a","b","c","d"],"respuestaCorrecta":0,"explicacion":".."}]}. Español.`, 4000)
  const todas = [...base.preguntas, ...((extra && extra.preguntas) || [])]
  const prefijo = slug === 'cgpc' ? 'sup-cgpc' : 'sup-pl'
  return {
    id: `${prefijo}-${String(n).padStart(2, '0')}`,
    titulo: base.titulo || `Supuesto ${n}`,
    caso: base.caso,
    preguntas: todas.map((q, i) => ({ id: `${prefijo}-${String(n).padStart(2, '0')}-p${String(i + 1).padStart(2, '0')}`, enunciado: q.enunciado, opciones: q.opciones, respuestaCorrecta: q.respuestaCorrecta, explicacion: q.explicacion || '' })),
  }
}

async function run(slug, total) {
  const dir = path.join(ROOT, 'src', 'data', 'supuestos', slug)
  fs.mkdirSync(dir, { recursive: true })
  const metas = []
  for (let n = 1; n <= total; n++) {
    const s = await generarSupuesto(slug, n)
    if (!s) { console.log(slug, 'supuesto', n, 'FALLO'); continue }
    fs.writeFileSync(path.join(dir, `supuesto-${String(n).padStart(2, '0')}.json`), JSON.stringify(s, null, 2) + '\n', 'utf8')
    metas.push({ id: s.id, titulo: s.titulo })
    console.log(slug, s.id, s.preguntas.length, 'preguntas')
    await sleep(7000)
  }
  const idxPath = path.join(dir, 'index.ts')
  if (fs.existsSync(idxPath) && metas.length) {
    let src = fs.readFileSync(idxPath, 'utf8')
    const arr = 'export const SUPUESTOS_META = [\n' + metas.map(m => `  { id: ${JSON.stringify(m.id)}, titulo: ${JSON.stringify(m.titulo)} },`).join('\n') + '\n] as const;'
    src = src.replace(/export const SUPUESTOS_META = \[[\s\S]*?\] as const;/, arr)
    fs.writeFileSync(idxPath, src, 'utf8')
    console.log(slug, 'index.ts SUPUESTOS_META regenerado:', metas.length)
  }
}

run(process.argv[2], Number(process.argv[3]) || 3)
```

- [ ] **Step 2: Run for both oppositions**

Run: `node scripts/generate-supuestos.cjs cgpc 3` then `node scripts/generate-supuestos.cjs policia-local 3`
Expected: escribe `supuesto-0N.json` y regenera `index.ts`. (Si una falla por rate limit, reintentar.)

> NOTA: los ids generados (`sup-cgpc-NN`, `sup-pl-NN`) coinciden con el patrón de reemplazo del fichero en `cargarSupuesto` (`id.replace('sup-cgpc-','supuesto-')` → `supuesto-NN`), por lo que `cargarSupuesto` sigue resolviendo el JSON correcto.

- [ ] **Step 3: Verify build + commit**

Run: `npm run build`
Expected: verde.

```bash
git add scripts/generate-supuestos.cjs src/data/supuestos/
git commit -m "feat(practica): script y banco generado de supuestos practicos"
```

---

## Task 9: Verificación manual end-to-end

**Files:** ninguno.

- [ ] **Step 1: Arrancar Netlify Dev**

Run: `netlify dev` → abrir `http://localhost:8888`.

- [ ] **Step 2: Probar el flujo**
- Dashboard de una oposición → ver tarjetas "Psicotécnicos" y "Supuestos prácticos".
- Psicotécnicos → elegir categoría → responder → ver nota y revisión. Pulsar "Generar más" → llegan preguntas nuevas.
- Supuestos → abrir uno → leer el caso → responder las preguntas → ver nota.

- [ ] **Step 3: Commit final (si hubo ajustes)**

```bash
git add -A && git commit -m "chore(practica): ajustes tras verificacion manual"
```

---

## Notas de cierre
- La función reutiliza `GROQ_API_KEY` y `ALLOWED_ORIGINS` ya configuradas en Netlify.
- Despliegue: push a `main` (recordar el posible bloqueo "Unrecognized Git contributor" → deploy manual si aplica).
- Tests `.cjs` van en `netlify/functions-tests/` para que Netlify no los trate como funciones.
