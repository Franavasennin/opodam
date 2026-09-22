import { create } from 'zustand'
import { alCambiarSlug, alGuardarProgreso, getActiveSlug, getProgreso } from '../services/storage'
import type { Progreso } from '../types'

/**
 * Progreso del alumno en la oposición activa, compartido por toda la UI.
 *
 * Los servicios (progress, errores, examen, calibración, repaso espaciado,
 * sync…) siguen escribiendo con `saveProgreso`; storage avisa y este store se
 * actualiza. Así cualquier componente suscrito ve el cambio, también los que
 * llegan de la sincronización remota, sin reescribir los servicios.
 */
interface EstadoProgreso {
  /** Slug al que pertenece `progreso`. */
  slug: string
  progreso: Progreso
  /** Relee desde localStorage (p. ej. tras cambiar de oposición). */
  recargar: () => void
}

export const useProgresoStore = create<EstadoProgreso>()(set => ({
  slug: getActiveSlug(),
  progreso: getProgreso(),
  recargar: () => set({ slug: getActiveSlug(), progreso: getProgreso() }),
}))

alGuardarProgreso((slug, progreso) => useProgresoStore.setState({ slug, progreso }))
alCambiarSlug(() => useProgresoStore.getState().recargar())
