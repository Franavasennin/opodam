# OpoDAM Fase 3 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Añadir Modo Examen Oficial CGPC, Inteligencia Adaptativa (panel de debilidades + sesión diaria) y Sincronización en la nube local-first con Supabase a OpoDAM.

**Architecture:** Local-first — localStorage sigue siendo la fuente principal; Supabase es una capa opcional de sync. Nuevos servicios puros (`examen.ts`, `adaptativo.ts`, `sync.ts`, `supabase.ts`) con cero side-effects en los tests. Nuevas páginas (`Examen`, `SesionDiaria`, `Perfil`) siguen el patrón existente de `Simulacro.tsx`.

**Tech Stack:** React 18 + TypeScript + Vite 5 + Vitest · `@supabase/supabase-js` (nueva dep) · localStorage · CSS Tailwind existente

---

## Estructura de ficheros

### Crear
| Fichero | Responsabilidad |
|---------|----------------|
| `src/services/examen.ts` | Fórmula CGPC, selección ponderada de preguntas, guardar resultado |
| `src/services/adaptativo.ts` | Calcular debilidades, generar sesión diaria |
| `src/services/supabase.ts` | Cliente Supabase, auth magic link |
| `src/services/sync.ts` | Merge local↔nube, push/pull |
| `src/pages/Examen.tsx` | Modo examen oficial completo |
| `src/pages/SesionDiaria.tsx` | Sesión adaptativa diaria |
| `src/pages/Perfil.tsx` | Login, sync, exportar/importar |
| `src/components/ui/PanelDebilidades.tsx` | Panel de 5 temas más débiles (reutilizable) |
| `tests/services/examen.test.ts` | Tests para examen.ts |
| `tests/services/adaptativo.test.ts` | Tests para adaptativo.ts |
| `tests/services/sync.test.ts` | Tests para sync.ts |

### Modificar
| Fichero | Cambio |
|---------|--------|
| `src/types/index.ts` | Añadir `ExamenResultado`, `PreguntaExt`, `RendimientoTema`, extender `Progreso` |
| `src/services/storage.ts` | Extender `progresoInicial` con nuevos campos |
| `src/services/progress.ts` | `guardarResultadoTest` actualiza también `rendimientoPorTema` |
| `src/App.tsx` | Rutas `/examen`, `/sesion-diaria`, `/perfil` + auto-sync |
| `src/components/layout/BottomNav.tsx` | Añadir Examen (🎯) y Perfil (👤) |
| `src/components/layout/SideNav.tsx` | Añadir Examen y Perfil |
| `src/pages/Dashboard.tsx` | Tarjeta "Sesión de hoy" + `PanelDebilidades` |
| `src/pages/Estadisticas.tsx` | Sección `PanelDebilidades` |

---

## Task 1: Extender tipos y storage

**Files:**
- Modify: `src/types/index.ts`
- Modify: `src/services/storage.ts`
- Test: `tests/services/storage.test.ts` (ya existe)

- [ ] **Step 1: Añadir los nuevos tipos a `src/types/index.ts`**

Añadir al final del fichero, después de la interfaz `Progreso` existente:

```typescript
export type PreguntaExt = Pregunta & { temaId: number }

export interface RendimientoTema {
  aciertos: number
  errores: number
  total: number
}

export interface ExamenResultado {
  id: string        // timestamp ISO, ej: "2026-05-02T18:30:00.000Z"
  fecha: string     // YYYY-MM-DD
  modo: 'completo' | 'mini'
  aciertos: number
  errores: number
  enBlanco: number
  nota: number      // 0–10, 2 decimales
  aprobado: boolean
  tiempoSegundos: number
  preguntasIds: string[]
  respuestasUsuario: Record<string, number | null>
  resultadosPorTema: Record<number, { aciertos: number; errores: number; total: number }>
}
```

- [ ] **Step 2: Extender la interfaz `Progreso` en `src/types/index.ts`**

Reemplazar la interfaz `Progreso` existente:

```typescript
export interface Progreso {
  temas: Record<string, ProgresoTema>
  flashcards: Record<string, EstadoFlashcard>
  racha: { dias: number; ultimoEstudio: string | null }
  tiempoTotalSegundos: number
  notificaciones: { hora: string; activas: boolean }
  historialExamenes: ExamenResultado[]
  sesionDiaria: { fecha: string; flashcardIds: string[]; preguntaIds: string[]; completada: boolean } | null
  rendimientoPorTema: Record<string, RendimientoTema>
}
```

- [ ] **Step 3: Extender `progresoInicial` en `src/services/storage.ts`**

Reemplazar el objeto `progresoInicial`:

```typescript
const progresoInicial: Progreso = {
  temas: {},
  flashcards: {},
  racha: { dias: 0, ultimoEstudio: null },
  tiempoTotalSegundos: 0,
  notificaciones: { hora: '19:00', activas: false },
  historialExamenes: [],
  sesionDiaria: null,
  rendimientoPorTema: {},
}
```

- [ ] **Step 4: Verificar que el test de storage existente sigue pasando**

```bash
npx vitest run tests/services/storage.test.ts
```

Expected: PASS (todos los tests existentes siguen verdes porque los nuevos campos tienen valores por defecto)

- [ ] **Step 5: Commit**

```bash
git add src/types/index.ts src/services/storage.ts
git commit -m "feat: extend Progreso types for fase3 (examen, adaptativo, sync)"
```

---

## Task 2: Servicio `examen.ts` + tests

**Files:**
- Create: `src/services/examen.ts`
- Create: `tests/services/examen.test.ts`

- [ ] **Step 1: Escribir los tests en `tests/services/examen.test.ts`**

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { calcularNotaExamen, calcularDebilidadesPorExamen } from '../../src/services/examen'

beforeEach(() => localStorage.clear())

describe('calcularNotaExamen', () => {
  it('50 aciertos 0 errores = 10.00', () => {
    expect(calcularNotaExamen(50, 0)).toBe(10)
  })
  it('25 aciertos 0 errores = 5.00 (aprobado justo)', () => {
    expect(calcularNotaExamen(25, 0)).toBe(5)
  })
  it('37 aciertos 9 errores = 6.80', () => {
    // 37*0.20=7.40, floor(9/3)*0.20=0.60, nota=6.80
    expect(calcularNotaExamen(37, 9)).toBe(6.80)
  })
  it('3 errores exactos restan 0.20', () => {
    expect(calcularNotaExamen(25, 3)).toBe(4.80)
  })
  it('2 errores NO restan nada', () => {
    expect(calcularNotaExamen(25, 2)).toBe(5)
  })
  it('nota nunca negativa', () => {
    expect(calcularNotaExamen(0, 50)).toBe(0)
  })
  it('nota máxima 10', () => {
    expect(calcularNotaExamen(100, 0)).toBe(10)
  })
})

describe('calcularDebilidadesPorExamen', () => {
  it('devuelve objeto vacío cuando no hay preguntas', () => {
    expect(calcularDebilidadesPorExamen([], {}, {})).toEqual({})
  })
  it('cuenta aciertos y errores por tema', () => {
    const preguntas = [
      { id: 'p1', temaId: 5 },
      { id: 'p2', temaId: 5 },
      { id: 'p3', temaId: 7 },
    ]
    const respuestas: Record<string, number | null> = { p1: 0, p2: 1, p3: null }
    const correctas: Record<string, number> = { p1: 0, p2: 0, p3: 2 }
    const result = calcularDebilidadesPorExamen(preguntas, respuestas, correctas)
    expect(result[5]).toEqual({ aciertos: 1, errores: 1, total: 2 })
    expect(result[7]).toEqual({ aciertos: 0, errores: 0, total: 1 }) // en blanco no penaliza
  })
})
```

- [ ] **Step 2: Verificar que el test falla**

```bash
npx vitest run tests/services/examen.test.ts
```

Expected: FAIL con "Cannot find module '../../src/services/examen'"

- [ ] **Step 3: Implementar `src/services/examen.ts`**

```typescript
import type { ExamenResultado, PreguntaExt, Progreso, RendimientoTema } from '../types'
import { getProgreso, saveProgreso } from './storage'

