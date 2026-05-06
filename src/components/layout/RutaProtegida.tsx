// src/components/layout/RutaProtegida.tsx
import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { obtenerUsuario, obtenerPerfil } from '../../services/supabase'

type Estado = 'cargando' | 'sin-sesion' | 'sin-perfil' | 'ok'

export function RutaProtegida({ children }: { children: React.ReactNode }) {
  const [estado, setEstado] = useState<Estado>('cargando')

  useEffect(() => {
    async function verificar() {
      const usuario = await obtenerUsuario()
      if (!usuario) { setEstado('sin-sesion'); return }

      const perfil = await obtenerPerfil()
      if (!perfil || perfil.oposiciones.length === 0) { setEstado('sin-perfil'); return }

      setEstado('ok')
    }
    verificar()
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
