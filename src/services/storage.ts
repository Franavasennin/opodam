import type { Progreso } from '../types'

export const PROGRESO_KEY = 'opodam:progreso'

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
    const raw = localStorage.getItem(PROGRESO_KEY)
    if (!raw) return structuredClone(progresoInicial)
    const parsed = JSON.parse(raw) as Partial<Progreso>
    return { ...progresoInicial, ...parsed }
  } catch {
    return structuredClone(progresoInicial)
  }
}

export function saveProgreso(progreso: Progreso): void {
  localStorage.setItem(PROGRESO_KEY, JSON.stringify(progreso))
}

export function resetProgreso(): void {
  localStorage.removeItem(PROGRESO_KEY)
}

export function exportarProgreso(): string {
  return JSON.stringify(getProgreso(), null, 2)
}

export function importarProgreso(json: string): void {
  saveProgreso(JSON.parse(json) as Progreso)
}
