import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { obtenerConvocatoria } from '../../services/convocatorias'
import { planPreExamen, type PlanPreExamen } from '../../services/repasoPreExamen'
import type { Progreso } from '../../types'

interface MetaTema { id: number; titulo: string }

interface Props {
  temas: Progreso['temas']
  metas: readonly MetaTema[]
}

/**
 * P3.4 — Modo repaso pre-examen. En los 7 días previos a la convocatoria
 * sustituye el plan normal por un cierre intensivo: conceptos más frágiles
 * primero, simulacro diario y veda de contenido nuevo a 48 h.
 */
export function PanelPreExamen({ temas, metas }: Props) {
  const navigate = useNavigate()
  const { slug } = useParams<{ slug: string }>()
  const [plan, setPlan] = useState<PlanPreExamen | null>(null)

  useEffect(() => {
    let vivo = true
    if (!slug) return
    obtenerConvocatoria(slug).then(c => {
      if (!vivo) return
      setPlan(planPreExamen(temas, metas.map(m => m.id), c.fechaExamen))
    })
    return () => { vivo = false }
  }, [slug, temas, metas])

  if (!plan || !plan.activo) return null

  const top = plan.conceptos.slice(0, 6)
  const tit = plan.dias === 0 ? '¡Hoy es el examen!' : `Cierre final · faltan ${plan.dias} días`

  return (
    <div className="card" style={{ background: 'var(--accent-soft)', border: '1px solid var(--accent)', borderRadius: 16, padding: 18 }}>
      <div className="eyebrow" style={{ color: 'var(--accent)', marginBottom: 6 }}>🎯 Modo pre-examen</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--accent)', marginBottom: 4 }}>{tit}</div>
      <p style={{ fontSize: 12.5, color: 'var(--accent)', opacity: 0.85, margin: '0 0 12px' }}>
        {plan.vedaContenidoNuevo
          ? 'Últimas 48 h: nada de temario nuevo. Solo repaso de lo más frágil y simulacro.'
          : 'Repasa los conceptos con más riesgo de olvido y haz un simulacro al día.'}
      </p>

      {top.length > 0 && (
        <>
          <div className="eyebrow" style={{ color: 'var(--accent)', opacity: 0.8, marginBottom: 8 }}>Repasa primero</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
            {top.map(c => {
              const meta = metas.find(m => m.id === c.id)
              return (
                <button key={c.id} onClick={() => navigate(`/oposicion/${slug}/temario/${c.id}`)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 0, cursor: 'pointer', textAlign: 'left', padding: 0 }}>
                  <span style={{ fontSize: 13 }}>🔴</span>
                  <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, color: 'var(--accent)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    T{c.id} — {meta?.titulo ?? '…'}
                  </span>
                  <span className="num-display" style={{ flexShrink: 0, fontSize: 12, color: 'var(--accent)' }}>
                    {Math.round(c.riesgo * 100)}% riesgo
                  </span>
                </button>
              )
            })}
          </div>
        </>
      )}

      {plan.simulacroHoy && (
        <button onClick={() => navigate(`/oposicion/${slug}/tests`)}
          className="btn-editorial btn-acc" style={{ height: 38 }}>
          Hacer el simulacro de hoy
        </button>
      )}
    </div>
  )
}
