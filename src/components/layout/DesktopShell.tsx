import { useState, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { OPOSICIONES } from '../../data/oposiciones'
import { setActiveSlug } from '../../services/storage'

const NAV = [
  { label: 'Resumen', icon: '◎', seg: '' },
  { label: 'Temario', icon: '📚', seg: 'temario' },
  { label: 'Flashcards', icon: '🃏', seg: 'flashcards' },
  { label: 'Tests y simulacros', icon: '📝', seg: 'tests' },
  { label: 'Tutor', icon: '👨‍🏫', seg: 'tutor' },
  { label: 'Psicotécnicos', icon: '🧠', seg: 'psicotecnicos' },
  { label: 'Supuestos', icon: '📋', seg: 'supuestos' },
  { label: 'Entrevista', icon: '🎤', seg: 'entrevista' },
  { label: 'Personalidad', icon: '🧩', seg: 'personalidad' },
  { label: 'Estadísticas', icon: '📊', seg: 'estadisticas' },
]

/** Envuelve la app: en pantallas grandes muestra una barra lateral fija
 *  cuando estamos dentro de una oposición; en móvil no añade nada. */
export function DesktopShell({ children }: { children: ReactNode }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [abierto, setAbierto] = useState(false)

  const m = location.pathname.match(/^\/oposicion\/([^/]+)(\/([^/]+))?/)
  const slug = m?.[1]
  const seg = m?.[3] ?? ''
  const enOposicion = Boolean(slug)
  const oposicion = OPOSICIONES.find(op => op.slug === slug)
  const disponibles = OPOSICIONES.filter(op => op.disponible)

  function cambiarOposicion(nuevo: string) {
    setActiveSlug(nuevo)
    setAbierto(false)
    navigate(`/oposicion/${nuevo}`)
  }

  return (
    <>
      {enOposicion && (
        <aside
          className="hidden lg:flex"
          style={{
            position: 'fixed', top: 0, left: 0, bottom: 0, width: 264, zIndex: 20,
            flexDirection: 'column', background: 'var(--surface)', borderRight: '1px solid var(--border)',
          }}
        >
          {/* Marca */}
          <button onClick={() => navigate('/mis-oposiciones')} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '18px 18px 14px', background: 'none', border: 0, cursor: 'pointer' }}>
            <span style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--ink)', color: 'var(--bg)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Instrument Serif', serif", fontStyle: 'italic', fontSize: 19, lineHeight: 1 }}>O</span>
            <span style={{ fontWeight: 600, fontSize: 16, letterSpacing: '-0.01em', color: 'var(--ink)' }}>OpoDAM</span>
          </button>

          {/* Selector de oposición (cambiar entre disponibles) */}
          {oposicion && (
            <div style={{ position: 'relative', margin: '0 14px 16px' }}>
              <button onClick={() => setAbierto(v => !v)} className="card" style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 12, cursor: 'pointer', textAlign: 'left' }}>
                <span style={{ fontSize: 18 }}>🛡️</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="eyebrow" style={{ fontSize: 9.5 }}>Oposición</div>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{oposicion.slug.toUpperCase()}</div>
                </div>
                <span style={{ color: 'var(--mute)', transform: abierto ? 'rotate(90deg)' : 'none', transition: 'transform 120ms' }}>›</span>
              </button>
              {abierto && (
                <div className="card" style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 6, zIndex: 30, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', boxShadow: '0 12px 30px -12px rgba(0,0,0,0.25)' }}>
                  {disponibles.map(op => (
                    <button key={op.slug} onClick={() => cambiarOposicion(op.slug)}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: op.slug === slug ? 'var(--accent-soft)' : 'transparent', border: 0, cursor: 'pointer', textAlign: 'left' }}>
                      <span style={{ fontSize: 16 }}>{op.slug === 'cgpc' ? '🛡️' : '👮'}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12.5, fontWeight: 600, color: op.slug === slug ? 'var(--accent)' : 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{op.nombre}</div>
                      </div>
                      {op.slug === slug && <span style={{ color: 'var(--accent)', fontSize: 12 }}>✓</span>}
                    </button>
                  ))}
                  <button onClick={() => { setAbierto(false); navigate('/mis-oposiciones') }}
                    style={{ width: '100%', padding: '10px 12px', background: 'transparent', border: 0, borderTop: '1px solid var(--border-soft)', cursor: 'pointer', textAlign: 'left', fontSize: 12, color: 'var(--mute)' }}>
                    Ver todas las oposiciones
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="eyebrow" style={{ padding: '0 22px 8px' }}>Navegar</div>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '0 12px', overflowY: 'auto', flex: 1 }}>
            {NAV.filter(item => !(oposicion?.ocultar ?? []).includes(item.seg)).map(item => {
              const activo = seg === item.seg
              return (
                <button
                  key={item.label}
                  onClick={() => navigate(`/oposicion/${slug}${item.seg ? '/' + item.seg : ''}`)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 11, padding: '9px 12px', borderRadius: 10,
                    border: 0, cursor: 'pointer', textAlign: 'left', fontSize: 13.5, fontWeight: 500,
                    background: activo ? 'var(--accent-soft)' : 'transparent',
                    color: activo ? 'var(--accent)' : 'var(--ink-soft)',
                    borderLeft: `2px solid ${activo ? 'var(--accent)' : 'transparent'}`,
                  }}
                >
                  <span style={{ width: 18, textAlign: 'center', fontSize: 15 }}>{item.icon}</span>
                  {item.label}
                </button>
              )
            })}
          </nav>

          {/* ProCoach */}
          <button onClick={() => navigate('/procoach')} style={{ margin: 12, display: 'flex', alignItems: 'center', gap: 10, padding: '11px 12px', borderRadius: 12, border: 0, cursor: 'pointer', textAlign: 'left', background: 'var(--accent-soft)', color: 'var(--accent)' }}>
            <span style={{ width: 26, height: 26, borderRadius: 7, background: 'var(--accent)', color: 'var(--accent-ink)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>✦</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600 }}>ProCoach AI</div>
              <div style={{ fontSize: 11, opacity: 0.8 }}>Pregunta lo que sea</div>
            </div>
          </button>
        </aside>
      )}

      <div className={enOposicion ? 'lg:pl-[264px]' : ''}>
        {children}
      </div>
    </>
  )
}
