import { useRef, useState, type ReactNode, type MouseEvent } from 'react'
import { Link } from 'react-router-dom'
import { movimientoReducido } from './movimiento'

interface TiltCard3DProps {
  children: ReactNode
  className?: string
  to?: string
  onClick?: () => void
  'aria-label'?: string
  maxTilt?: number
  glowColor?: string
}

export function TiltCard3D({
  children,
  className = '',
  to,
  onClick,
  'aria-label': ariaLabel,
  maxTilt = 8,
  glowColor = 'color-mix(in srgb, var(--accent) 14%, transparent)',
}: TiltCard3DProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [transformStyle, setTransformStyle] = useState<string>('')
  const [sheenStyle, setSheenStyle] = useState<{ opacity: number; background: string }>({
    opacity: 0,
    background: '',
  })
  const [isHovered, setIsHovered] = useState(false)

  function handleMouseMove(e: MouseEvent<HTMLDivElement>) {
    const el = cardRef.current
    if (!el || movimientoReducido()) return

    const rect = el.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const centerX = rect.width / 2
    const centerY = rect.height / 2

    const rotateX = ((y - centerY) / centerY) * -maxTilt
    const rotateY = ((x - centerX) / centerX) * maxTilt

    setTransformStyle(
      `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateZ(6px)`
    )

    setSheenStyle({
      opacity: 1,
      background: `radial-gradient(circle 280px at ${x}px ${y}px, ${glowColor}, transparent 70%)`,
    })
  }

  function handleMouseEnter() {
    setIsHovered(true)
  }

  function handleMouseLeave() {
    setIsHovered(false)
    setTransformStyle('perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)')
    setSheenStyle(prev => ({ ...prev, opacity: 0 }))
  }

  const baseClasses = `
    relative overflow-hidden rounded-2xl border border-[var(--border)]
    bg-[var(--surface)] p-5 text-[var(--ink)]
    transition-transform duration-200 ease-out
    shadow-[0_2px_8px_rgba(0,0,0,0.03)]
    hover:shadow-[0_16px_36px_-12px_rgba(26,24,21,0.14)]
    active:scale-[0.98] select-none
    ${className}
  `.trim()

  const cardInner = (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={baseClasses}
      style={{
        transform: transformStyle || undefined,
        transformStyle: 'preserve-3d',
        willChange: isHovered ? 'transform' : 'auto',
      }}
    >
      {/* Specular sheen layer (Emil Kowalski light reflection) */}
      <div
        className="pointer-events-none absolute inset-0 z-10 transition-opacity duration-300"
        style={{
          opacity: sheenStyle.opacity,
          background: sheenStyle.background,
        }}
      />
      {/* Elevación Z interior */}
      <div style={{ transform: 'translateZ(18px)', transformStyle: 'preserve-3d' }}>
        {children}
      </div>
    </div>
  )

  if (to) {
    return (
      <Link to={to} className="block text-left no-underline" aria-label={ariaLabel}>
        {cardInner}
      </Link>
    )
  }

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="block w-full text-left bg-transparent border-0 p-0 cursor-pointer"
        aria-label={ariaLabel}
      >
        {cardInner}
      </button>
    )
  }

  return cardInner
}
