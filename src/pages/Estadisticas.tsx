import { useProgress } from '../hooks/useProgress'
import { TEMAS_META } from '../data/topics'
import { ProgressBar } from '../components/ui/ProgressBar'
import { Card } from '../components/ui/Card'
import { PanelDebilidades } from '../components/ui/PanelDebilidades'

export function Estadisticas() {
  const { progreso } = useProgress()
  const horas = Math.floor(progreso.tiempoTotalSegundos / 3600)
  const mins  = Math.floor((progreso.tiempoTotalSegundos % 3600) / 60)

  const conDatos = TEMAS_META
    .map(m => ({
      ...m,
      vueltas: progreso.temas[String(m.id)]?.vueltas ?? 0,
      aciertos: progreso.temas[String(m.id)]?.porcentajeAciertos ?? 0,
    }))
    .filter(t => t.vueltas > 0)

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold pt-4">📊 Estadísticas</h1>
      <PanelDebilidades rendimiento={progreso.rendimientoPorTema} />
      <div className="grid grid-cols-2 gap-3">
        <Card className="text-center">
          <p className="text-3xl font-bold text-brand-600">{progreso.racha.dias}</p>
          <p className="text-xs text-gray-500 mt-1">Días de racha</p>
        </Card>
        <Card className="text-center">
          <p className="text-3xl font-bold text-brand-600">{horas}h {mins}m</p>
          <p className="text-xs text-gray-500 mt-1">Tiempo total</p>
        </Card>
      </div>
      {conDatos.length === 0
        ? <p className="text-gray-400 text-sm text-center py-8">Estudia algún tema para ver estadísticas.</p>
        : (
          <Card>
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Rendimiento por tema</h2>
            <div className="space-y-3">
              {conDatos.map(t => (
                <div key={t.id}>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>T{t.id} — {t.titulo.slice(0, 28)}</span>
                    <span>🔄×{t.vueltas} · 🎯{t.aciertos}%</span>
                  </div>
                  <ProgressBar
                    value={t.aciertos}
                    color={t.aciertos >= 80 ? 'green' : t.aciertos >= 50 ? 'blue' : 'orange'}
                  />
                </div>
              ))}
            </div>
          </Card>
        )
      }
    </div>
  )
}
