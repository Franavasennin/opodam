import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { enviarTurnoEntrevista, type MensajeEntrevista, type ModoEntrevista } from '../services/entrevista'

const topbar: React.CSSProperties = {
  height: 52, borderBottom: '1px solid var(--border-soft)',
  background: 'color-mix(in srgb, var(--bg) 88%, transparent)', backdropFilter: 'blur(12px)',
}

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

  // ── Selección de modo ──
  if (!modo) {
    return (
      <div className="min-h-screen fade-up" style={{ background: 'var(--bg)' }}>
        <header className="sticky top-0 z-10 flex items-center gap-3 px-4" style={topbar}>
          <button onClick={() => navigate(`/oposicion/${slug}`)} style={{ background: 'none', border: 0, cursor: 'pointer', color: 'var(--ink)', fontSize: 16 }}>←</button>
          <span style={{ fontWeight: 600, fontSize: 14, letterSpacing: '-0.01em' }}>Entrevista</span>
        </header>
        <main className="max-w-2xl mx-auto px-4 pt-4 pb-12">
          <div className="eyebrow" style={{ marginBottom: 10 }}>Entrenamiento personal</div>
          <h1 className="display" style={{ margin: '0 0 18px', fontSize: 30, letterSpacing: '-0.015em' }}>
            Habla con tu <span className="display-italic" style={{ color: 'var(--accent)' }}>tribunal.</span>
          </h1>
          <div className="stagger" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button onClick={() => elegirModo('practica')} className="card"
              style={{ width: '100%', textAlign: 'left', cursor: 'pointer', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '16px 18px' }}>
              <div style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--ink)' }}>🎯 Práctica</div>
              <div style={{ fontSize: 12.5, color: 'var(--mute)', marginTop: 3, lineHeight: 1.45 }}>Feedback didáctico tras cada respuesta (método STAR, versión modelo).</div>
            </button>
            <button onClick={() => elegirModo('examen')} className="card"
              style={{ width: '100%', textAlign: 'left', cursor: 'pointer', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '16px 18px' }}>
              <div style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--ink)' }}>⏱️ Examen real</div>
              <div style={{ fontSize: 12.5, color: 'var(--mute)', marginTop: 3, lineHeight: 1.45 }}>Preguntas encadenadas con presión; el análisis va al informe final.</div>
            </button>
          </div>
        </main>
      </div>
    )
  }

  // ── Conversación ──
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>
      <header className="sticky top-0 z-10 flex items-center gap-3 px-4" style={topbar}>
        <button onClick={() => navigate(`/oposicion/${slug}`)} style={{ background: 'none', border: 0, cursor: 'pointer', color: 'var(--ink)', fontSize: 16 }}>←</button>
        <span style={{ fontWeight: 600, fontSize: 14, letterSpacing: '-0.01em' }}>Entrevista</span>
        <span className="num-display" style={{ fontSize: 11.5, color: 'var(--mute)' }}>· {modo === 'examen' ? 'Examen real' : 'Práctica'}</span>
        <button onClick={() => { setModo(null); setMensajes([]); setError(null) }} style={{ marginLeft: 'auto', background: 'none', border: 0, cursor: 'pointer', color: 'var(--accent)', fontSize: 12.5, fontWeight: 600 }}>Reiniciar</button>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-4">
        <div className="max-w-2xl mx-auto" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {mensajes.map((m, i) => (
            <div key={i} style={m.role === 'user'
              ? { marginLeft: 'auto', maxWidth: '85%', borderRadius: 16, background: 'var(--accent)', color: 'var(--accent-ink)', padding: '10px 14px', fontSize: 13.5, whiteSpace: 'pre-wrap', lineHeight: 1.45 }
              : { marginRight: 'auto', maxWidth: '85%', borderRadius: 16, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--ink-soft)', padding: '10px 14px', fontSize: 13.5, whiteSpace: 'pre-wrap', lineHeight: 1.45 }}>
              {m.content}
            </div>
          ))}
          {cargando && <div style={{ marginRight: 'auto', borderRadius: 16, background: 'var(--surface)', border: '1px solid var(--border)', padding: '10px 14px', fontSize: 13.5, color: 'var(--mute)' }}>El entrevistador está pensando…</div>}
          {error && <div className="rounded-xl px-3 py-2 text-xs" style={{ background: 'var(--warn-soft)', color: 'var(--warn)' }}>{error}</div>}
          <div ref={finRef} />
        </div>
      </main>

      <footer className="px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]" style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)' }}>
        <div className="max-w-2xl mx-auto" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div className="flex items-end gap-2">
            <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
              placeholder="Tu respuesta… (Enter para enviar)" rows={2}
              style={{ flex: 1, resize: 'none', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--ink)', padding: '8px 12px', fontSize: 13.5 }} />
            <button onClick={enviar} disabled={cargando || !input.trim()} className="btn-editorial btn-acc"
              style={{ paddingLeft: 18, paddingRight: 18, opacity: cargando || !input.trim() ? 0.4 : 1 }}>Enviar</button>
          </div>
          {mensajes.length > 1 && (
            <button onClick={verInforme} disabled={cargando} className="btn-editorial btn-sec" style={{ width: '100%', opacity: cargando ? 0.4 : 1 }}>
              Terminar y ver informe
            </button>
          )}
        </div>
      </footer>
    </div>
  )
}
