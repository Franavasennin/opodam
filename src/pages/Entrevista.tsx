import { useEffect, useRef, useState } from 'react'
import { Icon } from '../components/ui/Icon'
import { useNavigate, useParams } from 'react-router-dom'
import { enviarTurnoEntrevista, type MensajeEntrevista, type ModoEntrevista } from '../services/entrevista'
import { OrbTribunal3D } from '../components/3d/OrbTribunal3D'
import { TiltCard3D } from '../components/ui/TiltCard3D'

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

  // Determinar estado del orbe 3D
  const estadoOrb = cargando
    ? 'pensando'
    : mensajes.length > 0 && mensajes[mensajes.length - 1].role === 'assistant'
    ? 'hablando'
    : 'escuchando'

  // ── Selección de modo ──
  if (!modo) {
    return (
      <div className="min-h-screen fade-up" style={{ background: 'var(--bg)' }}>
        <header className="sticky top-0 z-10 flex items-center gap-3 px-4" style={topbar}>
          <button onClick={() => navigate(`/oposicion/${slug}`)} className="tactile-press" style={{ background: 'none', border: 0, minHeight: 44, minWidth: 44, cursor: 'pointer', color: 'var(--ink)', fontSize: 16 }}>←</button>
          <span style={{ fontWeight: 600, fontSize: 14, letterSpacing: '-0.01em' }}>Entrevista Personal</span>
        </header>
        <main className="max-w-2xl mx-auto px-4 pt-4 pb-12">
          <div className="eyebrow" style={{ marginBottom: 10 }}>Simulador de Tribunal</div>
          <h1 className="display" style={{ margin: '0 0 18px', fontSize: 32, letterSpacing: '-0.015em' }}>
            Habla con tu <span className="display-italic" style={{ color: 'var(--accent)' }}>tribunal 3D.</span>
          </h1>

          <div className="mb-6 flex justify-center">
            <OrbTribunal3D estado="escuchando" modo="practica" />
          </div>

          <div className="stagger" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <TiltCard3D onClick={() => elegirModo('practica')} maxTilt={6} glowColor="rgba(184, 73, 47, 0.16)">
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <Icon nombre="diana" size={18} /> Práctica
              </div>
              <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 6, lineHeight: 1.5 }}>
                Feedback didáctico tras cada respuesta (método STAR, qué busca el tribunal y respuesta modelo sugerida).
              </div>
            </TiltCard3D>

            <TiltCard3D onClick={() => elegirModo('examen')} maxTilt={6} glowColor="rgba(196, 162, 90, 0.16)">
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <Icon nombre="tiempo" size={18} /> Examen real
              </div>
              <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 6, lineHeight: 1.5 }}>
                Preguntas encadenadas bajo presión sin interrupciones; el análisis global se emite al final en el informe de idoneidad.
              </div>
            </TiltCard3D>
          </div>
        </main>
      </div>
    )
  }

  // ── Conversación con el Tribunal ──
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>
      <header className="sticky top-0 z-10 flex items-center gap-3 px-4" style={topbar}>
        <button onClick={() => navigate(`/oposicion/${slug}`)} className="tactile-press" style={{ background: 'none', border: 0, minHeight: 44, minWidth: 44, cursor: 'pointer', color: 'var(--ink)', fontSize: 16 }}>←</button>
        <span style={{ fontWeight: 600, fontSize: 14, letterSpacing: '-0.01em' }}>Tribunal</span>
        <span className="num-display" style={{ fontSize: 12, color: 'var(--mute)' }}>· {modo === 'examen' ? 'Examen real' : 'Práctica'}</span>
        <button
          onClick={() => { setModo(null); setMensajes([]); setError(null) }}
          className="tactile-press"
          style={{ marginLeft: 'auto', background: 'none', border: 0, minHeight: 44, minWidth: 44, cursor: 'pointer', color: 'var(--accent)', fontSize: 12.5, fontWeight: 600 }}
        >
          Reiniciar
        </button>
      </header>

      {/* Orbe 3D interactivo en la cabecera */}
      <div className="py-2 border-b border-[var(--border-soft)] bg-[var(--surface)]/60 backdrop-blur-md">
        <OrbTribunal3D estado={estadoOrb} modo={modo} />
      </div>

      <main className="flex-1 overflow-y-auto px-4 py-4">
        <div className="max-w-2xl mx-auto" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {mensajes.map((m, i) => (
            <div
              key={i}
              className="tactile-press"
              style={m.role === 'user'
                ? { marginLeft: 'auto', maxWidth: '85%', borderRadius: 18, background: 'var(--accent)', color: 'var(--accent-ink)', padding: '12px 16px', fontSize: 14, whiteSpace: 'pre-wrap', lineHeight: 1.5, boxShadow: '0 4px 14px -3px rgba(184, 73, 47, 0.25)' }
                : { marginRight: 'auto', maxWidth: '85%', borderRadius: 18, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--ink-soft)', padding: '12px 16px', fontSize: 14, whiteSpace: 'pre-wrap', lineHeight: 1.5, boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}
            >
              {m.content}
            </div>
          ))}
          {cargando && (
            <div className="mr-auto rounded-2xl bg-[var(--surface)] border border-[var(--accent-soft)] px-4 py-3 text-sm text-[var(--accent-strong)] ai-glow-breathe flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-ping" />
              <span>El tribunal está formulando la pregunta…</span>
            </div>
          )}
          {error && <div className="rounded-xl px-3 py-2 text-xs" style={{ background: 'var(--warn-soft)', color: 'var(--warn)' }}>{error}</div>}
          <div ref={finRef} />
        </div>
      </main>

      <footer className="px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]" style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)' }}>
        <div className="max-w-2xl mx-auto" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Tu respuesta ante el tribunal… (Enter para enviar)"
              rows={2}
              style={{
                flex: 1,
                resize: 'none',
                borderRadius: 14,
                border: '1px solid var(--border)',
                background: 'var(--bg)',
                color: 'var(--ink)',
                padding: '10px 14px',
                fontSize: 14,
              }}
            />
            <button
              onClick={enviar}
              disabled={cargando || !input.trim()}
              className="btn-editorial btn-acc tactile-press"
              style={{ paddingLeft: 20, paddingRight: 20, height: 44, opacity: cargando || !input.trim() ? 0.4 : 1 }}
            >
              Enviar
            </button>
          </div>
          {mensajes.length > 1 && (
            <button
              onClick={verInforme}
              disabled={cargando}
              className="btn-editorial btn-sec tactile-press"
              style={{ width: '100%', height: 42, opacity: cargando ? 0.4 : 1 }}
            >
              Finalizar entrevista y generar informe
            </button>
          )}
        </div>
      </footer>
    </div>
  )
}
