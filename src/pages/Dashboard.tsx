import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProgress } from '../hooks/useProgress'
import { useNotifications } from '../hooks/useNotifications'
import { Card } from '../components/ui/Card'
import { ProgressBar } from '../components/ui/ProgressBar'
import { obtenerTopics } from '../data/topics'
import { temasPrioritarios, contarVueltasGlobal } from '../services/progress'
import { PanelDebilidades } from '../components/ui/PanelDebilidades'
import { obtenerSesionHoy } from '../services/adaptativo'

export function Dashboard() {
  const { progreso, actualizarNotificaciones } = useProgress()
  const { permiso, solicitarPermiso, programarRecordatorio } = useNotifications()
  const navigate = useNavigate()
  // Dashboard no esta montado en ninguna ruta con :slug; usa CGPC por defecto.
  const { TEMAS_META, TOTAL_TEMAS } = obtenerTopics('cgpc')

  useEffect(() => {
    if (permiso === 'granted' && progreso.notificaciones.activas) {
      programarRecordatorio(progreso.notificaciones.hora)
    }
  }, [permiso, progreso.notificaciones])

  const todosIds = TEMAS_META.map(t => t.id)
  const vueltaActual = contarVueltasGlobal(progreso.temas, TOTAL_TEMAS)
  const temasCompletados = todosIds.filter(
    id => (progreso.temas[String(id)]?.vueltas ?? 0) > vueltaActual
  ).length
  const prioridad = temasPrioritarios(progreso.temas, todosIds).slice(0, 3)
  const sesionHoy = obtenerSesionHoy()
  const porcentaje = Math.round((temasCompletados / TOTAL_TEMAS) * 100)

  async function activarNotificaciones() {
    const ok = await solicitarPermiso()
    if (ok) actualizarNotificaciones(progreso.notificaciones.hora, true)
  }

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-4">
      <header className="pt-4">
        <h1 className="text-2xl font-bold text-gray-900">Hola, opositor 👋</h1>
        <p className="text-gray-500 text-sm mt-1">
          Racha: <span className="font-semibold text-brand-600">{progreso.racha.dias} días</span> consecutivos
        </p>
      </header>

      <Card>
        <p className="text-sm font-medium text-gray-500 mb-1">
          Vuelta {vueltaActual + 1} — {temasCompletados}/{TOTAL_TEMAS} temas
        </p>
        <ProgressBar value={porcentaje} color="blue" />
        <p className="text-xs text-gray-400 mt-1">{porcentaje}% de esta vuelta completado</p>
      </Card>

      {prioridad.length > 0 && (
        <Card>
          <h2 className="text-sm font-semibold text-gray-700 mb-2">📌 Temas prioritarios</h2>
          <ul className="space-y-2">
            {prioridad.map(id => {
              const meta = TEMAS_META.find(t => t.id === id)!
              const vueltas = progreso.temas[String(id)]?.vueltas ?? 0
              return (
                <li key={id} onClick={() => navigate(`/temario/${id}`)}
                  className="flex items-center justify-between cursor-pointer hover:bg-gray-50 rounded-lg px-2 py-1">
                  <span className="text-sm text-gray-800">{meta.titulo}</span>
                  <span className="text-xs text-gray-400">🔄 ×{vueltas}</span>
                </li>
              )
            })}
          </ul>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Card onClick={() => navigate('/temario')} className="text-center">
          <div className="text-3xl mb-1">📚</div>
          <p className="text-sm font-medium">Ver temario</p>
        </Card>
        <Card onClick={() => navigate('/tests/simulacro')} className="text-center">
          <div className="text-3xl mb-1">📝</div>
          <p className="text-sm font-medium">Simulacro</p>
        </Card>
      </div>

      <Card
        onClick={() => navigate('/sesion-diaria')}
        className={`border-2 cursor-pointer ${
          sesionHoy.completada
            ? 'border-green-400 bg-green-50'
            : 'border-brand-300 bg-brand-50'
        }`}
      >
        <div className="flex items-center gap-3">
          <span className="text-3xl">{sesionHoy.completada ? '✅' : '⚡'}</span>
          <div>
            <p className="text-sm font-semibold">
              {sesionHoy.completada ? 'Sesión completada' : 'Sesión de hoy'}
            </p>
            <p className="text-xs text-gray-500">
              {sesionHoy.completada ? '¡Bien hecho! Hasta mañana.' : 'Flashcards + mini-test adaptativo'}
            </p>
          </div>
        </div>
      </Card>

      <PanelDebilidades rendimiento={progreso.rendimientoPorTema} />

      {permiso !== 'granted' && (
        <Card className="bg-brand-50 border-brand-100">
          <p className="text-sm text-brand-800 mb-2">🔔 Activa recordatorios diarios</p>
          <button onClick={activarNotificaciones}
            className="w-full bg-brand-600 text-white rounded-xl py-2 text-sm font-semibold hover:bg-brand-700 transition-colors">
            Activar recordatorios
          </button>
        </Card>
      )}
    </div>
  )
}
