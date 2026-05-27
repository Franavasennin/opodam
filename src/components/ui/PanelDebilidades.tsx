import { useNavigate, useParams } from 'react-router-dom'
import { TEMAS_META } from '../../data/topics'
import { calcularDebilidades, totalPreguntasRespondidas } from '../../services/adaptativo'
import type { Progreso } from '../../types'

interface Props {
  rendimiento: Progreso['rendimientoPorTema']
}

export function PanelDebilidades({ rendimiento }: Props) {
  const navigate = useNavigate()
  const { slug } = useParams<{ slug: string }>()
  const total    = totalPreguntasRespondidas(rendimiento)
  const debiles  = calcularDebilidades(rendimiento, 5)

  if (total < 10 || debiles.length === 0) return null

  return (
    <div className="card" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 18 }}>
      <div className="eyebrow" style={{ marginBottom: 14 }}>📊 Tus puntos débiles</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {debiles.map(temaId => {
          const r    = rendimiento[String(temaId)]!
          const pct  = Math.round((r.aciertos / r.total) * 100)
          const meta = TEMAS_META.find(m => m.id === temaId)
          return (
            <div key={temaId}>
              <div className="flex justify-between" style={{ fontSize: 12, color: 'var(--mute)', marginBottom: 5 }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: 8 }}>T{temaId} — {meta?.titulo.slice(0, 28) ?? '…'}</span>
                <span className="num-display" style={{ flexShrink: 0, fontWeight: 600, color: pct < 50 ? 'var(--warn)' : '#a07a2c' }}>{pct}% ⚠️</span>
              </div>
              <div className="bar"><div className="bar-fill" style={{ width: `${pct}%`, background: pct < 50 ? 'var(--warn)' : '#a07a2c' }} /></div>
            </div>
          )
        })}
      </div>
      <button onClick={() => navigate(`/oposicion/${slug}/sesion-diaria`)}
        style={{ width: '100%', marginTop: 14, background: 'none', border: 0, cursor: 'pointer', color: 'var(--accent)', fontSize: 13, fontWeight: 600, textAlign: 'left', textDecoration: 'underline' }}>
        → Ir a sesión de hoy
      </button>
    </div>
  )
}
