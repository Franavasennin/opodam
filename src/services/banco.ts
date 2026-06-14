import type { Pregunta } from '../types'
import { supabase } from './supabase'

// ── P2.1 Banco inteligente de preguntas (lectura) ────────────
// El frontend SOLO lee preguntas 'activa' (la RLS lo garantiza). Se fusionan
// con las preguntas locales del JSON del tema para romper el techo de contenido
// en 3ª+ vuelta. La generación/auditoría vive en el backend (service-role).

export interface FilaBanco {
  id: string
  tema_id: number
  enunciado: string
  opciones: string[]
  correcta: number
  explicacion: string | null
}

/** Mapea una fila del banco al formato `Pregunta` de la app (con temaId). */
export function mapearFilaBanco(fila: FilaBanco): Pregunta & { temaId: number } {
  return {
    id: `banco-${fila.id}`,
    enunciado: fila.enunciado,
    opciones: fila.opciones,
    correcta: fila.correcta,
    explicacion: fila.explicacion ?? '',
    temaId: fila.tema_id,
  }
}

/** Clave de deduplicación: enunciado normalizado (sin espacios extra ni mayúsculas). */
function claveEnunciado(p: { enunciado: string }): string {
  return p.enunciado.trim().toLowerCase().replace(/\s+/g, ' ')
}

/**
 * Fusiona preguntas locales (JSON del tema) con las del banco, descartando del
 * banco las que dupliquen un enunciado ya presente en local. Las locales van
 * primero; el banco aporta variedad nueva.
 */
export function fusionarBanco<T extends { enunciado: string }>(local: T[], banco: T[]): T[] {
  const vistos = new Set(local.map(claveEnunciado))
  const extra = banco.filter(p => {
    const k = claveEnunciado(p)
    if (vistos.has(k)) return false
    vistos.add(k)
    return true
  })
  return [...local, ...extra]
}

/**
 * Descarga las preguntas 'activa' de un tema desde Supabase. Falla en silencio
 * (devuelve []) si no hay cliente, no hay sesión o hay error de red: el banco
 * es un extra, nunca un bloqueo.
 */
export async function cargarBancoActivo(
  oposicionSlug: string,
  temaId: number,
): Promise<Array<Pregunta & { temaId: number }>> {
  if (!supabase) return []
  try {
    const { data, error } = await supabase
      .from('banco_preguntas')
      .select('id, tema_id, enunciado, opciones, correcta, explicacion')
      .eq('oposicion_slug', oposicionSlug)
      .eq('tema_id', temaId)
      .eq('estado', 'activa')
    if (error || !Array.isArray(data)) return []
    return data.map(f => mapearFilaBanco(f as FilaBanco))
  } catch {
    return []
  }
}
