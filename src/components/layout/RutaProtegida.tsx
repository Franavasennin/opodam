// src/components/layout/RutaProtegida.tsx
// Verifica que haya sesión Supabase activa antes de dejar pasar.
// Si Supabase no está configurado (dev local sin .env), deja pasar siempre.
import { useEffect, useState, type ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../../services/supabase'

type Estado = 'cargando' | 'autenticado' | 'no-autenticado'

export function RutaProtegida({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<Estado>('cargando')

  useEffect(() => {
    // Si no hay Supabase configurado, dejar pasar (dev local sin .env)
    if (!supabase) {
      setEstado('autenticado')
      return
    }

    supabase.auth.getSession().then(({ data }) => {
      setEstado(data.session ? 'autenticado' : 'no-autenticado')
    }).catch(() => setEstado('no-autenticado'))

    // Escuchar cambios de sesión (ej. magic link procesado en otra pestaña)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setEstado(session ? 'autenticado' : 'no-autenticado')
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  if (estado === 'cargando') {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: 'var(--bg)', color: 'var(--mute)', fontSize: 14 }}>
        Verificando sesión…
      </div>
    )
  }

  if (estado === 'no-autenticado') {
    return <Navigate to="/onboarding/email" replace />
  }

  return <>{children}</>
}
