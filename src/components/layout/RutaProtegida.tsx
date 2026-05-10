// src/components/layout/RutaProtegida.tsx
import { useEffect, useRef, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../../services/supabase'
import type { Session } from '@supabase/supabase-js'

type Estado = 'cargando' | 'sin-sesion' | 'sin-perfil' | 'ok'

export function RutaProtegida({ children }: { children: React.ReactNode }) {
  const [estado, setEstado] = useState<Estado>('cargando')
  const resuelto = useRef(false)

  useEffect(() => {
    if (!supabase) { setEstado('sin-sesion'); return }

    let montado = true

    async function procesarSesion(session: Session | null) {
      if (!montado || resuelto.current) return
      try {
        if (!session?.user) { resuelto.current = true; setEstado('sin-sesion'); return }

        // Usamos session.user.id directamente — evita un segundo getUser() al servidor
        const { data } = await supabase!
          .from('profiles')
          .select('oposiciones')
          .eq('id', session.user.id)
          .single()

        if (!montado) return
        resuelto.current = true
        setEstado(!data || (data.oposiciones as string[]).length === 0 ? 'sin-perfil' : 'ok')
      } catch {
        if (montado) { resuelto.current = true; setEstado('sin-sesion') }
      }
    }

    // onAuthStateChange dispara INITIAL_SESSION con la sesión actual (o null),
    // y luego SIGNED_IN / SIGNED_OUT en cambios futuros.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        await procesarSesion(session)
      }
    )

    // Fallback: si en 8 segundos aún no se resolvió, asumir sin sesión
    const timeout = setTimeout(() => {
      if (montado && !resuelto.current) { resuelto.current = true; setEstado('sin-sesion') }
    }, 8000)

    return () => { montado = false; clearTimeout(timeout); subscription.unsubscribe() }
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