// ── Puntuación CGPC ─────────────────────────────────────────
export function calcularNotaExamen(aciertos: number, errores: number): number {
  const bruta = (aciertos * 0.20) - (Math.floor(errores / 3) * 0.20)
  return Math.max(0, Math.min(10, Math.round(bruta * 100) / 100))
}

// ── Análisis por tema ────────────────────────────────────────
export function calcularDebilidadesPorExamen(
  preguntas: Array<{ id: string; temaId: number }>,
  respuestasUsuario: Record<string, number | null>,
  correctas: Record<string, number>,
): Record<number, { aciertos: number; errores: number; total: number }> {
  const por: Record<number, { aciertos: number; errores: number; total: number }> = {}
  for (const { id, temaId } of preguntas) {
    if (!por[temaId]) por[temaId] = { aciertos: 0, errores: 0, total: 0 }
    por[temaId].total++
    const resp = respuestasUsuario[id]
    if (resp === null || resp === undefined) continue
    if (resp === correctas[id]) por[temaId].aciertos++
    else por[temaId].errores++
  }
  return por
}

// ── Selección ponderada de preguntas ───────────────────────
function barajar<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5)
}

export function seleccionarPreguntas(
  todas: PreguntaExt[],
  rendimiento: Progreso['rendimientoPorTema'],
  cantidad: number,
): PreguntaExt[] {
  function peso(temaId: number): number {
    const r = rendimiento[String(temaId)]
    if (!r || r.total < 3) return 1
    const tasa = r.aciertos / r.total
    return tasa < 0.5 ? 3 : tasa < 0.7 ? 2 : 1
  }
  const ponderadas: PreguntaExt[] = []
  for (const p of todas) {
    for (let i = 0; i < peso(p.temaId); i++) ponderadas.push(p)
  }
  const vistas = new Set<string>()
  const resultado: PreguntaExt[] = []
  for (const p of barajar(ponderadas)) {
    if (!vistas.has(p.id)) {
      vistas.add(p.id)
      resultado.push(p)
      if (resultado.length === cantidad) break
    }
  }
  return resultado
}

// ── Guardar resultado ───────────────────────────────────────
export function guardarExamen(resultado: ExamenResultado): void {
  const p = getProgreso()
  p.historialExamenes = [resultado, ...p.historialExamenes].slice(0, 10)
  for (const [temaIdStr, res] of Object.entries(resultado.resultadosPorTema)) {
    const actual = p.rendimientoPorTema[temaIdStr] ?? { aciertos: 0, errores: 0, total: 0 }
    p.rendimientoPorTema[temaIdStr] = {
      aciertos: actual.aciertos + res.aciertos,
      errores:  actual.errores  + res.errores,
      total:    actual.total    + res.total,
    }
  }
  saveProgreso(p)
}

// ── Actualizar rendimiento desde tests de tema ──────────────
export function actualizarRendimientoTema(
  temaId: number,
  aciertos: number,
  errores: number,
  total: number,
): void {
  const p = getProgreso()
  const actual: RendimientoTema = p.rendimientoPorTema[String(temaId)] ?? { aciertos: 0, errores: 0, total: 0 }
  p.rendimientoPorTema[String(temaId)] = {
    aciertos: actual.aciertos + aciertos,
    errores:  actual.errores  + errores,
    total:    actual.total    + total,
  }
  saveProgreso(p)
}
```

- [ ] **Step 4: Verificar que los tests pasan**

```bash
npx vitest run tests/services/examen.test.ts
```

Expected: PASS (9 tests)

- [ ] **Step 5: Actualizar `src/services/progress.ts` — `guardarResultadoTest` también actualiza `rendimientoPorTema`**

Añadir el import al inicio del fichero (después de los imports existentes):

```typescript
import { actualizarRendimientoTema } from './examen'
```

Reemplazar la función `guardarResultadoTest` completa:

```typescript
export function guardarResultadoTest(
  temaId: number,
  aciertos: number,
  errores: number,
  total: number,
): void {
  const p = getProgreso()
  const tema = p.temas[String(temaId)] ?? {
    vueltas: 0, ultimaRevision: null, porcentajeAciertos: 0, teoriaLeida: false,
  }
  tema.porcentajeAciertos = Math.round((aciertos / total) * 100)
  p.temas[String(temaId)] = tema
  saveProgreso(p)
  completarVuelta(temaId)
  actualizarRendimientoTema(temaId, aciertos, errores, total)
}
```

- [ ] **Step 6: Verificar tests existentes siguen pasando**

```bash
npx vitest run tests/services/progress.test.ts
```

Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/services/examen.ts src/services/progress.ts tests/services/examen.test.ts
git commit -m "feat: add examen service with CGPC scoring formula"
```

---

## Task 3: Página `Examen.tsx`

**Files:**
- Create: `src/pages/Examen.tsx`

La página tiene 5 estados: `inicio` | `en-curso` | `confirmacion` | `resultados` | `revision`.

- [ ] **Step 1: Crear `src/pages/Examen.tsx`**

