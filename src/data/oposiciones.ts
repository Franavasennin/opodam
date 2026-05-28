// src/data/oposiciones.ts
export interface Oposicion {
  slug: string
  nombre: string
  descripcion: string
  disponible: boolean
  color: string
  numTemas?: number
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
  },
  {
    slug: 'guardia-civil',
    nombre: 'Guardia Civil',
    descripcion: 'Ingreso en el Cuerpo de la Guardia Civil',
    disponible: true,
    color: '#15803d',
    numTemas: 23,
  },
  {
    slug: 'aux-judicial',
    nombre: 'Auxiliar Judicial',
    descripcion: 'Administración de Justicia',
    disponible: false,
    color: '#7c3aed',
  },
  {
    slug: 'tramitacion-judicial',
    nombre: 'Tramitación Judicial',
    descripcion: 'Administración de Justicia',
    disponible: false,
    color: '#b45309',
  },
]
