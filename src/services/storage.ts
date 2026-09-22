import type { Progreso } from '../types'

export const PROGRESO_KEY = 'opodam:progreso'

const ACTIVE_SLUG_KEY  = 'opodam:active-slug'
const OPOSICIONES_KEY  = 'opodam:oposiciones'
const EXAMEN_KEY_PREFIX = 'opodam:examen:'

/** Fecha del examen (ISO 'YYYY-MM-DD') configurada por el usuario para una oposición. */
export function getFechaExamen(slug: string): string | null {
  try { return localStorage.getItem(EXAMEN_KEY_PREFIX + slug) } catch { return null }
}

export function setFechaExamen(slug: string, iso: string): void {
  if (iso) localStorage.setItem(EXAMEN_KEY_PREFIX + slug, iso)
  else localStorage.removeItem(EXAMEN_KEY_PREFIX + slug)
}

export function getOposicionesLocales(): string[] {
  try {
    const raw = localStorage.getItem(OPOSICIONES_KEY)
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch { return [] }
}

export function setOposicionesLocales(oposiciones: string[]): void {
  localStorage.setItem(OPOSICIONES_KEY, JSON.stringify(oposiciones))
}
const DEFAULT_SLUG = 'cgpc'
const LEGACY_PROGRESO_KEY = PROGRESO_KEY

// Avisos de escritura. storage.ts sigue siendo la única vía de persistencia
// (los servicios leen y escriben aquí), y los stores de Zustand se suscriben
// para que toda la UI vea el mismo estado sin que cada servicio los conozca.
type OyenteSlug = (slug: string) => void
type OyenteProgreso = (slug: string, progreso: Progreso) => void
const oyentesSlug = new Set<OyenteSlug>()
const oyentesProgreso = new Set<OyenteProgreso>()

export function alCambiarSlug(fn: OyenteSlug): () => void {
  oyentesSlug.add(fn)
  return () => { oyentesSlug.delete(fn) }
}

export function alGuardarProgreso(fn: OyenteProgreso): () => void {
  oyentesProgreso.add(fn)
  return () => { oyentesProgreso.delete(fn) }
}

export function getActiveSlug(): string {
  return localStorage.getItem(ACTIVE_SLUG_KEY) ?? DEFAULT_SLUG
}

export function setActiveSlug(slug: string): void {
  const anterior = localStorage.getItem(ACTIVE_SLUG_KEY)
  localStorage.setItem(ACTIVE_SLUG_KEY, slug)
  if (anterior !== slug) oyentesSlug.forEach(fn => fn(slug))
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
  erroresPorPregunta: {},
  calibracion: { seguroAcierto: 0, seguroFallo: 0, dudoAcierto: 0, dudoFallo: 0 },
  tiempoPorTema: {},
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
  if (oyentesProgreso.size === 0) return
  // Copia: los servicios mutan el objeto que leyeron y el store debe ser inmutable.
  const slug = getActiveSlug()
  const copia = structuredClone(progreso)
  oyentesProgreso.forEach(fn => fn(slug, copia))
}

export function resetProgreso(): void {
  localStorage.removeItem(getProgresoKey())
  if (oyentesProgreso.size === 0) return
  const slug = getActiveSlug()
  const inicial = getProgreso()
  oyentesProgreso.forEach(fn => fn(slug, inicial))
}

export function exportarProgreso(): string {
  return JSON.stringify(getProgreso(), null, 2)
}

export function importarProgreso(json: string): void {
  saveProgreso(JSON.parse(json) as Progreso)
}
