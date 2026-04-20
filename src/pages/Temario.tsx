import { useNavigate } from 'react-router-dom'
import { useProgress } from '../hooks/useProgress'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { TEMAS_META } from '../data/topics'
import type { Bloque } from '../types'

export function Temario() {
  const { progreso } = useProgress()
  const navigate = useNavigate()

  const grupos: Record<Bloque, typeof TEMAS_META> = {
    general:    TEMAS_META.filter(t => t.bloque === 'general'),
    especifico: TEMAS_META.filter(t => t.bloque === 'especifico'),
  }

  function renderTema(meta: typeof TEMAS_META[number]) {
    const p = progreso.temas[String(meta.id)]
    const vueltas = p?.vueltas ?? 0
    const aciertos = p?.porcentajeAciertos ?? 0
    const dominado = aciertos >= 80 && vueltas >= 3
    return (
      <Card key={meta.id} onClick={() => navigate(`/temario/${meta.id}`)} className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-800 truncate">Tema {meta.id} — {meta.titulo}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {p?.ultimaRevision ? `Última: ${p.ultimaRevision}` : 'Sin estudiar'}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className="text-xs text-gray-500">🔄 ×{vueltas}</span>
          {aciertos > 0 && <span className="text-xs text-green-600">🎯 {aciertos}%</span>}
          {dominado && <Badge variant="green">Dominado</Badge>}
        </div>
      </Card>
    )
  }

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold pt-4">📚 Temario</h1>
      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Bloque General — Temas 1–23</h2>
        <div className="space-y-2">{grupos.general.map(renderTema)}</div>
      </section>
      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Bloque Específico — Temas 24–45</h2>
        <div className="space-y-2">{grupos.especifico.map(renderTema)}</div>
      </section>
    </div>
  )
}
