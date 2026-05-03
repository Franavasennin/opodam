import { createClient } from '@supabase/supabase-js'
import type { Progreso } from '../types'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const supabase = (url && key) ? createClient(url, key) : null

export async function enviarMagicLink(email: string): Promise<{ error: string | null }> {
  if (!supabase) return { error: 'Supabase no configurado' }
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: window.location.origin },
  })
  return { error: error?.message ?? null }
}

export async function cerrarSesion(): Promise<void> {
  await supabase?.auth.signOut()
}

export async function obtenerUsuario() {
  if (!supabase) return null
  const { data } = await supabase.auth.getUser()
  return data?.user ?? null
}

export async function cargarProgresoRemoto(): Promise<Progreso | null> {
  if (!supabase) return null
  const user = await obtenerUsuario()
  if (!user) return null
  const { data } = await supabase
    .from('progreso')
    .select('data')
    .eq('user_id', user.id)
    .single()
  return (data?.data as Progreso) ?? null
}

export async function guardarProgresoRemoto(progreso: Progreso): Promise<void> {
  if (!supabase) return
  const user = await obtenerUsuario()
  if (!user) return
  await supabase.from('progreso').upsert({
    user_id:    user.id,
    data:       progreso,
    updated_at: new Date().toISOString(),
  })
}
