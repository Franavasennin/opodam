import { useCallback } from 'react'
import { getProgreso, saveProgreso } from '../services/storage'
import { registrarEstudio, completarVuelta, guardarResultadoTest, registrarTiempoTema } from '../services/progress'
import { useProgresoStore } from '../stores/progreso'

/**
 * Progreso de la oposición activa + acciones. Lee del store compartido, así
 * que todos los componentes ven el mismo estado: cualquier `saveProgreso`
 * (de este hook o de otro servicio) los actualiza a la vez.
 */
export function useProgress() {
  const progreso = useProgresoStore(s => s.progreso)

  // Se conserva por compatibilidad: con el store ya no hace falta llamarlo
  // tras guardar, pero relee localStorage si algo lo cambió por otra vía.
  const refrescar = useCallback(() => useProgresoStore.getState().recargar(), [])

  const marcarTeoriaLeida = useCallback((temaId: number) => {
    registrarEstudio(temaId)
  }, [])

  const marcarVueltaCompleta = useCallback((temaId: number) => {
    completarVuelta(temaId)
  }, [])

  const guardarTest = useCallback((temaId: number, aciertos: number, errores: number, total: number) => {
    guardarResultadoTest(temaId, aciertos, errores, total)
  }, [])

  const actualizarNotificaciones = useCallback((hora: string, activas: boolean) => {
    const p = getProgreso()
    p.notificaciones = { hora, activas }
    saveProgreso(p)
  }, [])

  // P2.4: telemetría de fondo; el cronómetro vuelca cada 30 s, no por tick.
  const registrarTiempo = useCallback((temaId: number, segundos: number) => {
    registrarTiempoTema(temaId, segundos)
  }, [])

  return { progreso, marcarTeoriaLeida, marcarVueltaCompleta, guardarTest, actualizarNotificaciones, registrarTiempo, refrescar }
}
