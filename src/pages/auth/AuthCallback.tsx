// src/pages/auth/AuthCallback.tsx
// Ruta de destino del magic link. Supabase procesa el token del hash aquí,
// sin que React Router lo elimine con un redirect previo.
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, obtenerPerfil } from '../../services/supabase'

export default function AuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    if (!supabase) {
      navigate('/onboarding/email', { replace: true })
      return
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!session?.user) return // Esperando a que Supabase procese el token
        const perfil = await obtenerPerfil()
        navigate(
          !perfil || perfil.oposiciones.length === 0
            ? '/onboarding/oposicion'
            : '/mis-oposiciones',
          { replace: true }
        )
      }
    )

    // Fallback: si en 8 segundos no hay sesión, volver al login
    const timeout = setTimeout(
      () => navigate('/onboarding/email', { replace: true }),
      8000
    )

    return () => { subscription.unsubscribe(); clearTimeout(timeout) }
  }, [navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <p className="text-slate-500 text-sm">Verificando sesión…</p>
    </div>
  )
}
