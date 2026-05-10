// src/components/layout/RutaProtegida.tsx
import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase, obtenerPerfil } from '../../services/supabase'
import type { Session } from '@supabase/supabase-js'

type Estado = 'cargando' | 'sin-sesion' | 'sin-perfil' | 'ok'

export function RutaProtegida({ children }: { children: React.ReactNode }) {
  const [estado, setEstado] = useState<Estado>('cargando')

  useEffect(() => {
    if (!supabase) { setEstado('sin-sesion'); return }

    let montado = true

    async function procesarSesion(session: Session | null) {
      if (!montado) return
      if (!session?.user) { setEstado('sin-sesion'); return }
      const perfil = await obtenerPerfil()
      if (!montado) return
      setEstado(!perfil || perfil.oposiciones.length === 0 ? 'sin-perfil' : 'ok')
    }

    // getSession() espera a que Supabase termine de inicializarse,
    // incluyendo el intercambio del token del magic link de la URL.
    supabase.auth.getSession().then(({ data: { session } }) => procesarSesion(session))

    // onAuthStateChange cubre cambios futuros (cerrar sesión, renovar token…).
    // Ignoramos INITIAL_SESSION porque ya lo gestiona getSession() arriba.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'INITIAL_SESSION') return
        await procesarSesion(session)
      }
    )

    return () => { montado = false; subscription.unsubscribe() }
  }, [])

  if (estado === 'cargando') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-slate-500 text-sm">Cargando...</div>
      </div>
    )
  }

  if (estado === 'sin-sesion') return <Navigate to="/onboarding/email" replace />
  if (estado === 'sin-perfil') return <Navigate to="/onboarding/oposicion" replace />

  return <>{children}</>
}
