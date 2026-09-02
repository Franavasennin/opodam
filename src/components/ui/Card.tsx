import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

interface CardProps {
  children: ReactNode
  className?: string
  /** Si se pasa, la tarjeta es un enlace real (preferible a onClick). */
  to?: string
  /** Si se pasa (y no hay `to`), la tarjeta es un <button>. */
  onClick?: () => void
  /** Describe la acción cuando el contenido por sí solo no la deja clara. */
  'aria-label'?: string
}

const BASE = 'bg-white rounded-2xl border border-slate-200 shadow-sm p-4'
const INTERACTIVA = 'block w-full text-left cursor-pointer transition-shadow hover:shadow-md'

/**
 * Tarjeta. Cuando es pulsable renderiza un <a> o un <button> reales.
 *
 * Antes era siempre un <div> con `onClick`: no recibía foco, no respondía a
 * Enter/Espacio y los lectores de pantalla no la anunciaban como control
 * (WCAG 2.1.1 y 4.1.2). En Dashboard eso dejaba "Ver temario", "Simulacro" y
 * "Sesión de hoy" inalcanzables sin ratón.
 */
export function Card({ children, className = '', to, onClick, ...resto }: CardProps) {
  const clases = `${BASE} ${className}`.trim()
  const etiqueta = resto['aria-label']

  if (to) {
    return (
      <Link to={to} className={`${clases} ${INTERACTIVA}`} aria-label={etiqueta}>
        {children}
      </Link>
    )
  }

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={`${clases} ${INTERACTIVA}`} aria-label={etiqueta}>
        {children}
      </button>
    )
  }

  return <div className={clases}>{children}</div>
}
