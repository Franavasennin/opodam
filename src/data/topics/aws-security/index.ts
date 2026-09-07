import type { Tema } from '../../../types'

// Granularidad = task statements oficiales de la guía de examen SCS-C03
// (docs.aws.amazon.com/aws-certification/latest/security-specialty-03), no
// dominios completos. Antes había 1 tema por dominio (6), comprimiendo 2-3
// task statements en un único bloque de ~2500 caracteres — el mismo problema
// que Security+ documentó y corrigió: "el script trunca la teoría... explica
// por qué todos los temas nacieron con 8 preguntas".
export const TEMAS_META = [
  { id: 1,  titulo: '1.1 · Monitorización y alertas',                bloque: 'general' },
  { id: 2,  titulo: '1.2 · Diseño de soluciones de logging',          bloque: 'general' },
  { id: 3,  titulo: '1.3 · Troubleshooting de monitorización y logging', bloque: 'general' },
  { id: 4,  titulo: '2.1 · Diseño y prueba del plan de respuesta',    bloque: 'general' },
  { id: 5,  titulo: '2.2 · Respuesta a eventos de seguridad',         bloque: 'general' },
  { id: 6,  titulo: '3.1 · Seguridad de servicios de borde (edge)',   bloque: 'general' },
  { id: 7,  titulo: '3.2 · Seguridad de cargas de trabajo (compute)', bloque: 'general' },
  { id: 8,  titulo: '3.3 · Controles de seguridad de red',            bloque: 'general' },
  { id: 9,  titulo: '4.1 · Estrategias de autenticación',             bloque: 'general' },
  { id: 10, titulo: '4.2 · Estrategias de autorización',              bloque: 'general' },
  { id: 11, titulo: '5.1 · Datos en tránsito',                        bloque: 'general' },
  { id: 12, titulo: '5.2 · Datos en reposo',                          bloque: 'general' },
  { id: 13, titulo: '5.3 · Secretos, credenciales y claves',          bloque: 'general' },
  { id: 14, titulo: '6.1 · Gestión centralizada de cuentas',          bloque: 'general' },
  { id: 15, titulo: '6.2 · Despliegue seguro y consistente',          bloque: 'general' },
  { id: 16, titulo: '6.3 · Evaluación de cumplimiento',               bloque: 'general' },
] as const

export type TemaMeta = typeof TEMAS_META[number]
export const TOTAL_TEMAS = TEMAS_META.length // 16

export async function cargarTema(id: number): Promise<Tema> {
  if (id < 1 || id > TOTAL_TEMAS) throw new Error(`Tema con id ${id} no encontrado`)
  const fileName = `tema-${String(id).padStart(2, '0')}`
  const modulo = await import(`./${fileName}.json`)
  return modulo.default as Tema
}
