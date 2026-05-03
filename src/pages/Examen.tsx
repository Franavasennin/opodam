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
    clearInterval(intervalo.current)
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
              const next = new Set(m); if (next.has(p.id)) { next.delete(p.id) } else { next.add(p.id) }; return next
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
