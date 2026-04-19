import { useState, useCallback } from 'react'
import { getProgreso, saveProgreso } from '../services/storage'
import { registrarEstudio, completarVuelta, guardarResultadoTest } from '../services/progress'
import type { Progreso } from '../types'

export function useProgress() {
  const [progreso, setProgreso] = useState<Progreso>(() => getProgreso())

  const refrescar = useCallback(() => setProgreso(getProgreso()), [])

  const marcarTeoriaLeida = useCallback((temaId: number) => {
    registrarEstudio(temaId)
    refrescar()
  }, [refrescar])

  const marcarVueltaCompleta = useCallback((temaId: number) => {
    completarVuelta(temaId)
    refrescar()
  }, [refrescar])

  const guardarTest = useCallback((temaId: number, aciertos: number, errores: number, total: number) => {
    guardarResultadoTest(temaId, aciertos, errores, total)
    refrescar()
  }, [refrescar])

  const actualizarNotificaciones = useCallback((hora: string, activas: boolean) => {
    const p = getProgreso()
    p.notificaciones = { hora, activas }
    saveProgreso(p)
    refrescar()
  }, [refrescar])

  return { progreso, marcarTeoriaLeida, marcarVueltaCompleta, guardarTest, actualizarNotificaciones, refrescar }
}