```typescript
import { useState, useEffect, useRef } from 'react'
import { cargarTema, TEMAS_META } from '../data/topics'
import { useProgress } from '../hooks/useProgress'
import { Card } from '../components/ui/Card'
import type { PreguntaExt, ExamenResultado } from '../types'
import {
  calcularNotaExamen,
  calcularDebilidadesPorExamen,
  seleccionarPreguntas,
  guardarExamen,
} from '../services/examen'

type Fase = 'inicio' | 'en-curso' | 'confirmacion' | 'resultados' | 'revision'
type Modo = 'completo' | 'mini'

const CONFIG = {
  completo: { preguntas: 50, minutos: 60 },
  mini:     { preguntas: 25, minutos: 30 },
} as const

export function Examen() {
  const { progreso, refrescar } = useProgress()
  const [fase, setFase] = useState<Fase>('inicio')
  const [modo, setModo] = useState<Modo>('completo')
  const [preguntas, setPreguntas] = useState<PreguntaExt[]>([])
  const [respuestas, setRespuestas] = useState<Record<string, number | null>>({})
  const [marcadas, setMarcadas] = useState<Set<string>>(new Set())
  const [indice, setIndice] = useState(0)
  const [tiempo, setTiempo] = useState(0)
  const [cargando, setCargando] = useState(false)
  const [resultado, setResultado] = useState<ExamenResultado | null>(null)
  const intervalo = useRef<ReturnType<typeof setInterval> | undefined>(undefined)

  useEffect(() => () => clearInterval(intervalo.current), [])

  async function iniciarExamen() {
    setCargando(true)
    const todas: PreguntaExt[] = []
    for (const m of TEMAS_META) {
      try {
        const tema = await cargarTema(m.id)
        tema.preguntas.forEach(p => todas.push({ ...p, temaId: m.id }))
      } catch { /* skip */ }
    }
    const cfg = CONFIG[modo]
    const sel = seleccionarPreguntas(todas, progreso.rendimientoPorTema, cfg.preguntas)
    const init: Record<string, number | null> = {}
    sel.forEach(p => { init[p.id] = null })
    setPreguntas(sel)
    setRespuestas(init)
    setMarcadas(new Set())
    setIndice(0)
    setTiempo(cfg.minutos * 60)
    setCargando(false)
    setFase('en-curso')
    intervalo.current = setInterval(() => {
      setTiempo(t => {
        if (t <= 1) { clearInterval(intervalo.current); finalizarExamen(sel, init); return 0 }
        return t - 1
      })
    }, 1000)
  }

  function finalizarExamen(prgs = preguntas, resps = respuestas) {
    clearInterval(intervalo.current)
    const correctasMap: Record<string, number> = {}
    prgs.forEach(p => { correctasMap[p.id] = p.correcta })
    const aciertos = prgs.filter(p => resps[p.id] === p.correcta).length
    const errores  = prgs.filter(p => resps[p.id] !== null && resps[p.id] !== p.correcta).length
    const enBlanco = prgs.filter(p => resps[p.id] === null).length
    const nota     = calcularNotaExamen(aciertos, errores)
    const porTema  = calcularDebilidadesPorExamen(
      prgs.map(p => ({ id: p.id, temaId: p.temaId })),
      resps,
      correctasMap,
    )
    const res: ExamenResultado = {
      id:               new Date().toISOString(),
      fecha:            new Date().toISOString().slice(0, 10),
      modo,
      aciertos,
      errores,
      enBlanco,
      nota,
      aprobado:         nota >= 5,
      tiempoSegundos:   CONFIG[modo].minutos * 60 - tiempo,
      preguntasIds:     prgs.map(p => p.id),
      respuestasUsuario: resps,
      resultadosPorTema: porTema,
    }
    guardarExamen(res)
    refrescar()
    setResultado(res)
    setFase('resultados')
  }

  // ── Inicio ───────────────────────────────────────────────
  if (fase === 'inicio') {
    return (
      <div className="p-4 max-w-2xl mx-auto space-y-4">
        <h1 className="text-2xl font-bold pt-4">🎯 Examen Oficial CGPC</h1>
        <Card>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Selecciona el modo</h2>
          <div className="grid grid-cols-2 gap-3">
            {(['completo', 'mini'] as const).map(m => (
              <button key={m} onClick={() => setModo(m)}
                className={`p-3 rounded-xl border-2 text-left transition-colors ${
                  modo === m ? 'border-brand-500 bg-brand-50' : 'border-gray-100 hover:bg-gray-50'
                }`}>
                <p className="font-semibold text-sm">{m === 'completo' ? 'Examen completo' : 'Mini-examen'}</p>
                <p className="text-xs text-gray-500 mt-1">{CONFIG[m].preguntas} preguntas · {CONFIG[m].minutos} min</p>
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-3">
            Fórmula CGPC: acierto +0,20 pts · cada 3 errores −0,20 pts · en blanco 0 pts · mínimo 5,00
          </p>
          <button onClick={iniciarExamen} disabled={cargando}
            className="w-full mt-4 bg-brand-600 text-white rounded-xl py-3 text-sm font-semibold disabled:opacity-50">
            {cargando ? 'Preparando...' : 'Comenzar examen'}
          </button>
        </Card>
        {progreso.historialExamenes.length > 0 && (
          <Card>
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Historial reciente</h2>
            <div className="space-y-2">
              {progreso.historialExamenes.map(h => (
                <div key={h.id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{h.fecha} · {h.modo}</span>
                  <span className={`font-bold ${h.aprobado ? 'text-green-600' : 'text-red-600'}`}>
                    {h.nota.toFixed(2)} {h.aprobado ? '✅' : '❌'}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    )
  }

  // ── En curso + confirmación ──────────────────────────────
  if (fase === 'en-curso' || fase === 'confirmacion') {
    const mins = String(Math.floor(tiempo / 60)).padStart(2, '0')
    const segs = String(tiempo % 60).padStart(2, '0')
    const p    = preguntas[indice]
    const enBlanco = preguntas.filter(q => respuestas[q.id] === null).length
    return (
      <div className="flex flex-col h-full">
        <header className="bg-white border-b px-4 py-3 sticky top-0 z-10 flex justify-between items-center">
          <span className="text-sm font-medium text-gray-600">{indice + 1}/{preguntas.length}</span>
          <span className={`font-mono font-bold ${tiempo < 300 ? 'text-red-600' : 'text-brand-600'}`}>
            ⏱ {mins}:{segs}
          </span>
          <button onClick={() => setFase('confirmacion')} className="text-xs text-gray-400 underline">
            Entregar
          </button>
        </header>
        {fase === 'confirmacion' && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-3 text-center">
              <p className="font-bold text-lg">¿Entregar examen?</p>
              {enBlanco > 0 && (
                <p className="text-sm text-orange-600">Tienes {enBlanco} preguntas sin responder.</p>
              )}
              <p className="text-xs text-gray-500">Las preguntas en blanco no penalizan.</p>
              <button onClick={() => finalizarExamen()}
                className="w-full bg-brand-600 text-white rounded-xl py-2 font-semibold">
                Sí, entregar
              </button>
              <button onClick={() => setFase('en-curso')}
                className="w-full border border-gray-200 rounded-xl py-2 text-sm">
                Seguir revisando
              </button>
            </div>
          </div>
        )}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 max-w-2xl mx-auto w-full">
          {marcadas.has(p.id) && <p className="text-xs text-orange-500 font-medium">📌 Marcada para revisar</p>}
          <p className="text-sm font-medium leading-relaxed">{p.enunciado}</p>
          {p.opciones.map((op, j) => (
            <label key={j}
              className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-colors ${
                respuestas[p.id] === j ? 'border-brand-500 bg-brand-50' : 'border-gray-100 hover:bg-gray-50'
              }`}>
              <input type="radio" checked={respuestas[p.id] === j}
                onChange={() => setRespuestas(r => ({ ...r, [p.id]: j }))} />
              <span className="text-sm">{op}</span>
            </label>
          ))}
          <div className="flex gap-2 pt-2">
            <button onClick={() => setMarcadas(m => {
              const next = new Set(m); next.has(p.id) ? next.delete(p.id) : next.add(p.id); return next
            })} className="border border-orange-200 text-orange-600 rounded-xl px-3 py-2 text-xs">
              {marcadas.has(p.id) ? '📌 Marcada' : '📌 Marcar'}
            </button>
            {indice > 0 && (
              <button onClick={() => setIndice(i => i - 1)}
                className="flex-1 border border-gray-200 rounded-xl py-2 text-sm">← Anterior</button>
            )}
            {indice < preguntas.length - 1
              ? <button onClick={() => setIndice(i => i + 1)}
                  className="flex-1 bg-brand-600 text-white rounded-xl py-2 text-sm font-semibold">Siguiente →</button>
              : <button onClick={() => setFase('confirmacion')}
                  className="flex-1 bg-green-600 text-white rounded-xl py-2 text-sm font-semibold">✅ Entregar</button>
            }
          </div>
          <div className="flex flex-wrap gap-1 pt-2">
            {preguntas.map((q, i) => (
              <button key={q.id} onClick={() => setIndice(i)}
                className={`w-7 h-7 text-xs rounded font-medium ${
                  i === indice ? 'bg-brand-600 text-white' :
                  marcadas.has(q.id) ? 'bg-orange-100 text-orange-700' :
                  respuestas[q.id] !== null ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                }`}>{i + 1}</button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ── Resultados ───────────────────────────────────────────
  if (fase === 'resultados' && resultado) {
    const mins = String(Math.floor(resultado.tiempoSegundos / 60)).padStart(2, '0')
    const segs = String(resultado.tiempoSegundos % 60).padStart(2, '0')
    const topErrores = Object.entries(resultado.resultadosPorTema)
      .filter(([, r]) => r.errores > 0)
      .sort(([, a], [, b]) => b.errores - a.errores)
      .slice(0, 3)
    return (
      <div className="p-4 max-w-2xl mx-auto space-y-4">
        <h2 className="text-xl font-bold pt-4">Resultado del examen</h2>
        <Card className="text-center">
          <p className={`text-5xl font-bold ${resultado.aprobado ? 'text-green-600' : 'text-red-600'}`}>
            {resultado.nota.toFixed(2)}
          </p>
          <p className="text-gray-500 text-sm mt-1">
            {resultado.aprobado ? '✅ APROBADO' : '❌ SUSPENSO'} · mínimo 5,00
          </p>
          <div className="flex justify-center gap-6 mt-4 text-sm">
            <span>✅ {resultado.aciertos}</span>
            <span>❌ {resultado.errores}</span>
            <span>⬜ {resultado.enBlanco}</span>
          </div>
          <p className="text-xs text-gray-400 mt-2">⏱ {mins}:{segs} empleados</p>
        </Card>
        {topErrores.length > 0 && (
          <Card>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Temas con más fallos</h3>
            {topErrores.map(([temaId, r]) => {
              const meta = TEMAS_META.find(m => m.id === Number(temaId))
              return (
                <div key={temaId} className="flex justify-between text-sm py-1">
                  <span className="text-gray-700 truncate">T{temaId} {meta?.titulo.slice(0, 30)}</span>
                  <span className="text-red-500 font-medium ml-2">{r.errores} errores</span>
                </div>
              )
            })}
          </Card>
        )}
        <button onClick={() => setFase('revision')}
          className="w-full bg-brand-600 text-white rounded-xl py-3 text-sm font-semibold">
          Ver todas las respuestas
        </button>
        <button onClick={() => setFase('inicio')}
          className="w-full border border-gray-200 rounded-xl py-3 text-sm">
          Volver al inicio
        </button>
      </div>
    )
  }

  // ── Revisión ─────────────────────────────────────────────
  if (fase === 'revision' && resultado) {
    return (
      <div className="p-4 max-w-2xl mx-auto space-y-4">
        <div className="flex items-center gap-3 pt-4">
          <button onClick={() => setFase('resultados')} className="text-gray-400 text-sm underline">← Resultado</button>
          <h2 className="text-xl font-bold">Revisión</h2>
        </div>
        {preguntas.map((p, i) => {
          const elegida  = resultado.respuestasUsuario[p.id]
          const correcta = p.correcta
          const color = elegida === null ? 'border-gray-200'
            : elegida === correcta ? 'border-green-400 bg-green-50' : 'border-red-400 bg-red-50'
          return (
            <div key={p.id} className={`rounded-2xl border p-4 space-y-2 ${color}`}>
              <p className="text-xs text-gray-400 font-medium">Pregunta {i + 1}</p>
              <p className="text-sm font-medium">{p.enunciado}</p>
              {p.opciones.map((op, j) => (
                <p key={j} className={`text-sm px-3 py-1 rounded-lg ${
                  j === correcta ? 'bg-green-100 text-green-800 font-semibold' :
                  j === elegida  ? 'bg-red-100 text-red-800' : 'text-gray-600'
                }`}>
                  {j === correcta ? '✅' : j === elegida ? '❌' : '○'} {op}
                </p>
              ))}
              <p className="text-xs text-gray-500 italic">{p.explicacion}</p>
            </div>
          )
        })}
        <button onClick={() => setFase('inicio')}
          className="w-full border border-gray-200 rounded-xl py-3 text-sm">
          Volver al inicio
        </button>
      </div>
    )
  }

  return null
}
```

- [ ] **Step 2: Arrancar el servidor de desarrollo y probar manualmente**

```bash
npm run dev
```

Navegar a `/examen` y verificar:
- Selector de modo funciona (completo / mini)
- El examen arranca, el cronómetro cuenta hacia atrás
- Mini-mapa de botones numerados permite saltar entre preguntas
- Botón 📌 marca/desmarca preguntas
- Diálogo de confirmación aparece al entregar
- Pantalla de resultados muestra nota calculada correctamente
- Pantalla de revisión muestra verde/rojo/gris por opción

- [ ] **Step 3: Commit**

```bash
git add src/pages/Examen.tsx
git commit -m "feat: add Examen page with official CGPC format (50q/60min)"
```

---

## Task 4: Servicio `adaptativo.ts` + tests

**Files:**
- Create: `src/services/adaptativo.ts`
- Create: `tests/services/adaptativo.test.ts`

- [ ] **Step 1: Escribir los tests en `tests/services/adaptativo.test.ts`**

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { calcularDebilidades, generarSesionDiaria, totalPreguntasRespondidas } from '../../src/services/adaptativo'
import type { Progreso } from '../../src/types'

beforeEach(() => localStorage.clear())

const rendimiento: Progreso['rendimientoPorTema'] = {
  '5':  { aciertos: 3,  errores: 7,  total: 10 }, // 30%
  '12': { aciertos: 5,  errores: 5,  total: 10 }, // 50%
  '7':  { aciertos: 8,  errores: 2,  total: 10 }, // 80%
  '1':  { aciertos: 1,  errores: 0,  total: 2  }, // total < 3, ignorar
}

describe('calcularDebilidades', () => {
  it('ordena de menor a mayor % aciertos', () => {
    const ids = calcularDebilidades(rendimiento)
    expect(ids[0]).toBe(5)
    expect(ids[1]).toBe(12)
    expect(ids[2]).toBe(7)
  })
  it('excluye temas con menos de 3 preguntas respondidas', () => {
    expect(calcularDebilidades(rendimiento)).not.toContain(1)
  })
  it('devuelve array vacío si no hay datos suficientes', () => {
    expect(calcularDebilidades({})).toEqual([])
  })
  it('limita a 5 resultados por defecto', () => {
    const muchos: Progreso['rendimientoPorTema'] = {}
    for (let i = 1; i <= 10; i++) {
      muchos[String(i)] = { aciertos: i, errores: 10 - i, total: 10 }
    }
    expect(calcularDebilidades(muchos).length).toBe(5)
  })
})

describe('generarSesionDiaria', () => {
  it('devuelve sesión con fecha correcta y completada=false', () => {
    const hoy = new Date().toISOString().slice(0, 10)
    const sesion = generarSesionDiaria(rendimiento, {}, hoy)
    expect(sesion.fecha).toBe(hoy)
    expect(sesion.completada).toBe(false)
    expect(Array.isArray(sesion.flashcardIds)).toBe(true)
    expect(Array.isArray(sesion.preguntaIds)).toBe(true)
  })
})

describe('totalPreguntasRespondidas', () => {
  it('suma los totales de todos los temas', () => {
    expect(totalPreguntasRespondidas(rendimiento)).toBe(32) // 10+10+10+2
  })
  it('devuelve 0 si no hay datos', () => {
    expect(totalPreguntasRespondidas({})).toBe(0)
  })
})
```

- [ ] **Step 2: Verificar que el test falla**

```bash
npx vitest run tests/services/adaptativo.test.ts
```

Expected: FAIL con "Cannot find module '../../src/services/adaptativo'"

- [ ] **Step 3: Implementar `src/services/adaptativo.ts`**

```typescript
import type { Progreso } from '../types'
import { getProgreso, saveProgreso } from './storage'
import { flashcardsPendientesHoy } from './spaced-repetition'

// ── Cálculo de debilidades ──────────────────────────────────
export function calcularDebilidades(
  rendimiento: Progreso['rendimientoPorTema'],
  limite = 5,
): number[] {
  return Object.entries(rendimiento)
    .filter(([, r]) => r.total >= 3)
    .sort(([, a], [, b]) => (a.aciertos / a.total) - (b.aciertos / b.total))
    .slice(0, limite)
    .map(([id]) => Number(id))
}

// ── Total preguntas respondidas ─────────────────────────────
export function totalPreguntasRespondidas(
  rendimiento: Progreso['rendimientoPorTema'],
): number {
  return Object.values(rendimiento).reduce((sum, r) => sum + r.total, 0)
}

// ── Generar sesión diaria ───────────────────────────────────
export function generarSesionDiaria(
  rendimiento: Progreso['rendimientoPorTema'],
  estadosFlashcards: Progreso['flashcards'],
  fecha: string,
): NonNullable<Progreso['sesionDiaria']> {
  const temasDebiles = calcularDebilidades(rendimiento, 3)
  const pendientesHoy = flashcardsPendientesHoy(estadosFlashcards)
  // Flashcards de temas débiles primero
  const deTemasDebiles = pendientesHoy.filter(id =>
    temasDebiles.some(temaId => id.startsWith(`t${String(temaId).padStart(2, '0')}`))
  )
  const resto = pendientesHoy.filter(id => !deTemasDebiles.includes(id))
  const flashcardIds = [...deTemasDebiles, ...resto].slice(0, 10)
  // Guardar temaIds como "tema:N" para cargar dinámicamente en la página
  const preguntaIds = temasDebiles.map(id => `tema:${id}`)
  return { fecha, flashcardIds, preguntaIds, completada: false }
}

// ── Obtener o crear sesión de hoy ───────────────────────────
export function obtenerSesionHoy(): NonNullable<Progreso['sesionDiaria']> {
  const p   = getProgreso()
  const hoy = new Date().toISOString().slice(0, 10)
  if (p.sesionDiaria?.fecha === hoy) return p.sesionDiaria
  const nueva = generarSesionDiaria(p.rendimientoPorTema, p.flashcards, hoy)
  p.sesionDiaria = nueva
  saveProgreso(p)
  return nueva
}

// ── Marcar sesión como completada ───────────────────────────
export function completarSesionDiaria(): void {
  const p   = getProgreso()
  const hoy = new Date().toISOString().slice(0, 10)
  if (!p.sesionDiaria) return
  p.sesionDiaria.completada = true
  if (p.racha.ultimoEstudio !== hoy) {
    const ayer = new Date()
    ayer.setDate(ayer.getDate() - 1)
    const fueAyer = p.racha.ultimoEstudio === ayer.toISOString().slice(0, 10)
    p.racha.dias = fueAyer ? p.racha.dias + 1 : 1
    p.racha.ultimoEstudio = hoy
  }
  saveProgreso(p)
}
```

- [ ] **Step 4: Verificar que los tests pasan**

```bash
npx vitest run tests/services/adaptativo.test.ts
```

Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
git add src/services/adaptativo.ts tests/services/adaptativo.test.ts
git commit -m "feat: add adaptativo service (debilidades + sesion diaria)"
```

---

## Task 5: Componente `PanelDebilidades` + actualizar Dashboard y Estadísticas

**Files:**
- Create: `src/components/ui/PanelDebilidades.tsx`
- Modify: `src/pages/Dashboard.tsx`
- Modify: `src/pages/Estadisticas.tsx`

- [ ] **Step 1: Crear `src/components/ui/PanelDebilidades.tsx`**

```typescript
import { useNavigate } from 'react-router-dom'
import { Card } from './Card'
import { ProgressBar } from './ProgressBar'
import { TEMAS_META } from '../../data/topics'
import { calcularDebilidades, totalPreguntasRespondidas } from '../../services/adaptativo'
import type { Progreso } from '../../types'

interface Props {
  rendimiento: Progreso['rendimientoPorTema']
}

export function PanelDebilidades({ rendimiento }: Props) {
  const navigate = useNavigate()
  const total    = totalPreguntasRespondidas(rendimiento)
  const debiles  = calcularDebilidades(rendimiento, 5)

  if (total < 10 || debiles.length === 0) return null

  return (
    <Card>
      <h2 className="text-sm font-semibold text-gray-700 mb-3">📊 Tus puntos débiles</h2>
      <div className="space-y-3">
        {debiles.map(temaId => {
          const r    = rendimiento[String(temaId)]!
          const pct  = Math.round((r.aciertos / r.total) * 100)
          const meta = TEMAS_META.find(m => m.id === temaId)
          return (
            <div key={temaId}>
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>T{temaId} — {meta?.titulo.slice(0, 28) ?? '...'}</span>
                <span className={pct < 50 ? 'text-red-500 font-medium' : 'text-orange-500'}>
                  {pct}% ⚠️
                </span>
              </div>
              <ProgressBar value={pct} color={pct < 50 ? 'orange' : 'blue'} />
            </div>
          )
        })}
      </div>
      <button onClick={() => navigate('/sesion-diaria')}
        className="w-full mt-3 text-brand-600 text-sm font-medium underline text-left">
        → Ir a sesión de hoy
      </button>
    </Card>
  )
}
```

- [ ] **Step 2: Actualizar `src/pages/Dashboard.tsx`**

Añadir imports después de los existentes (línea 9, después de `import { temasPrioritarios... }`):

```typescript
import { PanelDebilidades } from '../components/ui/PanelDebilidades'
import { obtenerSesionHoy } from '../services/adaptativo'
```

Dentro de la función `Dashboard`, añadir después de la línea `const prioridad = temasPrioritarios(...)`:

```typescript
const sesionHoy = obtenerSesionHoy()
```

En el JSX, añadir después del bloque `<div className="grid grid-cols-2 gap-3">...</div>` (las tarjetas de Ver temario y Simulacro):

```typescript
<Card
  onClick={() => navigate('/sesion-diaria')}
  className={`border-2 cursor-pointer ${
    sesionHoy.completada
      ? 'border-green-400 bg-green-50'
      : 'border-brand-300 bg-brand-50'
  }`}
>
  <div className="flex items-center gap-3">
    <span className="text-3xl">{sesionHoy.completada ? '✅' : '⚡'}</span>
    <div>
      <p className="text-sm font-semibold">
        {sesionHoy.completada ? 'Sesión completada' : 'Sesión de hoy'}
      </p>
      <p className="text-xs text-gray-500">
        {sesionHoy.completada ? '¡Bien hecho! Hasta mañana.' : 'Flashcards + mini-test adaptativo'}
      </p>
    </div>
  </div>
</Card>

<PanelDebilidades rendimiento={progreso.rendimientoPorTema} />
```

- [ ] **Step 3: Actualizar `src/pages/Estadisticas.tsx`**

Añadir import después de los existentes:

```typescript
import { PanelDebilidades } from '../components/ui/PanelDebilidades'
```

En el JSX, añadir justo después de `<h1 className="text-2xl font-bold pt-4">📊 Estadísticas</h1>`:

```typescript
<PanelDebilidades rendimiento={progreso.rendimientoPorTema} />
```

- [ ] **Step 4: Probar manualmente**

```bash
npm run dev
```

Verificar:
- Dashboard muestra tarjeta "Sesión de hoy" (enlaza a `/sesion-diaria`)
- `PanelDebilidades` NO aparece en Dashboard ni Estadísticas (estado inicial sin datos)
- Estadísticas tiene el panel en la parte superior

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/PanelDebilidades.tsx src/pages/Dashboard.tsx src/pages/Estadisticas.tsx
git commit -m "feat: add PanelDebilidades, update Dashboard and Estadisticas"
```

---

## Task 6: Página `SesionDiaria.tsx`

**Files:**
- Create: `src/pages/SesionDiaria.tsx`

- [ ] **Step 1: Crear `src/pages/SesionDiaria.tsx`**

```typescript
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProgress } from '../hooks/useProgress'
import { Card } from '../components/ui/Card'
import { cargarTema, TEMAS_META } from '../data/topics'
import { responderFlashcard } from '../services/spaced-repetition'
import { obtenerSesionHoy, completarSesionDiaria, calcularDebilidades } from '../services/adaptativo'
import { actualizarRendimientoTema } from '../services/examen'
import type { Flashcard, PreguntaExt } from '../types'

type Fase = 'cargando' | 'flashcards' | 'minitest' | 'completada'

export function SesionDiaria() {
  const navigate = useNavigate()
  const { progreso, refrescar } = useProgress()
  const [fase, setFase] = useState<Fase>('cargando')
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [preguntas, setPreguntas] = useState<PreguntaExt[]>([])
  const [fcIndice, setFcIndice] = useState(0)
  const [fcVerRespuesta, setFcVerRespuesta] = useState(false)
  const [pIndice, setPIndice] = useState(0)
  const [respuestas, setRespuestas] = useState<(number | null)[]>([])
  const [mostrandoExplicacion, setMostrandoExplicacion] = useState(false)

  useEffect(() => {
    async function cargar() {
      const sesion = obtenerSesionHoy()
      if (sesion.completada) { setFase('completada'); return }

      // Cargar flashcards pendientes
      const fcs: Flashcard[] = []
      for (const meta of TEMAS_META) {
        try {
          const tema = await cargarTema(meta.id)
          tema.flashcards
            .filter(c => sesion.flashcardIds.includes(c.id))
            .forEach(c => fcs.push(c))
        } catch { /* skip */ }
      }

      // Cargar preguntas de temas débiles (hasta 10)
      const temasDebiles = calcularDebilidades(progreso.rendimientoPorTema, 3)
      const prgs: PreguntaExt[] = []
      for (const temaId of temasDebiles) {
        try {
          const tema = await cargarTema(temaId)
          const shuffled = [...tema.preguntas].sort(() => Math.random() - 0.5).slice(0, 4)
          shuffled.forEach(p => prgs.push({ ...p, temaId }))
        } catch { /* skip */ }
      }
      const pregSel = prgs.slice(0, 10)

      setFlashcards(fcs)
      setPreguntas(pregSel)
      setRespuestas(new Array(pregSel.length).fill(null))
      setFase(fcs.length > 0 ? 'flashcards' : pregSel.length > 0 ? 'minitest' : 'completada')
      if (fcs.length === 0 && pregSel.length === 0) { completarSesionDiaria(); refrescar() }
    }
    cargar()
  }, [])

  function responderFC(cal: 'facil' | 'dudoso' | 'dificil') {
    if (flashcards[fcIndice]) responderFlashcard(flashcards[fcIndice].id, cal)
    if (fcIndice + 1 >= flashcards.length) {
      if (preguntas.length > 0) setFase('minitest')
      else { completarSesionDiaria(); refrescar(); setFase('completada') }
    } else {
      setFcIndice(i => i + 1)
      setFcVerRespuesta(false)
    }
  }

  function responderPregunta(opcion: number) {
    setRespuestas(r => { const n = [...r]; n[pIndice] = opcion; return n })
    setMostrandoExplicacion(true)
  }

  function siguientePregunta() {
    setMostrandoExplicacion(false)
    if (pIndice + 1 >= preguntas.length) {
      // Calcular y guardar rendimiento por tema
      const porTema: Record<number, { aciertos: number; errores: number; total: number }> = {}
      preguntas.forEach((p, i) => {
        if (!porTema[p.temaId]) porTema[p.temaId] = { aciertos: 0, errores: 0, total: 0 }
        porTema[p.temaId].total++
        if (respuestas[i] === p.correcta) porTema[p.temaId].aciertos++
        else if (respuestas[i] !== null) porTema[p.temaId].errores++
      })
      Object.entries(porTema).forEach(([id, r]) =>
        actualizarRendimientoTema(Number(id), r.aciertos, r.errores, r.total)
      )
      completarSesionDiaria()
      refrescar()
      setFase('completada')
    } else {
      setPIndice(i => i + 1)
    }
  }

  if (fase === 'cargando') {
    return <div className="flex justify-center py-16 text-gray-400">Preparando sesión...</div>
  }

  if (fase === 'completada') {
    const aciertos = preguntas.filter((p, i) => respuestas[i] === p.correcta).length
    return (
      <div className="p-4 max-w-2xl mx-auto text-center py-12 space-y-4">
        <div className="text-6xl">🎉</div>
        <h1 className="text-2xl font-bold">¡Sesión completada!</h1>
        {preguntas.length > 0 && (
          <p className="text-gray-600">
            Mini-test: <span className="font-bold text-brand-600">{aciertos}/{preguntas.length}</span> correctas
          </p>
        )}
        <p className="text-gray-500 text-sm">
          Racha: <span className="font-semibold text-brand-600">{progreso.racha.dias} días 🔥</span>
        </p>
        <p className="text-xs text-gray-400">Vuelve mañana para la siguiente sesión</p>
        <button onClick={() => navigate('/')}
          className="w-full bg-brand-600 text-white rounded-xl py-3 text-sm font-semibold">
          Volver al inicio
        </button>
      </div>
    )
  }

  if (fase === 'flashcards') {
    const card = flashcards[fcIndice]
    return (
      <div className="p-4 max-w-2xl mx-auto space-y-4">
        <h1 className="text-lg font-bold pt-4">⚡ Sesión de hoy</h1>
        <p className="text-xs text-gray-400">Flashcards {fcIndice + 1}/{flashcards.length}</p>
        <div onClick={() => setFcVerRespuesta(true)}
          className="min-h-48 bg-white border border-gray-100 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer hover:shadow-md transition-shadow text-center">
          <p className="text-sm font-medium text-gray-800">{card.pregunta}</p>
          {!fcVerRespuesta
            ? <p className="text-xs text-gray-400 mt-4">Toca para ver la respuesta</p>
            : <p className="text-sm text-brand-700 font-semibold mt-4 border-t pt-4 w-full">{card.respuesta}</p>
          }
        </div>
        {fcVerRespuesta && (
          <div className="grid grid-cols-3 gap-2">
            {(['dificil', 'dudoso', 'facil'] as const).map(cal => (
              <button key={cal} onClick={() => responderFC(cal)}
                className={`py-2 rounded-xl text-sm font-semibold ${
                  cal === 'dificil' ? 'bg-red-100 text-red-700' :
                  cal === 'dudoso'  ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'
                }`}>
                {cal === 'dificil' ? '😓 Difícil' : cal === 'dudoso' ? '🤔 Dudoso' : '😊 Fácil'}
              </button>
            ))}
          </div>
        )}
        {preguntas.length > 0 && (
          <button onClick={() => setFase('minitest')} className="w-full text-xs text-gray-400 underline">
            Saltar a mini-test →
          </button>
        )}
      </div>
    )
  }

  // fase === 'minitest'
  const p = preguntas[pIndice]
  const respActual = respuestas[pIndice]
  return (
    <div className="p-4 max-w-2xl mx-auto space-y-4">
      <h1 className="text-lg font-bold pt-4">⚡ Sesión de hoy — Mini-test</h1>
      <p className="text-xs text-gray-400">{pIndice + 1}/{preguntas.length} preguntas</p>
      <p className="text-sm font-medium leading-relaxed">{p.enunciado}</p>
      {p.opciones.map((op, j) => {
        let cls = 'border-gray-100 hover:bg-gray-50'
        if (mostrandoExplicacion) {
          if (j === p.correcta) cls = 'border-green-400 bg-green-50'
          else if (j === respActual) cls = 'border-red-400 bg-red-50'
        } else if (respActual === j) {
          cls = 'border-brand-500 bg-brand-50'
        }
        return (
          <label key={j}
            className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-colors ${cls}`}>
            <input type="radio" checked={respActual === j} disabled={mostrandoExplicacion}
              onChange={() => responderPregunta(j)} />
            <span className="text-sm">{op}</span>
          </label>
        )
      })}
      {mostrandoExplicacion && (
        <>
          <Card className="bg-blue-50 border-blue-200">
            <p className="text-xs text-blue-800">{p.explicacion}</p>
          </Card>
          <button onClick={siguientePregunta}
            className="w-full bg-brand-600 text-white rounded-xl py-3 text-sm font-semibold">
            {pIndice + 1 < preguntas.length ? 'Siguiente →' : '✅ Finalizar sesión'}
          </button>
        </>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Probar manualmente**

```bash
npm run dev
```

Navegar a `/sesion-diaria`. Verificar:
- Si no hay flashcards pendientes ni temas débiles, muestra "Sesión completada" directamente
- Parte flashcards: flip funciona, botones fácil/dudoso/difícil avanzan
- Parte mini-test: al responder se muestra explicación, verde/rojo visible
- Al terminar aparece pantalla de completada con racha actualizada

- [ ] **Step 3: Commit**

```bash
git add src/pages/SesionDiaria.tsx
git commit -m "feat: add SesionDiaria page (flashcards + adaptive mini-test)"
```

---

## Task 7: Servicios `supabase.ts` + `sync.ts` + tests

**Files:**
- Create: `src/services/supabase.ts`
- Create: `src/services/sync.ts`
- Create: `tests/services/sync.test.ts`

### Prerrequisito manual (hacer antes de ejecutar esta tarea)

1. Crear cuenta gratuita en https://supabase.com (sin tarjeta de crédito)
2. New Project → anotar `Project URL` y clave `anon public`
3. En Supabase > SQL Editor, ejecutar:

```sql
CREATE TABLE progreso (
  user_id    uuid PRIMARY KEY REFERENCES auth.users(id),
  data       jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE progreso ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_row" ON progreso
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

4. En Vercel Dashboard > Settings > Environment Variables, añadir:
   - `VITE_SUPABASE_URL` = `https://xxxxxxxxxxxx.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

5. Crear `.env.local` en la raíz del proyecto (NO commitear — ya está en `.gitignore`):

```
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

6. Instalar la dependencia:

```bash
npm install @supabase/supabase-js
```

### Implementación

- [ ] **Step 1: Escribir los tests de merge en `tests/services/sync.test.ts`**

```typescript
import { describe, it, expect } from 'vitest'
import { mergeProgreso } from '../../src/services/sync'
import type { Progreso } from '../../src/types'

const base: Progreso = {
  temas: {},
  flashcards: {},
  racha: { dias: 0, ultimoEstudio: null },
  tiempoTotalSegundos: 0,
  notificaciones: { hora: '19:00', activas: false },
  historialExamenes: [],
  sesionDiaria: null,
  rendimientoPorTema: {},
}

describe('mergeProgreso', () => {
  it('temas: gana el que tiene más vueltas', () => {
    const local:  Progreso = { ...base, temas: { '1': { vueltas: 3, ultimaRevision: null, porcentajeAciertos: 0, teoriaLeida: false } } }
    const remoto: Progreso = { ...base, temas: { '1': { vueltas: 5, ultimaRevision: null, porcentajeAciertos: 0, teoriaLeida: false } } }
    expect(mergeProgreso(local, remoto).temas['1'].vueltas).toBe(5)
  })

  it('flashcards: gana el nivel más alto', () => {
    const local:  Progreso = { ...base, flashcards: { 'f1': { nivel: 2, intervalo: 4, proximoRepaso: '2026-05-10' } } }
    const remoto: Progreso = { ...base, flashcards: { 'f1': { nivel: 4, intervalo: 8, proximoRepaso: '2026-05-20' } } }
    expect(mergeProgreso(local, remoto).flashcards['f1'].nivel).toBe(4)
  })

  it('racha: gana el valor más alto', () => {
    const local:  Progreso = { ...base, racha: { dias: 5,  ultimoEstudio: '2026-05-02' } }
    const remoto: Progreso = { ...base, racha: { dias: 10, ultimoEstudio: '2026-05-02' } }
    expect(mergeProgreso(local, remoto).racha.dias).toBe(10)
  })

  it('historialExamenes: une sin duplicados', () => {
    const exam1 = { id: '2026-05-01T10:00:00.000Z', fecha: '2026-05-01', modo: 'completo' as const, aciertos: 30, errores: 10, enBlanco: 10, nota: 5.6, aprobado: true, tiempoSegundos: 3200, preguntasIds: [], respuestasUsuario: {}, resultadosPorTema: {} }
    const exam2 = { id: '2026-05-02T10:00:00.000Z', fecha: '2026-05-02', modo: 'mini' as const, aciertos: 15, errores: 5, enBlanco: 5, nota: 6.0, aprobado: true, tiempoSegundos: 1500, preguntasIds: [], respuestasUsuario: {}, resultadosPorTema: {} }
    const local:  Progreso = { ...base, historialExamenes: [exam1] }
    const remoto: Progreso = { ...base, historialExamenes: [exam1, exam2] }
    expect(mergeProgreso(local, remoto).historialExamenes.length).toBe(2)
  })

  it('rendimientoPorTema: suma aciertos y errores', () => {
    const local:  Progreso = { ...base, rendimientoPorTema: { '5': { aciertos: 3, errores: 2, total: 5 } } }
    const remoto: Progreso = { ...base, rendimientoPorTema: { '5': { aciertos: 4, errores: 1, total: 5 } } }
    expect(mergeProgreso(local, remoto).rendimientoPorTema['5']).toEqual({ aciertos: 7, errores: 3, total: 10 })
  })
})
```

- [ ] **Step 2: Verificar que el test falla**

```bash
npx vitest run tests/services/sync.test.ts
```

Expected: FAIL con "Cannot find module '../../src/services/sync'"

- [ ] **Step 3: Crear `src/services/supabase.ts`**

```typescript
import { createClient } from '@supabase/supabase-js'
import type { Progreso } from '../types'

const url = import.meta.env.VITE_SUPABASE_URL  as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const supabase = (url && key) ? createClient(url, key) : null

export async function enviarMagicLink(email: string): Promise<{ error: string | null }> {
  if (!supabase) return { error: 'Supabase no configurado' }
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: window.location.origin },
  })
  return { error: error?.message ?? null }
}

