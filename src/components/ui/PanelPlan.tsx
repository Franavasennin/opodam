import { useEffect, useState } from 'react'
import { obtenerConvocatoria } from '../../services/convocatorias'
import { calcularPlan, type EstadoPlan } from '../../services/plan'
import type { Progreso } from '../../types'

interface Props {
  slug: string
  temas: Progreso['temas']
  total: number
}

function formatear(iso: string): string {
  try { return new Date(`${iso}T00:00:00`).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' }) }
  catch { return iso }
}

const TONO: Record<Exclude<EstadoPlan, 'sin-datos'>, { color: string; bg: string; icon: string }> = {
  adelantado: { color: 'var(--accent)', bg: 'var(--accent-soft)', icon: '✅' },
  justo:      { color: '#a07a2c', bg: 'color-mix(in srgb, #a07a2c 12%, transparent)', icon: '🟡' },
  atrasado:   { color: 'var(--warn)', bg: 'var(--warn-soft)', icon: '⚠️' },
  'sin-fecha':{ color: 'var(--ink-soft)', bg: 'var(--surface)', icon: '📈' },
}

/**
 * P1.6 — Plan inverso: traduce el ritmo real a una fecha de fin proyectada y,
 * si hay convocatoria con fecha, a un margen frente al examen.
 */
export function PanelPlan({ slug, temas, total }: Props) {
  const [fechaExamen, setFechaExamen] = useState<string | null | undefined>(undefined)

  useEffect(() => {
    let vivo = true
    obtenerConvocatoria(slug).then(c => {
      if (vivo) setFechaExamen(c?.estado === 'activa' ? (c.fechaExamen ?? null) : null)
    }).catch(() => { if (vivo) setFechaExamen(null) })
    return () => { vivo = false }
  }, [slug])

  if (fechaExamen === undefined) return null   // aún cargando convocatoria
  const plan = calcularPlan(temas, total, fechaExamen)
  if (plan.estado === 'sin-datos') return null

  const tono = TONO[plan.estado]
  const margen = plan.margenDias

  let titulo: string
  if (plan.estado === 'sin-fecha') {
    titulo = plan.restantes === 0 ? '¡Temario completo!' : `A este ritmo acabas el ${formatear(plan.fechaFinProyectada)}`
  } else if (plan.restantes === 0) {
    titulo = '¡Temario completo! Toca consolidar.'
  } else if (margen != null && margen >= 0) {
    titulo = `Acabas el ${formatear(plan.fechaFinProyectada)} · ${margen} días antes del examen`
  } else {
    titulo = `Acabas el ${formatear(plan.fechaFinProyectada)} · ${Math.abs(margen ?? 0)} días tarde`
  }

  return (
    <div className="card" style={{ background: tono.bg, border: `1px solid ${tono.color}`, borderRadius: 14, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
      <span style={{ fontSize: 20 }}>{tono.icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: tono.color }}>{titulo}</div>
        <div style={{ fontSize: 11.5, color: 'var(--mute)', marginTop: 2 }}>
          Ritmo: <b>{plan.ritmoSemanal}</b> temas/sem · {plan.estudiados}/{plan.total} estudiados
          {plan.ritmoNecesario != null && plan.estado === 'atrasado' && (
            <> · necesitas <b style={{ color: tono.color }}>{plan.ritmoNecesario}</b>/sem</>
          )}
        </div>
      </div>
    </div>
  )
}
