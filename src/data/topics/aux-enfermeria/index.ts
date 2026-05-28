import type { Tema } from '../../../types'

export const TEMAS_META = [
  { id: 1,  titulo: 'Derechos y obligaciones. Ley 31/1995 de Prevención de Riesgos Laborales', bloque: 'general' },
  { id: 2,  titulo: 'Funciones del Técnico en Cuidados Auxiliares de Enfermería (TCAE)', bloque: 'general' },
  { id: 3,  titulo: 'Higiene del recién nacido y del adulto', bloque: 'general' },
  { id: 4,  titulo: 'El paciente encamado', bloque: 'general' },
  { id: 5,  titulo: 'La exploración', bloque: 'general' },
  { id: 6,  titulo: 'Constantes vitales', bloque: 'general' },
  { id: 7,  titulo: 'Vigilancia del enfermo', bloque: 'general' },
  { id: 8,  titulo: 'Eliminación', bloque: 'general' },
  { id: 9,  titulo: 'Recogida de muestras y residuos', bloque: 'general' },
  { id: 10, titulo: 'Alimentación', bloque: 'general' },
  { id: 11, titulo: 'Medicamentos', bloque: 'general' },
  { id: 12, titulo: 'Aplicación de frío y calor', bloque: 'general' },
  { id: 13, titulo: 'Oxigenoterapia', bloque: 'general' },
  { id: 14, titulo: 'Higiene de centros sanitarios', bloque: 'general' },
  { id: 15, titulo: 'Desinfección y asepsia', bloque: 'general' },
  { id: 16, titulo: 'Esterilización', bloque: 'general' },
  { id: 17, titulo: 'La gestante', bloque: 'general' },
  { id: 18, titulo: 'Recién nacido y lactante', bloque: 'general' },
  { id: 19, titulo: 'Traumatismos', bloque: 'general' },
  { id: 20, titulo: 'Paciente terminal, toxicomanías, salud mental y el anciano', bloque: 'general' },
  { id: 21, titulo: 'Úlceras por presión (UPP)', bloque: 'general' },
  { id: 22, titulo: 'Urgencias', bloque: 'general' },
  { id: 23, titulo: 'Salud laboral', bloque: 'general' },
  { id: 24, titulo: 'Documentación sanitaria', bloque: 'general' },
] as const

export type TemaMeta = typeof TEMAS_META[number]
export const TOTAL_TEMAS = TEMAS_META.length // 24

export async function cargarTema(id: number): Promise<Tema> {
  if (id < 1 || id > TOTAL_TEMAS) throw new Error(`Tema con id ${id} no encontrado`)
  const fileName = `tema-${String(id).padStart(2, '0')}`
  const modulo = await import(`./${fileName}.json`)
  return modulo.default as Tema
}
