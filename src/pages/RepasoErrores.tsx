import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { obtenerTopics } from '../data/topics'
import { preguntasEnCuaderno, registrarLote, contarErrores, GRADUACION } from '../services/errores'
import type { PreguntaExt } from '../types'
import { getPreguntaCorrecta } from '../types'
import { TestTopbar } from '../components/test/Shared'

const LETRAS = ['A', 'B', 'C', 'D', 'E', 'F']
const MAX_SESION = 20 // preguntas por sesión de repaso

export function RepasoErrores() {
  const navigate = useNavigate()
  const { slug } = useParams<{ slug: string }>()
  const { cargarTema } = obtenerTopics(slug ?? 'cgpc')
  const [preguntas, setPreguntas] = useState<PreguntaExt[]>([])
  const [respuestas, setRespuestas] = useState<(number | null)[]>([])
  const [cargando, setCargando] = useState(true)
  const [enviado, setEnviado] = useState(false)

  useEffect(() => {
    async function cargar() {
      const entradas = preguntasEnCuaderno().slice(0, MAX_SESION)
      const temaIds = [...new Set(entradas.map(e => e.temaId))]
      // Carga en paralelo los temas implicados; se ignoran los que fallen.
      const temas = await Promise.all(
        temaIds.map(id => cargarTema(id).then(t => ({ id, t })).catch(() => null))
      )
      const porId = new Map<string, PreguntaExt>()
      for (const r of temas) {
        if (!r) continue
        for (const p of r.t.preguntas) porId.set(p.id, { ...p, temaId: r.id })
      }
      // Conserva el orden de fragilidad del cuaderno; descarta las que ya no existan.
      const sel = entradas.map(e => porId.get(e.id)).filter((p): p is PreguntaExt => !!p)
      setPreguntas(sel)
      setRespuestas(new Array(sel.length).fill(null))
      setCargando(false)
    }
    cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (cargando) return <div className="min-h-screen flex justify-center py-16" style={{ background: 'var(--bg)', color: 'var(--mute)' }}>Cargando tus fallos…</div>

  // Cuaderno vacío
  if (preguntas.length === 0) return (
    <div className="min-h-screen fade-up" style={{ background: 'var(--bg)' }}>
      <TestTopbar title="Repaso de errores" onBack={() => navigate(`/oposicion/${slug}/tests`)} />
      <main className="max-w-2xl mx-auto px-4 pt-16 pb-12" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 44 }}>🎉</div>
        <h1 className="display" style={{ margin: '12px 0 8px', fontSize: 26 }}>Cuaderno limpio</h1>
        <p style={{ fontSize: 13.5, color: 'var(--mute)', margin: '0 auto', maxWidth: 320 }}>No tienes fallos pendientes de repasar. Sigue haciendo tests: cuando falles una pregunta, aparecerá aquí hasta que la domines.</p>
        <button onClick={() => navigate(`/oposicion/${slug}/tests`)} className="btn-editorial btn-acc" style={{ marginTop: 22 }}>Ir a los tests</button>
      </main>
    </div>
  )

  const aciertos = respuestas.filter((r, i) => r === getPreguntaCorrecta(preguntas[i])).length
  const errores  = respuestas.filter((r, i) => r !== null && r !== getPreguntaCorrecta(preguntas[i])).length

  function enviar() {
    registrarLote(preguntas.map((p, i) => ({
      id: p.id,
      temaId: p.temaId,
      acierto: respuestas[i] === getPreguntaCorrecta(p),
    })))
    setEnviado(true)
  }

  // ── Resultado ──
  if (enviado) {
    const pendientes = contarErrores()
    return (
      <div className="min-h-screen fade-up" style={{ background: 'var(--bg)' }}>
        <TestTopbar title="Repaso de errores" onBack={() => navigate(`/oposicion/${slug}/tests`)} />
        <main className="max-w-2xl mx-auto px-4 pt-4 pb-12" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="card" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, padding: 24, textAlign: 'center' }}>
            <div className="eyebrow" style={{ marginBottom: 6 }}>Repaso completado</div>
            <div className="num-display" style={{ fontSize: 44, color: 'var(--accent)', lineHeight: 1 }}>{aciertos}/{preguntas.length}</div>
            <div style={{ fontSize: 13.5, color: 'var(--ink-soft)', marginTop: 12 }}>✅ {aciertos} acertadas · ❌ {errores} aún falladas</div>
            <div style={{ fontSize: 12, color: 'var(--mute)', marginTop: 6 }}>
              {pendientes === 0
                ? '¡Cuaderno limpio! 🎉'
                : `Te quedan ${pendientes} en el cuaderno. Cada pregunta se gradúa al acertarla ${GRADUACION} veces seguidas.`}
            </div>
          </div>
          {preguntas.map((p, i) => {
            const ok = respuestas[i] === getPreguntaCorrecta(p)
            return (
              <div key={p.id} className="card" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 16, borderLeft: `3px solid ${ok ? 'var(--accent)' : 'var(--warn)'}` }}>
                <p style={{ margin: 0, fontSize: 13.5, fontWeight: 600, color: 'var(--ink)' }}>{p.enunciado}</p>
                <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--accent)' }}>Correcta: {p.opciones[getPreguntaCorrecta(p)]}</p>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--mute)', fontStyle: 'italic' }}>{p.explicacion}</p>
              </div>
            )
          })}
          {pendientes > 0 && (
            <button onClick={() => { setEnviado(false); setCargando(true); setTimeout(() => window.location.reload(), 0) }} className="btn-editorial btn-acc" style={{ width: '100%' }}>
              Seguir repasando ({pendientes})
            </button>
          )}
          <button onClick={() => navigate(`/oposicion/${slug}/tests`)} className="btn-editorial btn-sec" style={{ width: '100%' }}>Volver</button>
        </main>
      </div>
    )
  }

  // ── Preguntas ──
  return (
    <div className="min-h-screen fade-up" style={{ background: 'var(--bg)' }}>
      <TestTopbar title={`Repaso de errores · ${preguntas.length}`} onBack={() => navigate(`/oposicion/${slug}/tests`)} />
      <main className="max-w-2xl mx-auto px-4 pt-4 pb-12" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="card" style={{ background: 'var(--accent-soft)', border: '1px solid var(--accent)', borderRadius: 14, padding: '10px 14px', fontSize: 12.5, color: 'var(--accent)' }}>
          🩹 Estas son las preguntas que has fallado. Acierta cada una {GRADUACION} veces seguidas para sacarla del cuaderno.
        </div>
        {preguntas.map((p, i) => (
          <div key={p.id} className="card" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 16 }}>
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
          Corregir
        </button>
      </main>
    </div>
  )
}
