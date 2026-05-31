// src/services/tutorHistorial.ts
// Persistencia del historial del tutor en Supabase. Tolerante a fallos:
// ante cualquier error devuelve [] (cargar) o no lanza (guardar).

import { supabase, obtenerUsuario } from './supabase'
import type { MensajeTutor } from './tutor'

const TABLA = 'tutor_conversaciones'

export async function cargarHistorial(oposicion: string, temaId: number): Promise<MensajeTutor[]> {
  try {
    if (!supabase) return []
    const user = await obtenerUsuario()
    if (!user) return []
    const { data } = await supabase
      .from(TABLA)
      .select('mensajes')
      .eq('oposicion', oposicion)
      .eq('tema_id', temaId)
      .single()
    const mensajes = data?.mensajes
    return Array.isArray(mensajes) ? (mensajes as MensajeTutor[]) : []
  } catch {
    return []
  }
}

export async function guardarHistorial(
  oposicion: string,
  temaId: number,
  mensajes: MensajeTutor[],
): Promise<void> {
  try {
    if (!supabase) return
    const user = await obtenerUsuario()
    if (!user) return
    await supabase.from(TABLA).upsert(
      { user_id: user.id, oposicion, tema_id: temaId, mensajes, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,oposicion,tema_id' },
    )
  } catch {
    /* degradación elegante: el chat sigue en memoria */
  }
}

const TABLA_GLOBAL = 'tutor_global_conversaciones'

export async function cargarHistorialGlobal(oposicion: string): Promise<MensajeTutor[]> {
  try {
    if (!supabase) return []
    const user = await obtenerUsuario()
    if (!user) return []
    const { data } = await supabase
      .from(TABLA_GLOBAL)
      .select('mensajes')
      .eq('oposicion', oposicion)
      .single()
    const mensajes = data?.mensajes
    return Array.isArray(mensajes) ? (mensajes as MensajeTutor[]) : []
  } catch {
    return []
  }
}

export async function guardarHistorialGlobal(oposicion: string, mensajes: MensajeTutor[]): Promise<void> {
  try {
    if (!supabase) return
    const user = await obtenerUsuario()
    if (!user) return
    await supabase.from(TABLA_GLOBAL).upsert(
      { user_id: user.id, oposicion, mensajes, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,oposicion' },
    )
  } catch {
    /* degradación elegante: el chat sigue en memoria */
  }
}
