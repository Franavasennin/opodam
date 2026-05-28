import type { Tema } from '../../../types'

export const TEMAS_META = [
  { id: 1, titulo: "Carta de las Naciones Unidas y Derechos Humanos", bloque: 'general' },
  { id: 2, titulo: "Ley Orgánica 3/2007 para la igualdad efectiva de mujeres y hombres", bloque: 'general' },
  { id: 3, titulo: "Ley 31/1995 de Prevención de Riesgos Laborales", bloque: 'general' },
  { id: 4, titulo: "La Constitución Española de 1978", bloque: 'general' },
  { id: 5, titulo: "Derecho de la Unión Europea", bloque: 'general' },
  { id: 6, titulo: "Naciones Unidas: órganos y comisiones", bloque: 'general' },
  { id: 7, titulo: "El matrimonio y sus efectos (Derecho de familia)", bloque: 'general' },
  { id: 8, titulo: "Ley Orgánica 10/1995 del Código Penal", bloque: 'general' },
  { id: 9, titulo: "Ley de Enjuiciamiento Criminal", bloque: 'general' },
  { id: 10, titulo: "Ley 39/2015 del Procedimiento Administrativo Común", bloque: 'general' },
  { id: 11, titulo: "Ley Orgánica 3/2018 de Protección de Datos Personales", bloque: 'general' },
  { id: 12, titulo: "Ley Orgánica 4/2000 sobre derechos y libertades de los extranjeros en España", bloque: 'general' },
  { id: 13, titulo: "Ley Orgánica 4/2015 de Protección de la Seguridad Ciudadana", bloque: 'general' },
  { id: 14, titulo: "Real Decreto 207/2024: estructura orgánica de la Guardia Civil", bloque: 'general' },
  { id: 15, titulo: "Ley Orgánica 2/1986 de Fuerzas y Cuerpos de Seguridad", bloque: 'general' },
  { id: 16, titulo: "Ley 17/2015 del Sistema Nacional de Protección Civil", bloque: 'general' },
  { id: 17, titulo: "Ley 11/2022 General de Telecomunicaciones", bloque: 'general' },
  { id: 18, titulo: "Topografía: representación del terreno", bloque: 'general' },
  { id: 19, titulo: "Empleo de la fuerza y armas de fuego (principios básicos)", bloque: 'general' },
  { id: 20, titulo: "Ley Orgánica 5/2000 reguladora de la responsabilidad penal de los menores", bloque: 'general' },
  { id: 21, titulo: "Ley Orgánica 1/2004 de Protección Integral contra la Violencia de Género", bloque: 'general' },
  { id: 22, titulo: "Real Decreto 137/1993: Reglamento de Armas", bloque: 'general' },
  { id: 23, titulo: "Ley Orgánica 12/1995 de represión del contrabando", bloque: 'general' },
] as const

export type TemaMeta = typeof TEMAS_META[number]
export const TOTAL_TEMAS = TEMAS_META.length // 23

export async function cargarTema(id: number): Promise<Tema> {
  if (id < 1 || id > TOTAL_TEMAS) throw new Error(`Tema con id ${id} no encontrado`)
  const fileName = `tema-${String(id).padStart(2, '0')}`
  const modulo = await import(`./${fileName}.json`)
  return modulo.default as Tema
}
