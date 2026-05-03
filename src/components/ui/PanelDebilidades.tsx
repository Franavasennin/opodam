import { useNavigate } from 'react-router-dom'
import { Card } from './Card'
import { ProgressBar } from './ProgressBar'
import { TEMAS_META } from '../../data/topics'
import { calcularDebilidades, totalPreguntasRespondidas } from '../../services/adaptativo'
import type { Progreso } from '../../types'

interface Props {
  rendimiento: Progreso['rendimientoPorTema']
}

export function PanelDebilidades({ rendimiento }: Props) {
  const navigate = useNavigate()
  const total    = totalPreguntasRespondidas(rendimiento)
  const debiles  = calcularDebilidades(rendimiento, 5)

  if (total < 10 || debiles.length === 0) return null

  return (
    <Card>
      <h2 className="text-sm font-semibold text-gray-700 mb-3">📊 Tus puntos débiles</h2>
      <div className="space-y-3">
        {debiles.map(temaId => {
          const r    = rendimiento[String(temaId)]!
          const pct  = Math.round((r.aciertos / r.total) * 100)
          const meta = TEMAS_META.find(m => m.id === temaId)
          return (
            <div key={temaId}>
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>T{temaId} — {meta?.titulo.slice(0, 28) ?? '...'}</span>
                <span className={pct < 50 ? 'text-red-500 font-medium' : 'text-orange-500'}>
                  {pct}% ⚠️
                </span>
              </div>
              <ProgressBar value={pct} color={pct < 50 ? 'orange' : 'blue'} />
            </div>
          )
        })}
      </div>
      <button onClick={() => navigate('/sesion-diaria')}
        className="w-full mt-3 text-brand-600 text-sm font-medium underline text-left">
        → Ir a sesión de hoy
      </button>
    </Card>
  )
}
