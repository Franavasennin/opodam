// src/components/layout/RutaProtegida.tsx
import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase, obtenerPerfil } from '../../services/supabase'

type Estado = 'cargando' | 'sin-sesion' | 'sin-perfil' | 'ok'

export function RutaProtegida({ children }: { children: React.ReactNode }) {
  const [estado, setEstado] = useState<Estado>('cargando')

  useEffect(() => {
    if (!supabase) {
      setEstado('sin-sesion')
      return
    }

    // onAuthStateChange se dispara tanto con la sesión actual
    // como cuando Supabase procesa el token del magic link en la URL
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!session?.user) {
          setEstado('sin-sesion')
          return
        }

        const perfil = await obtenerPerfil()
        if (!perfil || perfil.oposiciones.length === 0) {
          setEstado('sin-perfil')
          return
        }

        setEstado('ok')
      }
    )

    return () => subscription.unsubscribe()
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
