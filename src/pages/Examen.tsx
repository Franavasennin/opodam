import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { obtenerTopics } from '../data/topics'
import { useProgress } from '../hooks/useProgress'
import type { PreguntaExt, ExamenResultado } from '../types'
import { getPreguntaCorrecta } from '../types'
import {
  calcularNotaExamen,
  calcularDebilidadesPorExamen,
  seleccionarPreguntas,
  guardarExamen,
} from '../services/examen'
import { registrarLote } from '../services/errores'
import { getPenalizacion, describirPenalizacion } from '../services/nota'

type Fase = 'inicio' | 'en-curso' | 'confirmacion' | 'resultados' | 'revision'
type Modo = 'completo' | 'mini'

const CONFIG = {
  completo: { preguntas: 50, minutos: 60 },
  mini:     { preguntas: 25, minutos: 30 },
} as const

const LETRAS = ['A', 'B', 'C', 'D', 'E', 'F']

import { TestTopbar, ReviewOption } from '../components/test/Shared'



export function Examen() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const pen = getPenalizacion(slug ?? 'cgpc')
  const { cargarTema, TEMAS_META } = obtenerTopics(slug ?? 'cgpc')
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
  // Refs siempre apuntando al estado más reciente, para que el temporizador
  // lea los valores vivos (evita la trampa de la clausura obsoleta en setInterval).
  const respuestasRef = useRef(respuestas)
  respuestasRef.current = respuestas
  const preguntasRef = useRef(preguntas)
  preguntasRef.current = preguntas

  useEffect(() => () => clearInterval(intervalo.current), [])

  async function iniciarExamen() {
    setCargando(true)
    const todas: PreguntaExt[] = []
    // Carga en paralelo (los temas son independientes); se ignoran los que fallen.
    const resultados = await Promise.all(
      TEMAS_META.map(m => cargarTema(m.id).then(tema => ({ m, tema })).catch(() => null))
    )
    for (const r of resultados) {
      if (!r) continue
      r.tema.preguntas.forEach(p => todas.push({ ...p, temaId: r.m.id }))
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
        if (t <= 1) { clearInterval(intervalo.current); finalizarExamen(preguntasRef.current, respuestasRef.current); return 0 }
        return t - 1
      })
    }, 1000)
  }

  function finalizarExamen(prgs = preguntas, resps = respuestas) {
    clearInterval(intervalo.current)
    const correctasMap: Record<string, number> = {}
    prgs.forEach(p => { correctasMap[p.id] = getPreguntaCorrecta(p) })
    const aciertos = prgs.filter(p => resps[p.id] === getPreguntaCorrecta(p)).length
    const errores  = prgs.filter(p => resps[p.id] !== null && resps[p.id] !== getPreguntaCorrecta(p)).length
    const enBlanco = prgs.filter(p => resps[p.id] === null).length
    const nota     = calcularNotaExamen(aciertos, errores, prgs.length, pen)
    // Cuaderno de errores: registra las respondidas (las en blanco se omiten)
    registrarLote(
      prgs.filter(p => resps[p.id] !== null && resps[p.id] !== undefined)
          .map(p => ({ id: p.id, temaId: p.temaId, acierto: resps[p.id] === getPreguntaCorrecta(p) }))
    )
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
      <div className="min-h-screen fade-up" style={{ background: 'var(--bg)' }}>
        <TestTopbar title="Examen oficial" />
        <main className="max-w-2xl mx-auto px-4 pt-4 pb-12" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: 10 }}>Examen evaluado</div>
            <h1 className="display" style={{ margin: 0, fontSize: 30, letterSpacing: '-0.015em' }}>
              Ponte a <span className="display-italic" style={{ color: 'var(--accent)' }}>prueba.</span>
            </h1>
          </div>
          <div className="card" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 18 }}>
            <div className="eyebrow" style={{ marginBottom: 12 }}>Selecciona el modo</div>
            <div className="grid grid-cols-2 gap-3">
              {(['completo', 'mini'] as const).map(m => {
                const sel = modo === m
                return (
                  <button key={m} onClick={() => setModo(m)}
                    style={{ padding: 14, borderRadius: 12, textAlign: 'left', cursor: 'pointer', background: sel ? 'var(--accent-soft)' : 'var(--surface-2)', border: `1.5px solid ${sel ? 'var(--accent)' : 'var(--border)'}` }}>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: 13.5, color: sel ? 'var(--accent)' : 'var(--ink)' }}>{m === 'completo' ? 'Examen completo' : 'Mini-examen'}</p>
                    <p className="num-display" style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--mute)' }}>{CONFIG[m].preguntas} preguntas · {CONFIG[m].minutos} min</p>
                  </button>
                )
              })}
            </div>
            <p style={{ fontSize: 11.5, color: 'var(--mute)', marginTop: 12, lineHeight: 1.5 }}>
              Fórmula CGPC: acierto +0,20 pts · cada 3 errores −0,20 pts · en blanco 0 pts · mínimo 5,00
            </p>
            <button onClick={iniciarExamen} disabled={cargando} className="btn-editorial btn-acc" style={{ width: '100%', marginTop: 14, opacity: cargando ? 0.5 : 1 }}>
              {cargando ? 'Preparando…' : 'Comenzar examen'}
            </button>
          </div>
          {progreso.historialExamenes.length > 0 && (
            <div className="card" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 18 }}>
              <div className="eyebrow" style={{ marginBottom: 12 }}>Historial reciente</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {progreso.historialExamenes.map(h => (
                  <div key={h.id} className="flex items-center justify-between" style={{ fontSize: 13 }}>
                    <span className="num-display" style={{ color: 'var(--mute)' }}>{h.fecha} · {h.modo}</span>
                    <span className="num-display" style={{ fontWeight: 600, color: h.aprobado ? 'var(--accent)' : 'var(--warn)' }}>{h.nota.toFixed(2)} {h.aprobado ? '✅' : '❌'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
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
      <div className="min-h-screen fade-up" style={{ background: 'var(--bg)' }}>
        <TestTopbar 
          title={<span className="num-display" style={{ fontSize: 13.5, color: 'var(--ink-soft)' }}>{indice + 1}/{preguntas.length}</span>}
          rightContent={
            <div className="flex items-center gap-4">
              <span className="num-display" style={{ fontWeight: 600, fontSize: 15, color: tiempo < 300 ? 'var(--warn)' : 'var(--accent)' }}>⏱ {mins}:{segs}</span>
              <button onClick={() => setFase('confirmacion')} style={{ background: 'none', border: 0, cursor: 'pointer', color: 'var(--mute)', fontSize: 12, textDecoration: 'underline' }}>Entregar</button>
            </div>
          }
        />
        {fase === 'confirmacion' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.45)' }}>
            <div className="card" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, padding: 24, maxWidth: 340, width: '100%', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <p className="display" style={{ margin: 0, fontSize: 22 }}>¿Entregar examen?</p>
              {enBlanco > 0 && <p style={{ margin: 0, fontSize: 13, color: 'var(--warn)' }}>Tienes {enBlanco} preguntas sin responder.</p>}
              <p style={{ margin: 0, fontSize: 12, color: 'var(--mute)' }}>Las preguntas en blanco no penalizan.</p>
              <button onClick={() => finalizarExamen()} className="btn-editorial btn-acc" style={{ width: '100%', marginTop: 4 }}>Sí, entregar</button>
              <button onClick={() => setFase('en-curso')} className="btn-editorial btn-sec" style={{ width: '100%' }}>Seguir revisando</button>
            </div>
          </div>
        )}
        <main className="max-w-2xl mx-auto px-4 pt-4 pb-12 w-full">
          <div className="card" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 16 }}>
            {marcadas.has(p.id) && <p style={{ margin: '0 0 8px', fontSize: 11.5, fontWeight: 600, color: 'var(--warn)' }}>📌 Marcada para revisar</p>}
            <p style={{ margin: '0 0 12px', fontSize: 14.5, fontWeight: 600, color: 'var(--ink)', lineHeight: 1.4 }}>{p.enunciado}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {p.opciones.map((op, j) => {
                const sel = respuestas[p.id] === j
                return (
                  <button key={j} type="button" className="opt" onClick={() => setRespuestas(r => ({ ...r, [p.id]: j }))}
                    style={sel ? { borderColor: 'var(--accent)', background: 'var(--accent-soft)', color: 'var(--accent)' } : undefined}>
                    <span style={{ width: 22, height: 22, flexShrink: 0, borderRadius: 6, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: sel ? 'var(--accent-ink)' : 'var(--mute)', background: sel ? 'var(--accent)' : 'var(--surface)', border: `1px solid ${sel ? 'var(--accent)' : 'var(--border)'}` }}>{LETRAS[j] ?? j + 1}</span>
                    <span>{op}</span>
                  </button>
                )
              })}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <button onClick={() => setMarcadas(m => {
              const next = new Set(m); if (next.has(p.id)) { next.delete(p.id) } else { next.add(p.id) }; return next
            })} className="btn-editorial btn-sec" style={{ paddingLeft: 14, paddingRight: 14, color: 'var(--warn)' }}>
              {marcadas.has(p.id) ? '📌 Marcada' : '📌 Marcar'}
            </button>
            {indice > 0 && <button onClick={() => setIndice(i => i - 1)} className="btn-editorial btn-sec" style={{ flex: 1 }}>← Anterior</button>}
            {indice < preguntas.length - 1
              ? <button onClick={() => setIndice(i => i + 1)} className="btn-editorial btn-acc" style={{ flex: 1 }}>Siguiente →</button>
              : <button onClick={() => setFase('confirmacion')} className="btn-editorial btn-acc" style={{ flex: 1 }}>Entregar</button>
            }
          </div>
          <div className="flex flex-wrap" style={{ gap: 5, marginTop: 14 }}>
            {preguntas.map((q, i) => {
              const actual = i === indice
              const marc = marcadas.has(q.id)
              const resp = respuestas[q.id] !== null
              return (
                <button key={q.id} onClick={() => setIndice(i)} className="num-display"
                  style={{
                    width: 28, height: 28, fontSize: 12, borderRadius: 7, border: '1px solid var(--border-soft)', cursor: 'pointer',
                    background: actual ? 'var(--accent)' : marc ? 'var(--warn-soft)' : resp ? 'var(--accent-soft)' : 'var(--surface-2)',
                    color: actual ? 'var(--accent-ink)' : marc ? 'var(--warn)' : resp ? 'var(--accent)' : 'var(--mute)',
                  }}>{i + 1}</button>
              )
            })}
          </div>
        </main>
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
      <div className="min-h-screen fade-up" style={{ background: 'var(--bg)' }}>
        <TestTopbar title="Resultado del examen" />
        <main className="max-w-2xl mx-auto px-4 pt-4 pb-12" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="card" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, padding: 24, textAlign: 'center' }}>
            <div className="eyebrow" style={{ marginBottom: 6 }}>Nota</div>
            <div className="num-display" style={{ fontSize: 56, lineHeight: 1, color: resultado.aprobado ? 'var(--accent)' : 'var(--warn)' }}>{resultado.nota.toFixed(2)}</div>
            <div style={{ fontSize: 12, color: 'var(--mute)', marginTop: 4 }}>{resultado.aprobado ? '✅ APROBADO' : '❌ SUSPENSO'} · mínimo 5,00</div>
            <div style={{ fontSize: 13.5, color: 'var(--ink-soft)', marginTop: 12 }}>✅ {resultado.aciertos} · ❌ {resultado.errores} · ⬜ {resultado.enBlanco}</div>
            <div className="num-display" style={{ fontSize: 11.5, color: 'var(--mute)', marginTop: 6 }}>⏱ {mins}:{segs} empleados · {describirPenalizacion(pen)}</div>
          </div>
          {resultado.errores > 0 && (
            <button onClick={() => navigate(`/oposicion/${slug}/repaso-errores`)} className="btn-editorial btn-acc" style={{ width: '100%' }}>
              🩹 Repasar las {resultado.errores} falladas ahora
            </button>
          )}
          {topErrores.length > 0 && (
            <div className="card" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 18 }}>
              <div className="eyebrow" style={{ marginBottom: 10 }}>Temas con más fallos</div>
              {topErrores.map(([temaId, r]) => {
                const meta = TEMAS_META.find(m => m.id === Number(temaId))
                return (
                  <div key={temaId} className="flex justify-between" style={{ fontSize: 13, padding: '4px 0' }}>
                    <span style={{ color: 'var(--ink-soft)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>T{temaId} {meta?.titulo.slice(0, 30)}</span>
                    <span style={{ color: 'var(--warn)', fontWeight: 600, marginLeft: 8, flexShrink: 0 }}>{r.errores} errores</span>
                  </div>
                )
              })}
            </div>
          )}
          <button onClick={() => setFase('revision')} className="btn-editorial btn-acc" style={{ width: '100%' }}>Ver todas las respuestas</button>
          <button onClick={() => setFase('inicio')} className="btn-editorial btn-sec" style={{ width: '100%' }}>Volver al inicio</button>
        </main>
      </div>
    )
  }

  // ── Revisión ─────────────────────────────────────────────
  if (fase === 'revision' && resultado) {
    return (
      <div className="min-h-screen fade-up" style={{ background: 'var(--bg)' }}>
        <TestTopbar title="Revisión" onBack={() => setFase('resultados')} />
        <main className="max-w-2xl mx-auto px-4 pt-4 pb-12" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {preguntas.map((p, i) => {
            const elegida  = resultado.respuestasUsuario[p.id]
            const correcta = getPreguntaCorrecta(p)
            const borde = elegida === null ? 'var(--border)' : elegida === correcta ? 'var(--accent)' : 'var(--warn)'
            return (
              <div key={p.id} className="card" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderLeft: `3px solid ${borde}`, borderRadius: 16, padding: 16 }}>
                <p className="num-display" style={{ margin: 0, fontSize: 11.5, color: 'var(--mute)' }}>Pregunta {i + 1}</p>
                <p style={{ margin: '6px 0 10px', fontSize: 13.5, fontWeight: 600, color: 'var(--ink)' }}>{p.enunciado}</p>
                {p.opciones.map((op, j) => {
                  const esCorr = j === correcta
                  const esEleg = j === elegida
                  const detalle = p.explicaciones?.[j] ?? (esCorr ? p.explicacion : '')
                  return (
                    <ReviewOption
                      key={j}
                      opcion={op}
                      index={j}
                      esCorrecta={esCorr}
                      esElegida={esEleg}
                      detalle={detalle}
                    />
                  )
                })}

              </div>
            )
          })}
          <button onClick={() => setFase('inicio')} className="btn-editorial btn-sec" style={{ width: '100%' }}>Volver al inicio</button>
        </main>
      </div>
    )
  }

  return null
}
