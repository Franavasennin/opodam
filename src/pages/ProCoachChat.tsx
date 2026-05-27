// src/pages/ProCoachChat.tsx
// Chat con el agente DELTA (entrenador físico de oposiciones).
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { enviarMensajeDelta, type MensajeChat, type PerfilDelta, type Cuerpo, type Nivel } from '../services/delta'

const CLAVE_PERFIL = 'opodam.delta.perfil'
const CLAVE_MENSAJES = 'opodam.delta.mensajes'

const topbar: React.CSSProperties = {
  height: 52, borderBottom: '1px solid var(--border-soft)',
  background: 'color-mix(in srgb, var(--bg) 88%, transparent)', backdropFilter: 'blur(12px)',
}

const inputStyle: React.CSSProperties = {
  width: '100%', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--ink)', padding: '7px 10px', fontSize: 13,
}

const CUERPOS: { value: Cuerpo; label: string }[] = [
  { value: 'cgpc', label: 'CGPC — Policía Canaria' },
  { value: 'policia_local', label: 'Policía Local' },
  { value: 'guardia_civil', label: 'Guardia Civil' },
  { value: 'policia_nacional', label: 'Policía Nacional' },
  { value: 'fuerzas_armadas', label: 'Fuerzas Armadas' },
  { value: 'bomberos', label: 'Bomberos' },
]

const NIVELES: { value: Nivel; label: string }[] = [
  { value: 'beginner', label: 'Principiante' },
  { value: 'intermediate', label: 'Intermedio' },
  { value: 'advanced', label: 'Avanzado' },
]

