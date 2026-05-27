// src/pages/OposicionDashboard.tsx
import { useParams, useNavigate } from 'react-router-dom'
import { OPOSICIONES } from '../data/oposiciones'

const MENU = [
  { icon: '📚', label: 'Temario', sub: 'Estudia los temas', path: 'temario' },
  { icon: '🃏', label: 'Flashcards', sub: 'Repaso rápido', path: 'flashcards' },
  { icon: '📝', label: 'Tests y simulacros', sub: 'Practica preguntas', path: 'tests' },
  { icon: '🧠', label: 'Psicotécnicos', sub: 'Aptitudes y razonamiento', path: 'psicotecnicos' },
  { icon: '📋', label: 'Supuestos prácticos', sub: 'Casos tipo examen', path: 'supuestos' },
  { icon: '🎤', label: 'Entrevista', sub: 'Entrena la entrevista personal', path: 'entrevista' },
  { icon: '🧩', label: 'Test de personalidad', sub: 'Conoce tu perfil', path: 'personalidad' },
  { icon: '📊', label: 'Estadísticas', sub: 'Ver mi progreso', path: 'estadisticas' },
]

export default function OposicionDashboard() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const oposicion = OPOSICIONES.find(op => op.slug === slug)

  if (!oposicion) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <p style={{ color: 'var(--mute)' }}>Oposición no encontrada.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen fade-up" style={{ background: 'var(--bg)' }}>
      {/* Topbar */}
      <header
        className="sticky top-0 z-10 flex items-center justify-between px-4"
        style={{ height: 52, borderBottom: '1px solid var(--border-soft)', background: 'color-mix(in srgb, var(--bg) 88%, transparent)', backdropFilter: 'blur(12px)' }}
      >
        <button onClick={() => navigate('/mis-oposiciones')} style={{ background: 'none', border: 0, cursor: 'pointer', color: 'var(--ink)', fontSize: 14, display: 'flex', alignItems: 'center', gap: 4 }}>
          ← <span style={{ fontWeight: 500 }}>Inicio</span>
        </button>
        <span className="pill mono">{oposicion.slug.toUpperCase()}</span>
      </header>

      <main className="max-w-2xl mx-auto px-4">
        {/* Hero tinta */}
        <div className="hero" style={{ marginTop: 16 }}>
          <div className="hero-grain" />
          <div style={{ position: 'relative' }}>
            <div className="eyebrow" style={{ color: 'rgba(255,255,255,0.55)', marginBottom: 10 }}>Plan de estudio</div>
            <h1 className="display" style={{ margin: 0, fontSize: 30, lineHeight: 1.06, letterSpacing: '-0.015em' }}>
              {oposicion.nombre}
            </h1>
            <p style={{ marginTop: 8, marginBottom: 0, fontSize: 13.5, color: 'rgba(255,255,255,0.7)', lineHeight: 1.4 }}>
              {oposicion.descripcion}
            </p>
            {oposicion.numTemas != null && (
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 14 }}>
                <span className="num-display" style={{ fontSize: 26 }}>{oposicion.numTemas}</span>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>temas en el programa</span>
              </div>
            )}
          </div>
        </div>

        {/* Menú */}
        <div className="eyebrow" style={{ margin: '22px 4px 10px' }}>Tu preparación</div>
        <div className="stagger" style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingBottom: 32 }}>
          {MENU.map(item => (
            <button
              key={item.path}
              onClick={() => navigate(`/oposicion/${slug}/${item.path}`)}
              className="card"
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
                textAlign: 'left', cursor: 'pointer', background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 16,
              }}
            >
              <span style={{
                width: 44, height: 44, borderRadius: 12, background: 'var(--surface-2)',
                border: '1px solid var(--border-soft)', fontSize: 20,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>{item.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', letterSpacing: '-0.01em' }}>{item.label}</div>
                <div style={{ fontSize: 12, color: 'var(--mute)', marginTop: 2 }}>{item.sub}</div>
              </div>
              <span style={{ color: 'var(--mute)', fontSize: 18 }}>›</span>
            </button>
          ))}
        </div>
      </main>
    </div>
  )
}
