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
}

export const OPOSICIONES: Oposicion[] = [
  {
    slug: 'cgpc',
    nombre: 'Policía Canaria (CGPC)',
    descripcion: 'Cuerpo General de la Policía Canaria',
    disponible: true,
    color: '#2563eb',
    numTemas: 45,
  },
  {
    slug: 'policia-local',
    nombre: 'Policia Local',
    descripcion: 'Cuerpos de Policia Local',
    disponible: true,
    color: '#1d4ed8',
    numTemas: 37,
  },
  {
    slug: 'aux-enfermeria',
    nombre: 'Auxiliar de Enfermería',
    descripcion: 'Servicio Canario de Salud',
    disponible: true,
    color: '#0891b2',
    numTemas: 24,
    ocultar: ['psicotecnicos', 'supuestos', 'entrevista', 'personalidad'],
  },
  {
    slug: 'guardia-civil',
    nombre: 'Guardia Civil',
    descripcion: 'Ingreso en el Cuerpo de la Guardia Civil',
    disponible: true,
    color: '#15803d',
    numTemas: 25,
  },
  {
    slug: 'aux-judicial',
    nombre: 'Auxiliar Judicial',
    descripcion: 'Administración de Justicia',
    disponible: true,
    color: '#7c3aed',
    numTemas: 29,
    ocultar: ['psicotecnicos', 'entrevista', 'personalidad'],
  },
  {
    slug: 'tramitacion-judicial',
    nombre: 'Tramitación Judicial',
    descripcion: 'Administración de Justicia',
    disponible: true,
    color: '#b45309',
    numTemas: 31,
    ocultar: ['psicotecnicos', 'entrevista', 'personalidad'],
  },
]
