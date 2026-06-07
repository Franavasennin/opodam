import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useProgress } from '../hooks/useProgress'
import { calcularPuntuacionTest } from '../services/progress'
import { obtenerTopics } from '../data/topics'
import type { Tema } from '../types'
import { getPreguntaCorrecta } from '../types'

const LETRAS = ['A', 'B', 'C', 'D', 'E', 'F']

import { TestTopbar } from '../components/test/Shared'

export function Tests() {
  const navigate = useNavigate()
  const { slug } = useParams<{ slug: string }>()
  const { guardarTest } = useProgress()
  const { cargarTema, TEMAS_META } = obtenerTopics(slug ?? 'cgpc')
  const [temaId, setTemaId] = useState<number | null>(null)
  const [tema, setTema] = useState<Tema | null>(null)
  const [respuestas, setRespuestas] = useState<(number | null)[]>([])
  const [enviado, setEnviado] = useState(false)

  useEffect(() => {
    if (temaId === null) return
    cargarTema(temaId).then(t => {
      setTema(t)
      setRespuestas(new Array(t.preguntas.length).fill(null))
      setEnviado(false)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [temaId])

  // ── Selección de tema ──
  if (temaId === null) return (
    <div className="min-h-screen fade-up" style={{ background: 'var(--bg)' }}>
      <TestTopbar title="Tests y simulacros" onBack={() => navigate(`/oposicion/${slug}`)} />
      <main className="max-w-2xl mx-auto px-4 pt-4 pb-12">
        <div className="eyebrow" style={{ marginBottom: 10 }}>Practica preguntas</div>
        <h1 className="display" style={{ margin: '0 0 18px', fontSize: 30, letterSpacing: '-0.015em' }}>
          Elige un tema o haz un <span className="display-italic" style={{ color: 'var(--accent)' }}>simulacro.</span>
        </h1>
        <button onClick={() => navigate(`/oposicion/${slug}/tests/simulacro`)} className="hero" style={{ width: '100%', textAlign: 'left', border: 0, cursor: 'pointer', marginBottom: 18 }}>
          <div className="hero-grain" />
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ fontSize: 26 }}>🎯</span>
            <div style={{ flex: 1 }}>
              <div className="display" style={{ fontSize: 20 }}>Simulacro completo</div>
              <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>Examen cronometrado con preguntas de todos los temas</div>
            </div>
            <span style={{ opacity: 0.7 }}>›</span>
          </div>
        </button>
        <div className="stagger" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {TEMAS_META.map(m => (
            <button key={m.id} onClick={() => setTemaId(m.id)} className="card"
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '13px 14px', textAlign: 'left', cursor: 'pointer', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14 }}>
              <span className="num-display" style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--surface-2)', border: '1px solid var(--border-soft)', color: 'var(--ink-soft)', fontSize: 17, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{m.id}</span>
              <span style={{ flex: 1, minWidth: 0, fontSize: 13.5, fontWeight: 600, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.titulo}</span>
              <span style={{ color: 'var(--mute)', fontSize: 16 }}>›</span>
            </button>
          ))}
        </div>
      </main>
    </div>
  )

  if (!tema) return <div className="min-h-screen flex justify-center py-16" style={{ background: 'var(--bg)', color: 'var(--mute)' }}>Cargando…</div>

  const aciertos = respuestas.filter((r, i) => r === getPreguntaCorrecta(tema.preguntas[i])).length
  const errores  = respuestas.filter((r, i) => r !== null && r !== getPreguntaCorrecta(tema.preguntas[i])).length

  function enviar() {
    guardarTest(tema!.id, aciertos, errores, tema!.preguntas.length)
    setEnviado(true)
  }

  // ── Resultado ──
  if (enviado) return (
    <div className="min-h-screen fade-up" style={{ background: 'var(--bg)' }}>
      <TestTopbar title="Resultado" onBack={() => setTemaId(null)} />
      <main className="max-w-2xl mx-auto px-4 pt-4 pb-12" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="card" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, padding: 24, textAlign: 'center' }}>
          <div className="eyebrow" style={{ marginBottom: 6 }}>Nota equivalente</div>
          <div className="num-display" style={{ fontSize: 56, color: 'var(--accent)', lineHeight: 1 }}>
            {calcularPuntuacionTest(aciertos, errores, tema.preguntas.length).toFixed(2)}
          </div>
          <div style={{ fontSize: 12, color: 'var(--mute)', marginTop: 4 }}>sobre 10</div>
          <div style={{ fontSize: 13.5, color: 'var(--ink-soft)', marginTop: 12 }}>✅ {aciertos} aciertos · ❌ {errores} errores</div>
        </div>
        {tema.preguntas.map((p, i) => {
          const ok = respuestas[i] === getPreguntaCorrecta(p)
          return (
            <div key={i} className="card" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 16, borderLeft: `3px solid ${ok ? 'var(--accent)' : 'var(--warn)'}` }}>
              <p style={{ margin: 0, fontSize: 13.5, fontWeight: 600, color: 'var(--ink)' }}>{p.enunciado}</p>
              <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--accent)' }}>Correcta: {p.opciones[getPreguntaCorrecta(p)]}</p>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--mute)', fontStyle: 'italic' }}>{p.explicacion}</p>
            </div>
          )
        })}
        <button onClick={() => setTemaId(null)} className="btn-editorial btn-acc" style={{ width: '100%' }}>Volver</button>
      </main>
    </div>
  )

  // ── Preguntas ──
  return (
    <div className="min-h-screen fade-up" style={{ background: 'var(--bg)' }}>
      <TestTopbar 
        title={<span style={{ fontWeight: 600, fontSize: 13.5, letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tema.titulo}</span>}
        onBack={() => setTemaId(null)} 
      />
      <main className="max-w-2xl mx-auto px-4 pt-4 pb-12" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {tema.preguntas.map((p, i) => (
          <div key={i} className="card" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 16 }}>
            <p style={{ margin: '0 0 10px', fontSize: 14.5, fontWeight: 600, color: 'var(--ink)', lineHeight: 1.4 }}>
              <span className="num-display" style={{ color: 'var(--mute)', marginRight: 6 }}>{i + 1}.</span>{p.enunciado}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {p.opciones.map((op, j) => {
                const sel = respuestas[i] === j
                return (
                  <button key={j} type="button" className="opt" onClick={() => setRespuestas(r => { const n = [...r]; n[i] = j; return n })}
                    style={sel ? { borderColor: 'var(--accent)', background: 'var(--accent-soft)', color: 'var(--accent)' } : undefined}>
                    <span style={{ width: 22, height: 22, flexShrink: 0, borderRadius: 6, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: sel ? 'var(--accent-ink)' : 'var(--mute)', background: sel ? 'var(--accent)' : 'var(--surface)', border: `1px solid ${sel ? 'var(--accent)' : 'var(--border)'}` }}>{LETRAS[j] ?? j + 1}</span>
                    <span>{op}</span>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
        <button onClick={enviar} disabled={respuestas.some(r => r === null)} className="btn-editorial btn-acc" style={{ width: '100%', opacity: respuestas.some(r => r === null) ? 0.4 : 1 }}>
          Enviar respuestas
        </button>
      </main>
    </div>
  )
}