export async function cerrarSesion(): Promise<void> {
  await supabase?.auth.signOut()
}

export async function obtenerUsuario() {
  if (!supabase) return null
  const { data } = await supabase.auth.getUser()
  return data?.user ?? null
}

export async function cargarProgresoRemoto(): Promise<Progreso | null> {
  if (!supabase) return null
  const user = await obtenerUsuario()
  if (!user) return null
  const { data } = await supabase
    .from('progreso')
    .select('data')
    .eq('user_id', user.id)
    .single()
  return (data?.data as Progreso) ?? null
}

export async function guardarProgresoRemoto(progreso: Progreso): Promise<void> {
  if (!supabase) return
  const user = await obtenerUsuario()
  if (!user) return
  await supabase.from('progreso').upsert({
    user_id:    user.id,
    data:       progreso,
    updated_at: new Date().toISOString(),
  })
}
```

- [ ] **Step 4: Crear `src/services/sync.ts`**

```typescript
import type { Progreso } from '../types'
import { getProgreso, saveProgreso } from './storage'
import { cargarProgresoRemoto, guardarProgresoRemoto, obtenerUsuario } from './supabase'

export function mergeProgreso(local: Progreso, remoto: Progreso): Progreso {
  const merged: Progreso = structuredClone(local)

  // Temas: gana más vueltas
  for (const [id, rem] of Object.entries(remoto.temas)) {
    const loc = merged.temas[id]
    if (!loc || rem.vueltas > loc.vueltas) merged.temas[id] = rem
  }

  // Flashcards: gana nivel más alto
  for (const [id, rem] of Object.entries(remoto.flashcards)) {
    const loc = merged.flashcards[id]
    if (!loc || rem.nivel > loc.nivel) merged.flashcards[id] = rem
  }

  // Racha: gana valor más alto
  if (remoto.racha.dias > merged.racha.dias) merged.racha = remoto.racha

  // tiempoTotalSegundos: max
  merged.tiempoTotalSegundos = Math.max(local.tiempoTotalSegundos, remoto.tiempoTotalSegundos)

  // historialExamenes: unión deduplicada por id, últimos 10
  const todos = [...merged.historialExamenes, ...remoto.historialExamenes]
  const vistos = new Set<string>()
  merged.historialExamenes = todos
    .filter(e => { if (vistos.has(e.id)) return false; vistos.add(e.id); return true })
    .sort((a, b) => b.id.localeCompare(a.id))
    .slice(0, 10)

  // sesionDiaria: más reciente
  if (remoto.sesionDiaria) {
    if (!merged.sesionDiaria || remoto.sesionDiaria.fecha > merged.sesionDiaria.fecha) {
      merged.sesionDiaria = remoto.sesionDiaria
    }
  }

  // rendimientoPorTema: suma
  for (const [id, rem] of Object.entries(remoto.rendimientoPorTema)) {
    const loc = merged.rendimientoPorTema[id]
    if (!loc) {
      merged.rendimientoPorTema[id] = { ...rem }
    } else {
      merged.rendimientoPorTema[id] = {
        aciertos: loc.aciertos + rem.aciertos,
        errores:  loc.errores  + rem.errores,
        total:    loc.total    + rem.total,
      }
    }
  }

  return merged
}

