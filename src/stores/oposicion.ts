import { create } from 'zustand'
import { OPOSICIONES } from '../data/oposiciones'
import { alCambiarSlug, getActiveSlug, setActiveSlug } from '../services/storage'

/**
 * Oposición activa: fuente única del slug con el que se lee y guarda el
 * progreso. Persiste en localStorage (`opodam:active-slug`) a través de
 * storage.ts; si alguien llama a `setActiveSlug` directamente, el store se
 * entera por el aviso de storage y no se desincroniza.
 */
interface EstadoOposicion {
  slug: string
  /** Fija la oposición activa. Ignora slugs que no existen en OPOSICIONES. */
  activar: (slug: string) => void
}

export function esSlugConocido(slug: string): boolean {
  return OPOSICIONES.some(op => op.slug === slug)
}

export const useOposicionStore = create<EstadoOposicion>()(() => ({
  slug: getActiveSlug(),
  activar: (slug) => {
    if (esSlugConocido(slug)) setActiveSlug(slug)
  },
}))

alCambiarSlug(slug => useOposicionStore.setState({ slug }))
