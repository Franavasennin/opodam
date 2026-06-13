// src/data/oposiciones.ts
export interface Oposicion {
  slug: string
  nombre: string
  descripcion: string
  disponible: boolean
  color: string
  numTemas?: number
  /** Segmentos de sección a ocultar para esta oposición (p. ej. 'psicotecnicos'). */
  ocultar?: string[]
  /**
   * Fracción de un acierto que se resta por cada error en la nota (0 = no penaliza).
   * Ej.: 1/3 → tres errores anulan un acierto. Default 1/3 si se omite.
   * ⚠️ Confirmar con las bases reales de cada convocatoria.
   */
  penalizacionPorError?: number
}

export const OPOSICIONES: Oposicion[] = [
  {
    slug: 'cgpc',
    nombre: 'Policía Canaria (CGPC)',
    descripcion: 'Cuerpo General de la Policía Canaria',
    disponible: true,
    color: '#2563eb',
    numTemas: 45,
    penalizacionPorError: 1 / 3,
  },
  {
    slug: 'policia-local',
    nombre: 'Policia Local',
    descripcion: 'Cuerpos de Policia Local',
    disponible: true,
    color: '#1d4ed8',
    numTemas: 37,
    penalizacionPorError: 1 / 3,
  },
  {
    slug: 'aux-enfermeria',
    nombre: 'Auxiliar de Enfermería',
    descripcion: 'Servicio Canario de Salud',
    disponible: true,
    color: '#0891b2',
    numTemas: 24,
    ocultar: ['psicotecnicos', 'supuestos', 'entrevista', 'personalidad'],
    penalizacionPorError: 1 / 3,
  },
  {
    slug: 'guardia-civil',
    nombre: 'Guardia Civil',
    descripcion: 'Ingreso en el Cuerpo de la Guardia Civil',
    disponible: true,
    color: '#15803d',
    numTemas: 25,
    penalizacionPorError: 1 / 3,
  },
  {
    slug: 'aux-judicial',
    nombre: 'Auxiliar Judicial',
    descripcion: 'Administración de Justicia',
    disponible: true,
    color: '#7c3aed',
    numTemas: 29,
    ocultar: ['psicotecnicos', 'entrevista', 'personalidad'],
    penalizacionPorError: 1 / 3,
  },
  {
    slug: 'tramitacion-judicial',
    nombre: 'Tramitación Judicial',
    descripcion: 'Administración de Justicia',
    disponible: true,
    color: '#b45309',
    numTemas: 31,
    ocultar: ['psicotecnicos', 'entrevista', 'personalidad'],
    penalizacionPorError: 1 / 3,
  },
]
