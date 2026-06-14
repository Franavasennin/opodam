import { useNavigate, useParams } from 'react-router-dom'
import { temasEnRiesgo } from '../../services/dominio'
import type { Progreso } from '../../types'

interface MetaTema { id: number; titulo: string }

interface Props {
  temas: Progreso['temas']
  metas: readonly MetaTema[]
}

/**
 * P1.3 — "En riesgo hoy": temas ya estudiados cuyo recuerdo ha decaído
 * (curva de olvido), lo más frágil primero. Atajo para decidir qué repasar.
 */
export function PanelEnRiesgo({ temas, metas }: Props) {
  const navigate = useNavigate()
  const { slug } = useParams<{ slug: string }>()
  const enRiesgo = temasEnRiesgo(temas, metas.map(m => m.id), undefined, 5)

  if (enRiesgo.length === 0) return null

  return (
    <div className="card" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 18 }}>
      <div className="eyebrow" style={{ marginBottom: 14 }}>🧠 En riesgo de olvido</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {enRiesgo.map(t => {
          const meta = metas.find(m => m.id === t.id)
          const olvidado = t.estado === 'olvidado'
          const color = olvidado ? 'var(--warn)' : '#a07a2c'
          return (
            <button key={t.id} onClick={() => navigate(`/oposicion/${slug}/temario/${t.id}`)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 0, cursor: 'pointer', textAlign: 'left', padding: 0 }}>
              <span style={{ fontSize: 13 }}>{olvidado ? '🔴' : '🟡'}</span>
              <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                T{t.id} — {meta?.titulo ?? '…'}
              </span>
              <span className="num-display" style={{ flexShrink: 0, fontSize: 12, color }}>
                {t.dominio}% · {t.dias === 0 ? 'hoy' : `${t.dias}d`}
              </span>
            </button>
          )
        })}
      </div>
      <button onClick={() => navigate(`/oposicion/${slug}/sesion-diaria`)}
        style={{ width: '100%', marginTop: 14, background: 'none', border: 0, cursor: 'pointer', color: 'var(--accent)', fontSize: 13, fontWeight: 600, textAlign: 'left', textDecoration: 'underline' }}>
        → Repasar en la sesión de hoy
      </button>
    </div>
  )
}
