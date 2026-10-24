import { movimientoReducido } from './movimiento'
import { useState, useRef, type MouseEvent, type KeyboardEvent, type ReactNode } from 'react'

interface FlipCard3DProps {
  front: ReactNode
  back: ReactNode
  isFlipped: boolean
  onFlip: () => void
  className?: string
  hintFront?: string
  hintBack?: string
}

export function FlipCard3D({
  front,
  back,
  isFlipped,
  onFlip,
  className = '',
  hintFront = 'Toca o pulsa Espacio para ver respuesta',
  hintBack = 'Toca para volver al anverso',
}: FlipCard3DProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const [sheen, setSheen] = useState<{ x: number; y: number; opacity: number }>({ x: 50, y: 50, opacity: 0 })

  function handleMouseMove(e: MouseEvent<HTMLDivElement>) {
    if (isFlipped || movimientoReducido()) return // Desactivar tilt durante el reverso para lectura cómoda
    const el = cardRef.current
    if (!el) return

    const rect = el.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const centerX = rect.width / 2
    const centerY = rect.height / 2

    const rotateX = ((y - centerY) / centerY) * -8
    const rotateY = ((x - centerX) / centerX) * 8

    setTilt({ x: rotateX, y: rotateY })
    setSheen({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
      opacity: 0.18,
    })
  }

  function handleMouseLeave() {
    setTilt({ x: 0, y: 0 })
    setSheen(s => ({ ...s, opacity: 0 }))
  }

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault()
      onFlip()
    }
  }

  return (
    <div
      style={{ perspective: 1200 }}
      className={`w-full select-none ${className}`}
    >
      <div
        ref={cardRef}
        role="button"
        tabIndex={0}
        aria-label={isFlipped ? 'Tarjeta volteada mostrando respuesta' : 'Tarjeta mostrando pregunta'}
        aria-expanded={isFlipped}
        onClick={onFlip}
        onKeyDown={handleKeyDown}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="relative w-full min-h-[260px] cursor-pointer outline-none rounded-2xl active:scale-[0.985]"
        style={{
          transformStyle: 'preserve-3d',
          transform: isFlipped
            ? 'rotateY(180deg)'
            : `rotateX(${tilt.x.toFixed(2)}deg) rotateY(${tilt.y.toFixed(2)}deg)`,
          transition: movimientoReducido() ? 'none' : 'transform 0.55s cubic-bezier(0.34, 1.4, 0.64, 1), scale 0.15s ease',
        }}
      >
        {/* CARA ANVERSO (Front) */}
        <div
          className="absolute inset-0 w-full h-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8 flex flex-col justify-between items-center text-center shadow-[0_8px_24px_-6px_rgba(26,24,21,0.06)]"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(0deg)',
          }}
        >
          {/* Brillo especular dinámico */}
          <div
            className="pointer-events-none absolute inset-0 rounded-2xl transition-opacity duration-300"
            style={{
              opacity: sheen.opacity,
              background: `radial-gradient(circle 240px at ${sheen.x}% ${sheen.y}%, rgba(184, 73, 47, 0.22), transparent 70%)`,
            }}
          />

          <div className="w-full flex justify-between items-center text-[12px] font-mono text-[var(--mute)]">
            <span className="px-2 py-0.5 rounded-md bg-[var(--surface-2)] border border-[var(--border-soft)]">
              PREGUNTA
            </span>
            <span className="inline-flex items-center gap-1 opacity-70">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
              </svg>
              3D FLIP
            </span>
          </div>

          <div className="my-auto py-4">
            <div className="text-[17px] sm:text-[18px] font-semibold text-[var(--ink)] leading-snug">
              {front}
            </div>
          </div>

          <div className="text-[12px] text-[var(--mute)] font-medium flex items-center gap-1.5 opacity-80">
            <span>{hintFront}</span>
            <span className="text-[14px]">↻</span>
          </div>
        </div>

        {/* CARA REVERSO (Back) */}
        <div
          className="absolute inset-0 w-full h-full rounded-2xl border-2 border-[var(--accent)] bg-[var(--surface)] p-6 sm:p-8 flex flex-col justify-between items-center text-center shadow-[0_14px_34px_-8px_rgba(184,73,47,0.22)]"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          <div className="w-full flex justify-between items-center text-[12px] font-mono text-[var(--accent-strong)]">
            <span className="px-2 py-0.5 rounded-md bg-[var(--accent-soft)] font-semibold">
              RESPUESTA
            </span>
            <span className="text-[11px] opacity-75">
              CONFIRMA TU CONOCIMIENTO
            </span>
          </div>

          <div className="my-auto py-4">
            <div className="text-[16.5px] sm:text-[17.5px] font-medium text-[var(--ink)] leading-relaxed">
              {back}
            </div>
          </div>

          <div className="text-[12px] text-[var(--accent-strong)] font-semibold flex items-center gap-1.5">
            <span>{hintBack}</span>
            <span className="text-[14px]">↺</span>
          </div>
        </div>
      </div>
    </div>
  )
}
