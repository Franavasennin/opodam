import { useNavigate, useParams } from 'react-router-dom'
import { useProgress } from '../hooks/useProgress'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { obtenerTopics } from '../data/topics'
import type { Bloque } from '../types'

export function Temario() {
  const { progreso } = useProgress()
  const navigate = useNavigate()
  const { slug } = useParams<{ slug: string }>()
  const { TEMAS_META } = obtenerTopics(slug ?? 'cgpc')

  const grupos: Record<Bloque, Array<typeof TEMAS_META[number]>> = {
    general:    TEMAS_META.filter(t => t.bloque === 'general'),
    especifico: TEMAS_META.filter(t => t.bloque === 'especifico'),
  }

  function renderTema(meta: typeof TEMAS_META[number]) {
    const p = progreso.temas[String(meta.id)]
    const vueltas = p?.vueltas ?? 0
    const aciertos = p?.porcentajeAciertos ?? 0
    const dominado = aciertos >= 80 && vueltas >= 3
    return (
      <Card key={meta.id} onClick={() => navigate(`/oposicion/${slug}/temario/${meta.id}`)} className="flex items-center gap-3">
        <span className="w-9 h-9 rounded-xl bg-marca-50 text-marca-700 text-sm font-bold flex items-center justify-center shrink-0">
          {meta.id}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-900 truncate">{meta.titulo}</p>
          <p className="text-xs text-slate-500 mt-0.5">
            {p?.ultimaRevision ? `Última: ${p.ultimaRevision}` : 'Sin estudiar'}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className="text-xs text-slate-500">🔄 ×{vueltas}</span>
          {aciertos > 0 && <span className="text-xs text-emerald-600 font-medium">🎯 {aciertos}%</span>}
          {dominado && <Badge variant="green">Dominado</Badge>}
        </div>
      </Card>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-4 py-3">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-lg font-bold text-slate-900">Temario</h1>
        </div>
      </header>
      <div className="p-4 max-w-2xl mx-auto space-y-6">
        <section>
          <h2 className="text-slate-900 font-bold text-sm">Bloque General</h2>
          <p className="text-slate-500 text-sm mb-3">Temas 1–23</p>
          <div className="space-y-2">{grupos.general.map(renderTema)}</div>
        </section>
        <section>
          <h2 className="text-slate-900 font-bold text-sm">Bloque Específico</h2>
          <p className="text-slate-500 text-sm mb-3">Temas 24–45</p>
          <div className="space-y-2">{grupos.especifico.map(renderTema)}</div>
        </section>
      </div>
    </div>
  )
}
