import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { OPOSICIONES } from '../../data/oposiciones'
import { setActiveSlug } from '../../services/storage'
import { esOwner } from '../../services/supabase'
import { Icon } from '../ui/Icon'
import { BottomNav } from './BottomNav'
import { navVisible, rutaNav } from './navItems'

/**
 * Envoltorio de la app.
 *  - ≥1024px: barra lateral fija cuando estamos dentro de una oposición.
 *  - <1024px: barra de pestañas inferior (BottomNav). Antes aquí no había
 *    nada: la lateral es `hidden lg:flex` y el BottomNav estaba muerto.
 *
 * Los estilos de navegación viven en index.css (.navside__link, .tabbar…) y no
 * en `style={{}}`: un estilo en línea no puede declarar :hover ni
 * :focus-visible, así que la navegación no tenía ningún estado de interacción.
 * Los destinos son <Link> reales (antes eran <button onClick={navigate}>), de
 * modo que se pueden abrir en pestaña nueva y se anuncian como enlaces.
 */
export function DesktopShell({ children }: { children: ReactNode }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [abierto, setAbierto] = useState(false)
  const [puedeVerPrivadas, setPuedeVerPrivadas] = useState(false)
  const selector = useRef<HTMLDivElement>(null)

  // Mismo criterio que MisOposiciones y OnboardingOposicion: las oposiciones
  // marcadas `privado` solo se listan a los roles owner/beta. Antes esta barra
  // las mostraba a cualquiera.
  // La guarda `vivo` evita escribir estado si la promesa resuelve tras desmontar.
  useEffect(() => {
    let vivo = true
    esOwner().then(v => { if (vivo) setPuedeVerPrivadas(v) }).catch(() => {})
    return () => { vivo = false }
  }, [])

  const m = location.pathname.match(/^\/oposicion\/([^/]+)(\/([^/]+))?/)
  const slug = m?.[1]
  const seg = m?.[3] ?? ''
  const enOposicion = Boolean(slug)
  const oposicion = OPOSICIONES.find(op => op.slug === slug)
  const disponibles = OPOSICIONES.filter(op => op.disponible && (!op.privado || puedeVerPrivadas))
  const items = navVisible(oposicion?.ocultar)

  // El desplegable se cierra con Escape y al pulsar fuera; antes no había
  // ninguna forma de cerrarlo con el teclado.
  useEffect(() => {
    if (!abierto) return
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setAbierto(false) }
    function onDown(e: MouseEvent) {
      if (selector.current && !selector.current.contains(e.target as Node)) setAbierto(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onDown)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onDown)
    }
  }, [abierto])

  function cambiarOposicion(nuevo: string) {
    setActiveSlug(nuevo)
    setAbierto(false)
    navigate(`/oposicion/${nuevo}`)
  }

  return (
    <>
      <a className="skip-link" href="#contenido">Saltar al contenido</a>

      {enOposicion && slug && (
        <aside
          className="hidden lg:flex"
          aria-label="Secciones de la oposición"
          style={{
            position: 'fixed', top: 0, left: 0, bottom: 0, width: 264, zIndex: 20,
            flexDirection: 'column', background: 'var(--surface)', borderRight: '1px solid var(--border)',
          }}
        >
          {/* Marca */}
          <Link
            to="/mis-oposiciones"
            style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '18px 18px 14px', textDecoration: 'none' }}
          >
            <span style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--ink)', color: 'var(--bg)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Instrument Serif', serif", fontStyle: 'italic', fontSize: 19, lineHeight: 1 }}>O</span>
            <span style={{ fontWeight: 600, fontSize: 16, letterSpacing: '-0.01em', color: 'var(--ink)' }}>OpoDAM</span>
          </Link>

          {/* Selector de oposición */}
          {oposicion && (
            <div ref={selector} style={{ position: 'relative', margin: '0 14px 16px' }}>
              <button
                type="button"
                onClick={() => setAbierto(v => !v)}
                aria-expanded={abierto}
                aria-controls="lista-oposiciones"
                aria-label={`Oposición actual: ${oposicion.nombre}. Cambiar de oposición`}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, minHeight: 48, padding: '10px 12px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 12, cursor: 'pointer', textAlign: 'left', color: 'var(--ink)' }}
              >
                <Icon nombre="escudo" size={18} />
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span className="eyebrow" style={{ display: 'block', fontSize: 11 }}>Oposición</span>
                  <span style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{oposicion.nombre}</span>
                </span>
                <span style={{ display: 'inline-flex', color: 'var(--mute)', transform: abierto ? 'rotate(90deg)' : 'none', transition: 'transform 120ms' }}>
                  <Icon nombre="chevron" size={16} />
                </span>
              </button>

              {abierto && (
                <ul
                  id="lista-oposiciones"
                  style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 6, zIndex: 40, listStyle: 'none', margin: '6px 0 0', padding: 4, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, boxShadow: '0 12px 30px -12px rgba(0,0,0,0.25)' }}
                >
                  {disponibles.map(op => (
                    <li key={op.slug}>
                      <button
                        type="button"
                        className={`navside__link${op.slug === slug ? ' is-active' : ''}`}
                        onClick={() => cambiarOposicion(op.slug)}
                        aria-current={op.slug === slug ? 'true' : undefined}
                        style={{ width: '100%' }}
                      >
                        <span className="navside__icon"><Icon nombre="escudo" size={16} /></span>
                        <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{op.nombre}</span>
                        {op.slug === slug && <Icon nombre="check" size={16} />}
                      </button>
                    </li>
                  ))}
                  <li>
                    <Link to="/mis-oposiciones" className="navside__link" onClick={() => setAbierto(false)} style={{ color: 'var(--mute)' }}>
                      Ver todas las oposiciones
                    </Link>
                  </li>
                </ul>
              )}
            </div>
          )}

          <p className="eyebrow" style={{ padding: '0 22px 8px', margin: 0 }}>Navegar</p>
          <nav aria-label="Navegación de la oposición" style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '0 12px', overflowY: 'auto', flex: 1 }}>
            {items.map(item => {
              const activo = seg === item.seg
              return (
                <Link
                  key={item.seg}
                  to={rutaNav(slug, item.seg)}
                  className={`navside__link${activo ? ' is-active' : ''}`}
                  aria-current={activo ? 'page' : undefined}
                >
                  <span className="navside__icon"><Icon nombre={item.icono} size={18} /></span>
                  {item.label}
                </Link>
              )
            })}
          </nav>

          {/* ProCoach */}
          <Link
            to="/procoach"
            style={{ margin: 12, display: 'flex', alignItems: 'center', gap: 10, minHeight: 48, padding: '11px 12px', borderRadius: 12, textAlign: 'left', background: 'var(--accent-soft)', color: 'var(--accent-strong)', textDecoration: 'none' }}
          >
            <span style={{ width: 26, height: 26, borderRadius: 7, background: 'var(--accent)', color: 'var(--accent-ink)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon nombre="procoach" size={15} />
            </span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: 'block', fontSize: 13, fontWeight: 600 }}>ProCoach AI</span>
              <span style={{ display: 'block', fontSize: 12, opacity: 0.85 }}>Pregunta lo que sea</span>
            </span>
          </Link>
        </aside>
      )}

      <div id="contenido" className={enOposicion ? 'lg:pl-[264px]' : ''}>
        {children}
      </div>

      <BottomNav />
    </>
  )
}