export async function sincronizar(): Promise<void> {
  const usuario = await obtenerUsuario()
  if (!usuario) return
  const local  = getProgreso()
  const remoto = await cargarProgresoRemoto()
  if (!remoto) {
    await guardarProgresoRemoto(local)
    return
  }
  const merged = mergeProgreso(local, remoto)
  saveProgreso(merged)
  await guardarProgresoRemoto(merged)
}
```

- [ ] **Step 5: Verificar que los tests de sync pasan**

```bash
npx vitest run tests/services/sync.test.ts
```

Expected: PASS (5 tests)

- [ ] **Step 6: Verificar todos los tests**

```bash
npx vitest run
```

Expected: todos los tests pasan

- [ ] **Step 7: Commit**

```bash
git add src/services/supabase.ts src/services/sync.ts tests/services/sync.test.ts package.json package-lock.json
git commit -m "feat: add Supabase client and local-first sync with merge logic"
```

---

## Task 8: Página `Perfil.tsx`

**Files:**
- Create: `src/pages/Perfil.tsx`

- [ ] **Step 1: Crear `src/pages/Perfil.tsx`**

```typescript
import { useState, useEffect } from 'react'
import { Card } from '../components/ui/Card'
import { exportarProgreso, importarProgreso } from '../services/storage'
import { enviarMagicLink, cerrarSesion, obtenerUsuario } from '../services/supabase'
import { sincronizar } from '../services/sync'
import type { User } from '@supabase/supabase-js'