function cargarPerfil(): PerfilDelta {
  try {
    const raw = localStorage.getItem(CLAVE_PERFIL)
    if (!raw) return {}
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

function cargarMensajes(): MensajeChat[] {
  try {
    const raw = localStorage.getItem(CLAVE_MENSAJES)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
  } catch {
    return []
  }
}

export default function ProCoachChat() {
  const navigate = useNavigate()
  const [perfil, setPerfil] = useState<PerfilDelta>(() => cargarPerfil())
  const [mensajes, setMensajes] = useState<MensajeChat[]>(() => cargarMensajes())
  const [input, setInput] = useState('')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mostrarPerfil, setMostrarPerfil] = useState(() => !cargarPerfil().cuerpo)
  const finRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    localStorage.setItem(CLAVE_PERFIL, JSON.stringify(perfil))
  }, [perfil])

  useEffect(() => {
    localStorage.setItem(CLAVE_MENSAJES, JSON.stringify(mensajes))
    finRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensajes])

  async function enviar() {
    const texto = input.trim()
    if (!texto || cargando) return
    setError(null)
    const nuevos: MensajeChat[] = [...mensajes, { role: 'user', content: texto }]
    setMensajes(nuevos)
    setInput('')
    setCargando(true)
    const { content, error: err } = await enviarMensajeDelta(nuevos, perfil)
    setCargando(false)
    if (err || !content) {
      setError(err || 'No se obtuvo respuesta')
      return
    }
    setMensajes(prev => [...prev, { role: 'assistant', content }])
  }

  function limpiarConversacion() {
    if (!confirm('¿Borrar toda la conversación con DELTA?')) return
    setMensajes([])
    setError(null)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      enviar()
    }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>
      <header className="sticky top-0 z-10 flex items-center gap-3 px-4" style={topbar}>
        <button onClick={() => navigate('/procoach')} style={{ background: 'none', border: 0, cursor: 'pointer', color: 'var(--ink)', fontSize: 16 }}>←</button>
        <span style={{ fontWeight: 600, fontSize: 14, letterSpacing: '-0.01em' }}>DELTA</span>
        <span className="num-display" style={{ fontSize: 11.5, color: 'var(--mute)' }}>· Preparador físico</span>
        <button onClick={() => setMostrarPerfil(v => !v)} style={{ marginLeft: 'auto', background: 'none', border: 0, cursor: 'pointer', color: 'var(--accent)', fontSize: 12.5, fontWeight: 600 }}>
          {mostrarPerfil ? 'Ocultar perfil' : 'Editar perfil'}
        </button>
      </header>

      {/* Perfil */}
      {mostrarPerfil && (
        <section className="px-4 py-3" style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
          <div className="max-w-2xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label style={{ fontSize: 12 }}>
              <span style={{ display: 'block', fontWeight: 600, color: 'var(--ink-soft)', marginBottom: 4 }}>Cuerpo / oposición</span>
              <select value={perfil.cuerpo ?? ''} onChange={e => setPerfil(p => ({ ...p, cuerpo: (e.target.value || undefined) as Cuerpo }))} style={inputStyle}>
                <option value="">(elige)</option>
                {CUERPOS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </label>
            <label style={{ fontSize: 12 }}>
              <span style={{ display: 'block', fontWeight: 600, color: 'var(--ink-soft)', marginBottom: 4 }}>Nivel físico</span>
              <select value={perfil.level ?? ''} onChange={e => setPerfil(p => ({ ...p, level: (e.target.value || undefined) as Nivel }))} style={inputStyle}>
                <option value="">(elige)</option>
                {NIVELES.map(n => <option key={n.value} value={n.value}>{n.label}</option>)}
              </select>
            </label>
            <label style={{ fontSize: 12 }}>
              <span style={{ display: 'block', fontWeight: 600, color: 'var(--ink-soft)', marginBottom: 4 }}>Días/semana</span>
              <input type="text" value={perfil.weekly_days ?? ''} onChange={e => setPerfil(p => ({ ...p, weekly_days: e.target.value }))} placeholder="3-4" style={inputStyle} />
            </label>
            <label style={{ fontSize: 12 }}>
              <span style={{ display: 'block', fontWeight: 600, color: 'var(--ink-soft)', marginBottom: 4 }}>Fecha del examen físico</span>
              <input type="date" value={perfil.target_date ?? ''} onChange={e => setPerfil(p => ({ ...p, target_date: e.target.value }))} style={inputStyle} />
            </label>
            <label className="sm:col-span-2" style={{ fontSize: 12 }}>
              <span style={{ display: 'block', fontWeight: 600, color: 'var(--ink-soft)', marginBottom: 4 }}>Lesiones / limitaciones (opcional)</span>
              <input type="text" value={perfil.injuries ?? ''} onChange={e => setPerfil(p => ({ ...p, injuries: e.target.value }))} placeholder="Ej.: tendinitis de hombro derecho" style={inputStyle} />
            </label>
          </div>
        </section>
      )}

      {/* Mensajes */}
      <main className="flex-1 overflow-y-auto px-4 py-4">
        <div className="max-w-2xl mx-auto" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {mensajes.length === 0 && !cargando && (
            <div className="card" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 16 }}>
              <p style={{ margin: '0 0 4px', fontSize: 13.5, fontWeight: 600, color: 'var(--ink)' }}>Hola, soy DELTA 🛡️</p>
              <p style={{ margin: 0, fontSize: 12.5, color: 'var(--mute)', lineHeight: 1.5 }}>
                Tu preparador físico para oposiciones. Rellena tu perfil arriba y cuéntame qué necesitas:
                un plan, una sesión, dudas de protocolo o tus marcas actuales.
              </p>
            </div>
          )}

          {mensajes.map((m, i) => (
            <div key={i} style={m.role === 'user'
              ? { marginLeft: 'auto', maxWidth: '85%', borderRadius: 16, background: 'var(--accent)', color: 'var(--accent-ink)', padding: '10px 14px', fontSize: 13.5, whiteSpace: 'pre-wrap', lineHeight: 1.45 }
              : { marginRight: 'auto', maxWidth: '85%', borderRadius: 16, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--ink-soft)', padding: '10px 14px', fontSize: 13.5, whiteSpace: 'pre-wrap', lineHeight: 1.45 }}>
              {m.content}
            </div>
          ))}

          {cargando && <div style={{ marginRight: 'auto', borderRadius: 16, background: 'var(--surface)', border: '1px solid var(--border)', padding: '10px 14px', fontSize: 13.5, color: 'var(--mute)' }}>DELTA está escribiendo…</div>}
          {error && <div className="rounded-xl px-3 py-2 text-xs" style={{ background: 'var(--warn-soft)', color: 'var(--warn)' }}>{error}</div>}
          <div ref={finRef} />
        </div>
      </main>

      {/* Input */}
      <footer className="px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]" style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)' }}>
        <div className="max-w-2xl mx-auto flex items-end gap-2">
          <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
            placeholder="Escribe a DELTA… (Enter para enviar)" rows={2}
            style={{ flex: 1, resize: 'none', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--ink)', padding: '8px 12px', fontSize: 13.5 }} />
          <div className="flex flex-col gap-1">
            <button onClick={enviar} disabled={cargando || !input.trim()} className="btn-editorial btn-acc"
              style={{ paddingLeft: 18, paddingRight: 18, opacity: cargando || !input.trim() ? 0.4 : 1 }}>Enviar</button>
            {mensajes.length > 0 && (
              <button onClick={limpiarConversacion} style={{ background: 'none', border: 0, cursor: 'pointer', fontSize: 10, color: 'var(--mute)' }}>limpiar</button>
            )}
          </div>
        </div>
      </footer>
    </div>
  )
}
