import { useEffect } from 'react'
import { create } from 'zustand'
import type { User } from '@supabase/supabase-js'
import { esOwner, obtenerUsuario, supabase, tieneAccesoOposicion } from '../services/supabase'

/**
 * Sesión de Supabase compartida por toda la app.
 *
 * Antes cada guard llamaba a `obtenerUsuario()` al montar (un "Cargando…" por
 * navegación), el rol se pedía cuatro veces por separado y nadie salvo
 * AuthCallback escuchaba los cambios de sesión. Ahora hay una sola lectura
 * inicial + `onAuthStateChange`, y el rol y el acceso por oposición se cachean
 * por usuario (se vacían al cambiar de usuario o cerrar sesión).
 */
interface EstadoSesion {
  /** `lista` cuando ya se conoce el usuario (o que no lo hay). */
  estado: 'pendiente' | 'cargando' | 'lista'
  usuario: User | null
  /** owner/beta: pueden ver oposiciones privadas. `null` = aún no consultado. */
  puedeVerPrivadas: boolean | null
  /** Acceso por suscripción, por slug de oposición. */
  accesos: Record<string, boolean>
  iniciar: () => Promise<void>
  cargarRol: () => Promise<boolean>
  comprobarAcceso: (slug: string) => Promise<boolean>
}

/** Criterio común de los guards: sesión con email, no anónima. */
export function tieneCuenta(usuario: User | null): boolean {
  return !!usuario && !usuario.is_anonymous && !!usuario.email
}

const inicial = {
  estado: 'pendiente' as const,
  usuario: null,
  puedeVerPrivadas: null,
  accesos: {},
}

let inicio: Promise<void> | null = null
let suscripcion: { unsubscribe: () => void } | null = null
let rolEnCurso: Promise<boolean> | null = null
const accesosEnCurso = new Map<string, Promise<boolean>>()
// Sube al cambiar de usuario: una consulta lanzada con el usuario anterior
// no debe escribir su resultado en la caché del nuevo.
let generacion = 0

function olvidarCaches() {
  generacion += 1
  rolEnCurso = null
  accesosEnCurso.clear()
}

export const useSesionStore = create<EstadoSesion>()((set, get) => ({
  ...inicial,

  iniciar: () => {
    inicio ??= (async () => {
      set({ estado: 'cargando' })
      let usuario: User | null = null
      try { usuario = await obtenerUsuario() } catch { /* sin red: sin sesión */ }
      set({ usuario, estado: 'lista' })
      try {
        const cliente = supabase
        if (cliente) {
          suscripcion = cliente.auth.onAuthStateChange((_evento, session) => {
            const nuevo = session?.user ?? null
            if (nuevo?.id !== get().usuario?.id) {
              olvidarCaches()
              set({ usuario: nuevo, puedeVerPrivadas: null, accesos: {} })
            } else {
              set({ usuario: nuevo })
            }
          }).data.subscription
        }
      } catch { /* sin cliente de Supabase */ }
    })()
    return inicio
  },

  cargarRol: () => {
    const conocido = get().puedeVerPrivadas
    if (conocido != null) return Promise.resolve(conocido)
    if (!rolEnCurso) {
      const gen = generacion
      rolEnCurso = esOwner()
        .then(v => { if (gen === generacion) set({ puedeVerPrivadas: v }); return v })
        // Un fallo de red no se cachea: el siguiente montaje lo reintenta.
        .catch(() => false)
        .finally(() => { if (gen === generacion) rolEnCurso = null })
    }
    return rolEnCurso
  },

  comprobarAcceso: (slug) => {
    const conocido = get().accesos[slug]
    if (conocido != null) return Promise.resolve(conocido)
    let enCurso = accesosEnCurso.get(slug)
    if (!enCurso) {
      const gen = generacion
      enCurso = tieneAccesoOposicion(slug)
        // Fail-closed: un error cuenta como "sin acceso" (paywall) en vez de
        // dejar al guard esperando para siempre.
        .catch(() => false)
        .then(v => {
          if (gen === generacion) set(s => ({ accesos: { ...s.accesos, [slug]: v } }))
          return v
        })
        .finally(() => { if (gen === generacion) accesosEnCurso.delete(slug) })
      accesosEnCurso.set(slug, enCurso)
    }
    return enCurso
  },
}))

/** Solo para tests: vuelve al estado inicial y olvida cachés y suscripción. */
export function reiniciarSesionStore() {
  suscripcion?.unsubscribe()
  suscripcion = null
  inicio = null
  olvidarCaches()
  useSesionStore.setState(inicial)
}

/** Usuario actual; arranca la lectura de sesión la primera vez. */
export function useSesion(): { lista: boolean; usuario: User | null } {
  const estado = useSesionStore(s => s.estado)
  const usuario = useSesionStore(s => s.usuario)
  useEffect(() => { void useSesionStore.getState().iniciar() }, [])
  return { lista: estado === 'lista', usuario }
}

/** Si el usuario puede ver oposiciones marcadas `privado` (owner/beta). */
export function usePuedeVerPrivadas(): boolean {
  const puede = useSesionStore(s => s.puedeVerPrivadas)
  // iniciar() engancha onAuthStateChange, que vacía el rol al cambiar de
  // usuario; `puede` vuelve a null y este efecto lo pide de nuevo.
  useEffect(() => {
    const s = useSesionStore.getState()
    void s.iniciar()
    void s.cargarRol()
  }, [puede])
  return puede ?? false
}
