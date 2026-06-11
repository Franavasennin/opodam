import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { calcularPuntuacionTest } from '../services/progress'
import { obtenerTopics } from '../data/topics'
import type { Pregunta } from '../types'
import { getPreguntaCorrecta } from '../types'

type PreguntaExt = Pregunta & { temaId: number }

function barajar<T>(a: T[]): T[] { return [...a].sort(() => Math.random() - 0.5) }

const DURACION = 120 * 60
const LETRAS = ['A', 'B', 'C', 'D', 'E', 'F']

const topbar: React.CSSProperties = {
  height: 52, borderBottom: '1px solid var(--border-soft)',
  background: 'color-mix(in srgb, var(--bg) 88%, transparent)', backdropFilter: 'blur(12px)',
}

export function Simulacro() {
  const navigate = useNavigate()
  const { slug } = useParams<{ slug: string }>()
  const { cargarTema, TEMAS_META } = obtenerTopics(slug ?? 'cgpc')
  const [preguntas, setPreguntas] = useState<PreguntaExt[]>([])
  const [respuestas, setRespuestas] = useState<(number | null)[]>([])
  const [indice, setIndice] = useState(0)
  const [tiempo, setTiempo] = useState(DURACION)
  const [iniciado, setIniciado] = useState(false)
  const [terminado, setTerminado] = useState(false)
  const [cargando, setCargando] = useState(true)
  const intervalo = useRef<ReturnType<typeof setInterval> | undefined>(undefined)

  useEffect(() => {
    async function cargar() {
      const todas: PreguntaExt[] = []
      // Carga en paralelo (los temas son independientes); se ignoran los que fallen.
      const resultados = await Promise.all(
        TEMAS_META.map(m => cargarTema(m.id).then(tema => ({ m, tema })).catch(() => null))
      )
      for (const r of resultados) {
        if (!r) continue
        r.tema.preguntas.forEach(p => todas.push({ ...p, temaId: r.m.id }))
      }
      const sel = barajar(todas).slice(0, 60)
      setPreguntas(sel)
      setRespuestas(new Array(sel.length).fill(null))
      setCargando(false)
    }
    cargar()
    return () => clearInterval(intervalo.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function iniciar() {
    setIniciado(true)
    intervalo.current = setInterval(() => {
      setTiempo(t => {
        if (t <= 1) { clearInterval(intervalo.current); setTerminado(true); return 0 }
        return t - 1
      })
    }, 1000)
  }

  function terminar() { clearInterval(intervalo.current); setTerminado(true) }

  if (cargando) return <div className="min-h-screen flex justify-center py-16" style={{ background: 'var(--bg)', color: 'var(--mute)' }}>Preparando simulacro…</div>

  // ── Pantalla de inicio ──
  if (!iniciado) return (
    <div className="min-h-screen fade-up" style={{ background: 'var(--bg)' }}>
      <header className="sticky top-0 z-10 flex items-center gap-3 px-4" style={topbar}>
        <button onClick={() => navigate(`/oposicion/${slug}/tests`)} style={{ background: 'none', border: 0, cursor: 'pointer', color: 'var(--ink)', fontSize: 16 }}>←</button>
        <span style={{ fontWeight: 600, fontSize: 14, letterSpacing: '-0.01em' }}>Simulacro oficial</span>
      </header>
      <main className="max-w-2xl mx-auto px-4 pt-4 pb-12">
        <div className="hero" style={{ textAlign: 'center', padding: '36px 24px' }}>
          <div className="hero-grain" />
          <div style={{ position: 'relative' }}>
            <div style={{ fontSize: 44 }}>🎯</div>
            <h1 className="display" style={{ margin: '12px 0 8px', fontSize: 30 }}>Simulacro <span className="display-italic" style={{ color: 'var(--accent)' }}>completo</span></h1>
            <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.72)', margin: 0 }}>{preguntas.length} preguntas · 120 min · −0,33 por error</p>
            <button onClick={iniciar} className="btn-editorial btn-acc" style={{ marginTop: 22 }}>Comenzar examen</button>
          </div>
        </div>
        <button onClick={() => navigate(`/oposicion/${slug}/tests`)} style={{ display: 'block', margin: '16px auto 0', background: 'none', border: 0, cursor: 'pointer', color: 'var(--mute)', fontSize: 13, textDecoration: 'underline' }}>Cancelar</button>
      </main>
    </div>
  )

  // ── Resultado ──
  if (terminado) {
    const aciertos = respuestas.filter((r, i) => preguntas[i] && r === getPreguntaCorrecta(preguntas[i])).length
    const errores  = respuestas.filter((r, i) => r !== null && preguntas[i] && r !== getPreguntaCorrecta(preguntas[i])).length
    const punt = calcularPuntuacionTest(aciertos, errores, preguntas.length)
    return (
      <div className="min-h-screen fade-up" style={{ background: 'var(--bg)' }}>
        <header className="sticky top-0 z-10 flex items-center gap-3 px-4" style={topbar}>
          <span style={{ fontWeight: 600, fontSize: 14, letterSpacing: '-0.01em' }}>Resultado del simulacro</span>
        </header>
        <main className="max-w-2xl mx-auto px-4 pt-4 pb-12" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="card" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, padding: 24, textAlign: 'center' }}>
            <div className="eyebrow" style={{ marginBottom: 6 }}>Nota equivalente</div>
            <div className="num-display" style={{ fontSize: 56, color: 'var(--accent)', lineHeight: 1 }}>{punt.toFixed(2)}</div>
            <div style={{ fontSize: 12, color: 'var(--mute)', marginTop: 4 }}>sobre 10</div>
            <div style={{ fontSize: 13.5, color: 'var(--ink-soft)', marginTop: 12 }}>✅ {aciertos} aciertos · ❌ {errores} errores · ⬜ {preguntas.length - aciertos - errores} en blanco</div>
          </div>
          <button onClick={() => navigate(`/oposicion/${slug}/estadisticas`)} className="btn-editorial btn-acc" style={{ width: '100%' }}>Ver estadísticas</button>
          <button onClick={() => navigate(`/oposicion/${slug}/tests`)} className="btn-editorial btn-sec" style={{ width: '100%' }}>Volver</button>
        </main>
      </div>
    )
  }

  // ── Examen en curso ──
  const mins = String(Math.floor(tiempo / 60)).padStart(2, '0')
  const segs = String(tiempo % 60).padStart(2, '0')
  const p = preguntas[indice]

  return (
    <div className="min-h-screen fade-up" style={{ background: 'var(--bg)' }}>
      <header className="sticky top-0 z-10 flex items-center justify-between px-4" style={topbar}>
        <span className="num-display" style={{ fontSize: 13.5, color: 'var(--ink-soft)' }}>{indice + 1}/{preguntas.length}</span>
        <span className="num-display" style={{ fontWeight: 600, fontSize: 15, color: tiempo < 600 ? 'var(--warn)' : 'var(--accent)' }}>⏱ {mins}:{segs}</span>
        <button onClick={terminar} style={{ background: 'none', border: 0, cursor: 'pointer', color: 'var(--mute)', fontSize: 12, textDecoration: 'underline' }}>Terminar</button>
      </header>
      <main className="max-w-2xl mx-auto px-4 pt-4 pb-12 w-full">
        <div className="card" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 16 }}>
          <p style={{ margin: '0 0 12px', fontSize: 14.5, fontWeight: 600, color: 'var(--ink)', lineHeight: 1.4 }}>{p.enunciado}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {p.opciones.map((op, j) => {
              const sel = respuestas[indice] === j
              return (
                <button key={j} type="button" className="opt" onClick={() => setRespuestas(r => { const n = [...r]; n[indice] = j; return n })}
                  style={sel ? { borderColor: 'var(--accent)', background: 'var(--accent-soft)', color: 'var(--accent)' } : undefined}>
                  <span style={{ width: 22, height: 22, flexShrink: 0, borderRadius: 6, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: sel ? 'var(--accent-ink)' : 'var(--mute)', background: sel ? 'var(--accent)' : 'var(--surface)', border: `1px solid ${sel ? 'var(--accent)' : 'var(--border)'}` }}>{LETRAS[j] ?? j + 1}</span>
                  <span>{op}</span>
                </button>
              )
            })}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          {indice > 0 && <button onClick={() => setIndice(i => i - 1)} className="btn-editorial btn-sec" style={{ flex: 1 }}>← Anterior</button>}
          {indice < preguntas.length - 1
            ? <button onClick={() => setIndice(i => i + 1)} className="btn-editorial btn-acc" style={{ flex: 1 }}>Siguiente →</button>
            : <button onClick={terminar} className="btn-editorial btn-acc" style={{ flex: 1 }}>Terminar</button>
          }
        </div>
      </main>
    </div>
  )
}
