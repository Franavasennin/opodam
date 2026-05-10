// src/pages/auth/AuthCallback.tsx
// Ruta de destino del magic link. Supabase procesa el token del hash aquí,
// sin que React Router lo elimine con un redirect previo.
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../services/supabase'
import { getOposicionesLocales } from '../../services/storage'
import type { Session } from '@supabase/supabase-js'

export default function AuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    if (!supabase) {
      navigate('/onboarding/email', { replace: true })
      return
    }

    let procesado = false

    async function procesarSesion(session: Session | null) {
      if (procesado || !session?.user) return
      procesado = true

      try {
        // Consulta directa al perfil usando session.user.id — evita getUser() al servidor
        const { data } = await supabase!
          .from('profiles')
          .select('oposiciones')
          .eq('id', session.user.id)
          .single()

        const tieneRemoto = data && (data.oposiciones as string[]).length > 0
        if (tieneRemoto) {
          navigate('/mis-oposiciones', { replace: true })
          return
        }
      } catch {
        // profiles table puede no existir aún — usamos fallback local
      }

      // Fallback: si hay oposiciones guardadas localmente, ir directamente a la app
      const locales = getOposicionesLocales()
      navigate(
        locales.length > 0 ? '/mis-oposiciones' : '/onboarding/oposicion',
        { replace: true }
      )
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        await procesarSesion(session)
      }
    )

    // Fallback: si en 10 segundos no hay sesión, volver al login
    const timeout = setTimeout(
      () => { if (!procesado) navigate('/onboarding/email', { replace: true }) },
      10000
    )

    return () => { subscription.unsubscribe(); clearTimeout(timeout) }
  }, [navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <p className="text-slate-500 text-sm">Verificando sesión…</p>
    </div>
  )
}
