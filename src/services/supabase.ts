import { createClient } from '@supabase/supabase-js'
import type { Progreso, Perfil, EstadoAcceso } from '../types'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const supabase = (url && key) ? createClient(url, key, {
  auth: {
    flowType: 'implicit',   // magic link llega como #access_token= en el hash
    detectSessionInUrl: true,
  }
}) : null

export async function enviarMagicLink(email: string): Promise<{ error: string | null }> {
  if (!supabase) return { error: 'Supabase no configurado' }
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: window.location.origin },
  })
  return { error: error?.message ?? null }
}

export async function iniciarSesionAnonima(): Promise<{ error: string | null }> {
  if (!supabase) return { error: 'Supabase no configurado' }
  // Reutilizar la sesión existente (anónima o con email) si la hay
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()
  if (sessionError) {
    console.error('[iniciarSesionAnonima] getSession error:', sessionError.message)
    return { error: sessionError.message }
  }
  if (session?.user) return { error: null }
  const { error } = await supabase.auth.signInAnonymously()
  if (error) console.error('[iniciarSesionAnonima] Supabase error:', error.message)
  return { error: error?.message ?? null }
}

export async function cerrarSesion(): Promise<void> {
  await supabase?.auth.signOut()
}

export async function obtenerUsuario() {
  if (!supabase) return null
  const { data } = await supabase.auth.getSession()
  return data?.session?.user ?? null
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

// --- Perfil de usuario ---

export async function obtenerPerfil(): Promise<Perfil | null> {
  if (!supabase) return null
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user
  if (!user) return null

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error || !data) return null
  return data as Perfil
}

export async function crearPerfil(oposiciones: string[]): Promise<{ error: string | null }> {
  if (!supabase) return { error: 'Supabase no configurado' }
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user
  if (!user) return { error: 'No hay sesión activa' }

  const { error } = await supabase.from('profiles').upsert({
    id: user.id,
    email: user.email ?? '',
    oposiciones,
  })

  if (error) console.error('[crearPerfil] Supabase error:', error)
  return { error: error ? error.message : null }
}

/** Estado de acceso calculado en el servidor (RPC). Fail-open: ante error → 'activo'. */
export async function estadoAcceso(): Promise<EstadoAcceso> {
  if (!supabase) return 'activo'
  try {
    const { data, error } = await supabase.rpc('estado_acceso')
    if (error || data == null) return 'activo'
    return data as EstadoAcceso
  } catch {
    return 'activo'
  }
}

/** Marca el inicio del trial (now() del servidor) si aún no estaba marcado. */
export async function activarTrial(): Promise<void> {
  if (!supabase) return
  const user = await obtenerUsuario()
  if (!user) return
  // Solo escribe si trial_start es null, para no reiniciar la cuenta atrás
  const { data } = await supabase
    .from('profiles')
    .select('trial_start')
    .eq('id', user.id)
    .single()
  if (data && data.trial_start == null) {
    await supabase
      .from('profiles')
      .update({ trial_start: new Date().toISOString() })
      .eq('id', user.id)
  }
}
