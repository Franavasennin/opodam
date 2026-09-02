import type { NombreIcono } from '../ui/Icon'

/**
 * Fuente única de la navegación dentro de una oposición.
 *
 * Antes esta lista vivía duplicada y desincronizada en tres sitios:
 *   - DesktopShell.tsx  → 10 destinos, rutas correctas /oposicion/:slug/*
 *   - SideNav.tsx       →  7 destinos, rutas obsoletas /temario, /tests…
 *   - BottomNav.tsx     →  6 destinos, rutas obsoletas y SIN "Tests"
 * Los dos últimos eran código muerto (nadie los montaba), así que por debajo
 * de 1024px sencillamente no había navegación. Ahora hay una sola lista.
 */
export interface ItemNav {
  label: string
  /** Etiqueta corta para la barra inferior móvil (máx. ~8 caracteres). */
  labelCorta?: string
  /** Segmento de ruta tras /oposicion/:slug. Cadena vacía = resumen. */
  seg: string
  icono: NombreIcono
}

export const NAV_OPOSICION: ItemNav[] = [
  { label: 'Resumen',            labelCorta: 'Resumen', seg: '',              icono: 'resumen' },
  { label: 'Temario',            labelCorta: 'Temario', seg: 'temario',       icono: 'temario' },
  { label: 'Flashcards',         labelCorta: 'Fichas',  seg: 'flashcards',    icono: 'flashcards' },
  { label: 'Tests y simulacros', labelCorta: 'Tests',   seg: 'tests',         icono: 'tests' },
  { label: 'Tutor',              labelCorta: 'Tutor',   seg: 'tutor',         icono: 'tutor' },
  { label: 'Psicotécnicos',      labelCorta: 'Psico',   seg: 'psicotecnicos', icono: 'psicotecnicos' },
  { label: 'Supuestos',          labelCorta: 'Casos',   seg: 'supuestos',     icono: 'supuestos' },
  { label: 'Entrevista',         labelCorta: 'Entrev.', seg: 'entrevista',    icono: 'entrevista' },
  { label: 'Personalidad',       labelCorta: 'Person.', seg: 'personalidad',  icono: 'personalidad' },
  { label: 'Estadísticas',       labelCorta: 'Stats',   seg: 'estadisticas',  icono: 'estadisticas' },
]

/**
 * Destinos que ocupan la barra inferior en móvil: los del uso diario
 * (estudiar → repasar → autoevaluarse). El resto vive tras "Más", para no
 * pasar de 5 pestañas en una barra táctil.
 */
export const SEGS_MOVIL_PRIMARIOS: readonly string[] = ['', 'temario', 'flashcards', 'tests']

/** Construye la URL de un destino dentro de una oposición. */
export function rutaNav(slug: string, seg: string): string {
  return `/oposicion/${slug}${seg ? `/${seg}` : ''}`
}

/** Aplica la lista de secciones ocultas de cada oposición. */
export function navVisible(ocultar: string[] | undefined): ItemNav[] {
  if (!ocultar?.length) return NAV_OPOSICION
  return NAV_OPOSICION.filter(item => !ocultar.includes(item.seg))
}
