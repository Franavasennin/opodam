import type { Tema } from '../../../types'

export const TEMAS_META = [
  { id: 1, titulo: '1.1 · Controles de seguridad', bloque: 'general' },
  { id: 2, titulo: '1.2 · Conceptos fundamentales de seguridad', bloque: 'general' },
  { id: 3, titulo: '1.3 · Gestión del cambio', bloque: 'general' },
  { id: 4, titulo: '1.4 · Criptografía e infraestructura de clave pública', bloque: 'general' },
  { id: 5, titulo: '2.1 · Actores de amenaza', bloque: 'general' },
  { id: 6, titulo: '2.2 · Vectores de amenaza e ingeniería social', bloque: 'general' },
  { id: 7, titulo: '2.3 · Vulnerabilidades de software y aplicaciones', bloque: 'general' },
  { id: 8, titulo: '2.3 · Vulnerabilidades de hardware, nube y cadena de suministro', bloque: 'general' },
  { id: 9, titulo: '2.4 · Malware y ataques físicos', bloque: 'general' },
  { id: 10, titulo: '2.4 · Ataques de red, aplicación y criptográficos', bloque: 'general' },
  { id: 11, titulo: '2.5 · Mitigación y hardening', bloque: 'general' },
  { id: 12, titulo: '3.1 · Arquitectura e infraestructura', bloque: 'general' },
  { id: 13, titulo: '3.2 · Diseño de redes seguras', bloque: 'general' },
  { id: 14, titulo: '3.3 · Protección de datos', bloque: 'general' },
  { id: 15, titulo: '3.4 · Resiliencia y recuperación', bloque: 'general' },
  { id: 16, titulo: '4.1 · Bastionado y líneas base seguras', bloque: 'general' },
  { id: 17, titulo: '4.2 · Gestión de activos', bloque: 'general' },
  { id: 18, titulo: '4.3 · Gestión de vulnerabilidades', bloque: 'general' },
  { id: 19, titulo: '4.4 · Monitorización de seguridad', bloque: 'general' },
  { id: 20, titulo: '4.5 · Herramientas y protocolos de seguridad', bloque: 'general' },
  { id: 21, titulo: '4.6 · Gestión de identidad y accesos', bloque: 'general' },
  { id: 22, titulo: '4.7 · Scripting y automatización', bloque: 'general' },
  { id: 23, titulo: '4.8 · Respuesta a incidentes', bloque: 'general' },
  { id: 24, titulo: '4.9 · Gestión de logs', bloque: 'general' },
  { id: 25, titulo: '5.1 · Políticas y gobernanza de seguridad', bloque: 'general' },
  { id: 26, titulo: '5.2 · Gestión de riesgos', bloque: 'general' },
  { id: 27, titulo: '5.3 · Riesgo de terceros', bloque: 'general' },
  { id: 28, titulo: '5.4 · Cumplimiento normativo y privacidad', bloque: 'general' },
  { id: 29, titulo: '5.5 · Auditorías y pentesting', bloque: 'general' },
  { id: 30, titulo: '5.6 · Concienciación en seguridad', bloque: 'general' },
] as const

export type TemaMeta = typeof TEMAS_META[number]
export const TOTAL_TEMAS = TEMAS_META.length // 30

export async function cargarTema(id: number): Promise<Tema> {
  if (id < 1 || id > TOTAL_TEMAS) throw new Error(`Tema con id ${id} no encontrado`)
  const fileName = `tema-${String(id).padStart(2, '0')}`
  const modulo = await import(`./${fileName}.json`)
  return modulo.default as Tema
}
