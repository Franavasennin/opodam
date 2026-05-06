import type { Progreso } from '../types'

export const PROGRESO_KEY = 'opodam:progreso'

const ACTIVE_SLUG_KEY = 'opodam:active-slug'
const DEFAULT_SLUG = 'cgpc'
const LEGACY_PROGRESO_KEY = 'opodam:progreso'

export function getActiveSlug(): string {
  return localStorage.getItem(ACTIVE_SLUG_KEY) ?? DEFAULT_SLUG
}

export function setActiveSlug(slug: string): void {
  localStorage.setItem(ACTIVE_SLUG_KEY, slug)
}

export function getProgresoKey(slug?: string): string {
  return `opodam:${slug ?? getActiveSlug()}:progreso`
}

export function migrarProgresoLegado(): void {
  const legacy = localStorage.getItem(LEGACY_PROGRESO_KEY)
  if (!legacy) return
  const newKey = getProgresoKey('cgpc')
  if (!localStorage.getItem(newKey)) {
    localStorage.setItem(newKey, legacy)
  }
  localStorage.removeItem(LEGACY_PROGRESO_KEY)
}

const progresoInicial: Progreso = {
  temas: {},
  flashcards: {},
  racha: { dias: 0, ultimoEstudio: null },
  tiempoTotalSegundos: 0,
  notificaciones: { hora: '19:00', activas: false },
  historialExamenes: [],
  sesionDiaria: null,
  rendimientoPorTema: {},
}

export function getProgreso(): Progreso {
  try {
    const raw = localStorage.getItem(getProgresoKey())
    if (!raw) return structuredClone(progresoInicial)
    const parsed = JSON.parse(raw) as Partial<Progreso>
    return { ...progresoInicial, ...parsed }
  } catch {
    return structuredClone(progresoInicial)
  }
}

export function saveProgreso(progreso: Progreso): void {
  localStorage.setItem(getProgresoKey(), JSON.stringify(progreso))
}

export function resetProgreso(): void {
  localStorage.removeItem(getProgresoKey())
}

export function exportarProgreso(): string {
  return JSON.stringify(getProgreso(), null, 2)
}

export function importarProgreso(json: string): void {
  saveProgreso(JSON.parse(json) as Progreso)
}
