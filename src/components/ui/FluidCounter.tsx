import { useEffect, useRef } from 'react'
import { movimientoReducido } from './movimiento'

interface FluidCounterProps {
  value: number
  decimals?: number
  duration?: number
  className?: string
  suffix?: string
}

export function FluidCounter({
  value,
  decimals = 2,
  duration = 1100,
  className = '',
  suffix = '',
}: FluidCounterProps) {
  const spanRef = useRef<HTMLSpanElement>(null)
  const prevValueRef = useRef(0)

  useEffect(() => {
    const startVal = prevValueRef.current
    const targetVal = value
    if (movimientoReducido()) {
      prevValueRef.current = targetVal
      if (spanRef.current) spanRef.current.textContent = targetVal.toFixed(decimals) + suffix
      return
    }

    let startTime: number | null = null
    let animId: number

    function animate(now: number) {
      if (!startTime) startTime = now
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)

      // Spring-like exponential deceleration (Emil Kowalski style)
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress)
      const current = startVal + (targetVal - startVal) * ease
      prevValueRef.current = current

      if (spanRef.current) {
        spanRef.current.textContent = current.toFixed(decimals) + suffix
      }

      if (progress < 1) {
        animId = requestAnimationFrame(animate)
      }
    }

    animId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animId)
  }, [value, decimals, duration, suffix])

  return (
    <span
      ref={spanRef}
      className={`num-display tabular-nums tracking-tight font-mono ${className}`}
    >
      {(0).toFixed(decimals) + suffix}
    </span>
  )
}
