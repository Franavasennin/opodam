import { useNavigate } from 'react-router-dom'

const topbar: React.CSSProperties = {
  height: 52, borderBottom: '1px solid var(--border-soft)',
  background: 'color-mix(in srgb, var(--bg) 88%, transparent)', backdropFilter: 'blur(12px)',
}

export default function ProCoachAI() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen fade-up" style={{ background: 'var(--bg)' }}>
      <header className="sticky top-0 z-10 flex items-center gap-3 px-4" style={topbar}>
        <button onClick={() => navigate('/mis-oposiciones')} style={{ background: 'none', border: 0, cursor: 'pointer', color: 'var(--ink)', fontSize: 16 }}>←</button>
        <span style={{ fontWeight: 600, fontSize: 14, letterSpacing: '-0.01em' }}>ProCoach AI</span>
      </header>
      <main className="max-w-2xl mx-auto px-4 pt-4 pb-12" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="hero" style={{ padding: 24 }}>
          <div className="hero-grain" />
          <div style={{ position: 'relative' }}>
            <div className="eyebrow" style={{ color: 'rgba(255,255,255,0.6)' }}>Preparación física</div>
            <h1 className="display" style={{ margin: '8px 0 6px', fontSize: 28 }}>ProCoach <span className="display-italic" style={{ color: 'var(--accent)' }}>AI</span></h1>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.78)', margin: 0, lineHeight: 1.5 }}>
              Un agente IA especializado en disciplina deportiva: chat en tiempo real, modo gym, análisis y planes personalizados para tu oposición.
            </p>
          </div>
        </div>

        <div className="card" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 18 }}>
          <div className="eyebrow" style={{ marginBottom: 12 }}>Agente</div>
          <div className="flex items-center gap-3">
            <span className="pill pill-accent num-display" style={{ fontSize: 11 }}>DELTA</span>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)' }}>Oposiciones físicas</div>
              <div style={{ fontSize: 12, color: 'var(--mute)' }}>Especialista GC, Policía, FF.AA. España</div>
            </div>
          </div>
          <button onClick={() => navigate('/procoach/chat')} className="btn-editorial btn-acc" style={{ width: '100%', marginTop: 14 }}>
            Hablar con DELTA
          </button>
        </div>

        <div className="card" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 18 }}>
          <div className="eyebrow" style={{ marginBottom: 10 }}>Capacidades</div>
          <ul style={{ fontSize: 13.5, color: 'var(--ink-soft)', margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <li>Memoria activa (últimos 20 mensajes)</li>
            <li>Modo gym (respuestas concisas)</li>
            <li>Detección de problemas</li>
            <li>Límites profesionales</li>
          </ul>
        </div>
      </main>
    </div>
  )
}
