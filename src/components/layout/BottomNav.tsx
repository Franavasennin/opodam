import { useEffect, useRef, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { OPOSICIONES } from '../../data/oposiciones'
import { setActiveSlug } from '../../services/storage'
import { esOwner } from '../../services/supabase'
import { Icon } from '../ui/Icon'
import { SEGS_MOVIL_PRIMARIOS, navVisible, rutaNav } from './navItems'

/**
 * Navegación táctil para < 1024px.
 *
 * Antes de esto la app no tenía NINGUNA navegación por debajo de `lg`:
 * DesktopShell renderiza su barra lateral con `hidden lg:flex`, y este
 * componente era código muerto que enlazaba a rutas (/temario, /examen…)
 * que ya no existen. En una app declarada mobile-first eso dejaba al usuario
 * sin forma de moverse entre secciones desde el móvil.
 *
 * Cuatro destinos primarios + "Más" (hoja inferior con el resto). El slug se
 * deriva de la URL para no exigir props: el componente es autónomo y cualquier
 * contenedor puede montarlo sin cablear nada.
 */
export function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()
  const [hoja, setHoja] = useState(false)
  const [puedeVerPrivadas, setPuedeVerPrivadas] = useState(false)
  const botonMas = useRef<HTMLButtonElement>(null)
  const panel = useRef<HTMLDivElement>(null)

  // Mismo criterio que MisOposiciones y OnboardingOposicion: las oposiciones
  // marcadas `privado` solo se listan a los roles owner/beta.
  // La guarda `vivo` evita escribir estado si la promesa resuelve tras desmontar.
  useEffect(() => {
    let vivo = true
    esOwner().then(v => { if (vivo) setPuedeVerPrivadas(v) }).catch(() => {})
    return () => { vivo = false }
  }, [])

  const m = location.pathname.match(/^\/oposicion\/([^/]+)(\/([^/]+))?/)
  const slug = m?.[1]
  const seg = m?.[3] ?? ''
  const oposicion = OPOSICIONES.find(op => op.slug === slug)

  const items = navVisible(oposicion?.ocultar)
  const primarios = items.filter(i => SEGS_MOVIL_PRIMARIOS.includes(i.seg))
  const secundarios = items.filter(i => !SEGS_MOVIL_PRIMARIOS.includes(i.seg))
  const disponibles = OPOSICIONES.filter(op => op.disponible && (!op.privado || puedeVerPrivadas))

  /**
   * La hoja está realmente en pantalla solo si además seguimos dentro de una
   * oposición. Si la ruta deja de casar (p. ej. el botón atrás del navegador)
   * el componente devuelve null más abajo: derivando la condición aquí, el
   * efecto se relanza, su limpieza corre y `body` recupera el scroll. Si el
   * efecto dependiera solo de `hoja`, la hoja desaparecería del DOM dejando
   * `overflow: hidden` colgado y un usuario táctil se quedaría sin scroll.
   */
  const abierta = hoja && Boolean(slug)

  // Hoja abierta: bloquea el scroll de fondo, cierra con Escape y mantiene el
  // foco dentro sin dejar trampa de teclado (WCAG 2.1.2).
  useEffect(() => {
    if (!abierta) return
    const previo = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') { setHoja(false); return }
      if (e.key !== 'Tab' || !panel.current) return
      const focusables = panel.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
      if (!focusables.length) return
      const primero = focusables[0]
      const ultimo = focusables[focusables.length - 1]
      if (e.shiftKey && document.activeElement === primero) { e.preventDefault(); ultimo.focus() }
      else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primero.focus() }
    }

    document.addEventListener('keydown', onKey)
    panel.current?.querySelector<HTMLElement>('a[href], button')?.focus()
    const disparador = botonMas.current
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previo
      disparador?.focus()
    }
  }, [abierta])

  // Al navegar, la hoja se cierra en el manejador de cada destino (`irA`,
  // `cambiarOposicion` y el onClick de cada NavLink), no en un efecto sobre
  // location: eso disparaba un render en cascada. Y si la ruta cambia sin pasar
  // por ninguno de ellos, `abierta` se vuelve falsa y el efecto limpia solo.

  // Fuera de una oposición no hay secciones que ofrecer.
  if (!slug) return null

  function irA(destino: string) {
    setHoja(false)
    navigate(destino)
  }

  function cambiarOposicion(nuevo: string) {
    setActiveSlug(nuevo)
    setHoja(false)
    navigate(`/oposicion/${nuevo}`)
  }

  const masActivo = secundarios.some(i => i.seg === seg)

  return (
    <>
      <nav className="tabbar lg:hidden" aria-label="Navegación principal">
        {primarios.map(item => (
          <NavLink
            key={item.seg}
            to={rutaNav(slug, item.seg)}
            end={item.seg === ''}
            className={({ isActive }) => `tabbar__item${isActive ? ' is-active' : ''}`}
          >
            <Icon nombre={item.icono} size={22} />
            <span className="tabbar__label">{item.labelCorta ?? item.label}</span>
          </NavLink>
        ))}

        {secundarios.length > 0 && (
          <button
            ref={botonMas}
            type="button"
            onClick={() => setHoja(v => !v)}
            aria-expanded={abierta}
            aria-controls="hoja-mas"
            aria-current={masActivo ? 'page' : undefined}
            className={`tabbar__item${masActivo ? ' is-active' : ''}`}
          >
            <Icon nombre="mas" size={22} />
            <span className="tabbar__label">Más</span>
          </button>
        )}
      </nav>

      {abierta && (
        <div className="sheet-backdrop lg:hidden" onClick={() => setHoja(false)}>
          <div
            id="hoja-mas"
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-label="Más secciones"
            className="sheet"
            onClick={e => e.stopPropagation()}
          >
            <div className="sheet__grip" aria-hidden="true" />

            <div className="sheet__head">
              <p className="eyebrow">Más secciones</p>
              <button type="button" className="icon-btn" onClick={() => setHoja(false)} aria-label="Cerrar">
                <Icon nombre="cerrar" size={20} />
              </button>
            </div>

            <ul className="sheet__list">
              {secundarios.map(item => (
                <li key={item.seg}>
                  <NavLink
                    to={rutaNav(slug, item.seg)}
                    onClick={() => setHoja(false)}
                    className={({ isActive }) => `sheet__link${isActive ? ' is-active' : ''}`}
                  >
                    <span className="sheet__icon"><Icon nombre={item.icono} size={20} /></span>
                    <span className="sheet__texto">{item.label}</span>
                  </NavLink>
                </li>
              ))}
              <li>
                <button type="button" className="sheet__link" onClick={() => irA('/procoach')}>
                  <span className="sheet__icon"><Icon nombre="procoach" size={20} /></span>
                  <span className="sheet__texto">ProCoach AI</span>
                </button>
              </li>
              <li>
                <button type="button" className="sheet__link" onClick={() => irA(`/oposicion/${slug}/perfil`)}>
                  <span className="sheet__icon"><Icon nombre="perfil" size={20} /></span>
                  <span className="sheet__texto">Mi perfil</span>
                </button>
              </li>
            </ul>

            {disponibles.length > 1 && (
              <>
                <p className="eyebrow sheet__sep">Cambiar de oposición</p>
                <ul className="sheet__list">
                  {disponibles.map(op => (
                    <li key={op.slug}>
                      <button
                        type="button"
                        className={`sheet__link${op.slug === slug ? ' is-active' : ''}`}
                        onClick={() => cambiarOposicion(op.slug)}
                        aria-current={op.slug === slug ? 'true' : undefined}
                      >
                        <span className="sheet__icon"><Icon nombre="escudo" size={20} /></span>
                        <span className="sheet__texto">{op.nombre}</span>
                        {op.slug === slug && <Icon nombre="check" size={18} />}
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