export function Perfil() {
  const [usuario, setUsuario] = useState<User | null>(null)
  const [email, setEmail] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [mensaje, setMensaje] = useState<string | null>(null)
  const [ultimoSync, setUltimoSync] = useState<string | null>(null)

  useEffect(() => {
    obtenerUsuario().then(setUsuario)
  }, [])

  async function handleMagicLink() {
    if (!email.includes('@')) { setMensaje('Introduce un email válido'); return }
    setEnviando(true)
    const { error } = await enviarMagicLink(email)
    setEnviando(false)
    setMensaje(error ? `Error: ${error}` : '✅ Email enviado. Revisa tu bandeja de entrada.')
  }

  async function handleSync() {
    setSyncing(true)
    await sincronizar()
    setUltimoSync(new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }))
    setSyncing(false)
    setMensaje('✅ Sincronizado correctamente')
  }

  async function handleCerrarSesion() {
    await cerrarSesion()
    setUsuario(null)
    setMensaje('Sesión cerrada.')
  }

  function handleExportar() {
    const json = exportarProgreso()
    const blob = new Blob([json], { type: 'application/json' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `opodam-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleImportar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      try {
        importarProgreso(ev.target!.result as string)
        setMensaje('✅ Progreso importado correctamente.')
      } catch {
        setMensaje('❌ Fichero inválido.')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold pt-4">👤 Mi cuenta</h1>

      {mensaje && (
        <div className="text-sm text-brand-700 bg-brand-50 border border-brand-200 rounded-xl px-4 py-2">
          {mensaje}
        </div>
      )}

      <Card>
        {!usuario ? (
          <>
            <p className="text-sm text-gray-600 mb-3">
              Sincroniza tu progreso entre dispositivos con un magic link (sin contraseña).
            </p>
            <div className="flex gap-2">
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                onKeyDown={e => e.key === 'Enter' && handleMagicLink()}
              />
              <button onClick={handleMagicLink} disabled={enviando}
                className="bg-brand-600 text-white rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-50 whitespace-nowrap">
                {enviando ? '...' : 'Enviar enlace'}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-green-700">✅ {usuario.email}</p>
                {ultimoSync && <p className="text-xs text-gray-400">🔄 Último sync: {ultimoSync}</p>}
              </div>
              <button onClick={handleCerrarSesion} className="text-xs text-gray-400 underline">
                Cerrar sesión
              </button>
            </div>
            <button onClick={handleSync} disabled={syncing}
              className="w-full mt-3 bg-brand-600 text-white rounded-xl py-2 text-sm font-semibold disabled:opacity-50">
              {syncing ? 'Sincronizando...' : '🔄 Sincronizar ahora'}
            </button>
          </>
        )}
      </Card>

      <Card>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">💾 Copia de seguridad</h2>
        <div className="flex gap-2">
          <button onClick={handleExportar}
            className="flex-1 border border-gray-200 rounded-xl py-2 text-sm font-medium hover:bg-gray-50">
            ⬇ Exportar progreso
          </button>
          <label className="flex-1 border border-gray-200 rounded-xl py-2 text-sm font-medium hover:bg-gray-50 text-center cursor-pointer">
            ⬆ Importar progreso
            <input type="file" accept=".json" onChange={handleImportar} className="hidden" />
          </label>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          El backup incluye todo tu progreso, flashcards y resultados de exámenes.
        </p>
      </Card>
    </div>
  )
}
```

- [ ] **Step 2: Añadir auto-sync en `src/App.tsx`**

Añadir imports al inicio del fichero:

```typescript
import { useEffect } from 'react'
import { sincronizar } from './services/sync'
```

Dentro de la función `App`, añadir antes del `return`:

```typescript
useEffect(() => {
  sincronizar().catch(() => { /* sin conexión, ignorar */ })
  const onVisible = () => {
    if (document.visibilityState === 'visible') sincronizar().catch(() => {})
  }
  document.addEventListener('visibilitychange', onVisible)
  return () => document.removeEventListener('visibilitychange', onVisible)
}, [])
```

- [ ] **Step 3: Probar manualmente**

```bash
npm run dev
```

Navegar a `/perfil`. Verificar:
- Formulario de email visible cuando no hay sesión
- Botón Exportar descarga un fichero `opodam-backup-YYYY-MM-DD.json`
- Botón Importar permite subir el fichero y restaura el progreso
- (Para probar magic link se necesita `.env.local` configurado con credenciales de Supabase)

- [ ] **Step 4: Commit**

```bash
git add src/pages/Perfil.tsx src/App.tsx
git commit -m "feat: add Perfil page with magic link, sync, and JSON backup"
```

---

## Task 9: Routing y navegación

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/layout/BottomNav.tsx`
- Modify: `src/components/layout/SideNav.tsx`

- [ ] **Step 1: Añadir imports y rutas en `src/App.tsx`**

Añadir imports después de los existentes:

```typescript
import { Examen } from './pages/Examen'
import { SesionDiaria } from './pages/SesionDiaria'
import { Perfil } from './pages/Perfil'
```

Dentro del bloque `<Route element={<Layout />}>`, añadir después de la ruta de `estadisticas`:

```typescript
<Route path="examen" element={<Examen />} />
<Route path="sesion-diaria" element={<SesionDiaria />} />
<Route path="perfil" element={<Perfil />} />
```

- [ ] **Step 2: Actualizar `src/components/layout/BottomNav.tsx`**

Reemplazar el array `LINKS` completo:

```typescript
const LINKS = [
  { to: '/',             label: 'Inicio',     icon: '🏠' },
  { to: '/temario',      label: 'Temario',    icon: '📚' },
  { to: '/examen',       label: 'Examen',     icon: '🎯' },
  { to: '/flashcards',   label: 'Flashcards', icon: '🃏' },
  { to: '/estadisticas', label: 'Stats',      icon: '📊' },
  { to: '/perfil',       label: 'Perfil',     icon: '👤' },
]
```

- [ ] **Step 3: Actualizar `src/components/layout/SideNav.tsx`**

Reemplazar el array `LINKS` completo:

```typescript
const LINKS = [
  { to: '/',             label: 'Inicio',       icon: '🏠' },
  { to: '/temario',      label: 'Temario',      icon: '📚' },
  { to: '/flashcards',   label: 'Flashcards',   icon: '🃏' },
  { to: '/tests',        label: 'Tests',        icon: '📝' },
  { to: '/examen',       label: 'Examen',       icon: '🎯' },
  { to: '/estadisticas', label: 'Estadísticas', icon: '📊' },
  { to: '/perfil',       label: 'Perfil',       icon: '👤' },
]
```

- [ ] **Step 4: Verificar navegación completa**

```bash
npm run dev
```

Verificar:
- BottomNav muestra 6 iconos en móvil
- SideNav muestra todos los enlaces en escritorio
- `/examen`, `/sesion-diaria`, `/perfil` cargan correctamente
- Rutas existentes (`/`, `/temario`, `/flashcards`, `/estadisticas`) siguen funcionando

- [ ] **Step 5: Build de producción**

```bash
npm run build
```

Expected: build sin errores TypeScript ni de bundling

- [ ] **Step 6: Todos los tests**

```bash
npx vitest run
```

Expected: PASS (todos los tests existentes + 3 nuevos ficheros)

- [ ] **Step 7: Commit final y push**

```bash
git add src/App.tsx src/components/layout/BottomNav.tsx src/components/layout/SideNav.tsx
git commit -m "feat: add routing and navigation for examen, sesion-diaria, perfil"
git push
```

Vercel desplegará automáticamente.

---

## Checklist de verificación final

- [ ] `npm run build` pasa sin errores
- [ ] `npx vitest run` — todos los tests pasan
- [ ] `/examen` — examen completo de principio a fin, nota calculada correctamente (fórmula CGPC), aparece en historial
- [ ] `/sesion-diaria` — flashcards + mini-test funcionan, racha se actualiza al completar
- [ ] Dashboard — tarjeta "Sesión de hoy" visible, `PanelDebilidades` aparece tras ≥10 preguntas respondidas
- [ ] `/estadisticas` — `PanelDebilidades` en la parte superior
- [ ] `/perfil` — exportar descarga JSON, importar restaura progreso
- [ ] Variables `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` añadidas en Vercel para producción
