import type { Tema } from '../../types'
import * as cgpc from './cgpc/index'
import * as policiaLocal from './policia-local/index'
import * as auxEnfermeria from './aux-enfermeria/index'
import * as guardiaCivil from './guardia-civil/index'
import * as tramitacionJudicial from './tramitacion-judicial/index'
import * as auxJudicial from './aux-judicial/index'
import * as securityPlus from './security-plus/index'

export interface ModuloTopics {
  TEMAS_META: ReadonlyArray<{ id: number; titulo: string; bloque: string }>
  TOTAL_TEMAS: number
  cargarTema: (id: number) => Promise<Tema>
}

const MODULOS: Record<string, ModuloTopics> = {
  'cgpc': cgpc,
  'policia-local': policiaLocal,
  'aux-enfermeria': auxEnfermeria,
  'guardia-civil': guardiaCivil,
  'tramitacion-judicial': tramitacionJudicial,
  'aux-judicial': auxJudicial,
  'security-plus': securityPlus,
}

export function obtenerTopics(slug: string): ModuloTopics {
  const modulo = MODULOS[slug]
  if (!modulo) throw new Error(`Oposicion sin topics: ${slug}`)
  return modulo
}

// Compatibilidad: re-export de CGPC para consumidores que aun no pasan slug.
export { TEMAS_META, TOTAL_TEMAS, cargarTema } from './cgpc/index'
export type { TemaMeta } from './cgpc/index'
