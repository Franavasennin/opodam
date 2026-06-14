import { useEffect, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { obtenerUsuario, estadoAcceso, tieneAccesoOposicion } from '../../services/supabase'
import { rutaDesdeEstado } from '../../services/suscripcion'

function Cargando() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
      <span style={{ color: 'var(--mute)', fontSize: 14 }}>Cargando…</span>
    </div>
  )
}

type Fase = 'cargando' | 'render' | 'onboarding' | 'interno' | 'externo'

const URL_EXPIRACION =
  (import.meta.env.VITE_URL_EXPIRACION as string | undefined) ??
  'https://opodam.vercel.app/precios'

export function RutaProtegida({ children }: { children: React.ReactNode }) {
  const [fase, setFase] = useState<Fase>('cargando')

  useEffect(() => {
    let activo = true
    ;(async () => {
      const user = await obtenerUsuario()
      // Sin sesión, o sesión anónima (sin email) → registro obligatorio
      if (!user || user.is_anonymous || !user.email) {
        if (activo) setFase('onboarding')
        return
      }
      const estado = await estadoAcceso()
      const ruta = rutaDesdeEstado(estado)
      if (!activo) return
      if (ruta == null) setFase('render')
      else if (ruta === 'EXTERNO') setFase('externo')
      else setFase('interno')
    })()
    return () => { activo = false }
  }, [])

  useEffect(() => {
    if (fase === 'externo') window.location.href = URL_EXPIRACION
  }, [fase])

  if (fase === 'cargando') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <span style={{ color: 'var(--mute)', fontSize: 14 }}>Cargando…</span>
      </div>
    )
  }
  if (fase === 'onboarding') return <Navigate to="/onboarding/email" replace />
  if (fase === 'interno')    return <Navigate to="/mis-oposiciones" replace />
  if (fase === 'externo') return null
  return <>{children}</>
}

export function RutaConSesion({ children }: { children: React.ReactNode }) {
  const [fase, setFase] = useState<'cargando' | 'onboarding' | 'render'>('cargando')
  useEffect(() => {
    let activo = true
    ;(async () => {
      const user = await obtenerUsuario()
      if (!activo) return
      setFase(!user || user.is_anonymous || !user.email ? 'onboarding' : 'render')
    })()
    return () => { activo = false }
  }, [])
  if (fase === 'cargando') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <span style={{ color: 'var(--mute)', fontSize: 14 }}>Cargando…</span>
      </div>
    )
  }
  if (fase === 'onboarding') return <Navigate to="/onboarding/email" replace />
  return <>{children}</>
}

/**
 * Gating por suscripción de oposición (modelo vigente, sin trial).
 * Requiere sesión con email y suscripción activa para el :slug de la URL.
 * Sin suscripción → redirige al dashboard de la oposición (donde se muestra el paywall).
 */
export function RutaOposicion({ children }: { children: React.ReactNode }) {
  const { slug } = useParams()
  const [fase, setFase] = useState<'cargando' | 'onboarding' | 'paywall' | 'render'>('cargando')

  useEffect(() => {
    let activo = true
    ;(async () => {
      const user = await obtenerUsuario()
      if (!user || user.is_anonymous || !user.email) {
        if (activo) setFase('onboarding')
        return
      }
      const acceso = slug ? await tieneAccesoOposicion(slug) : false
      if (!activo) return
      setFase(acceso ? 'render' : 'paywall')
    })()
    return () => { activo = false }
  }, [slug])

  if (fase === 'cargando') return <Cargando />
  if (fase === 'onboarding') return <Navigate to="/onboarding/email" replace />
  if (fase === 'paywall') return <Navigate to={`/oposicion/${slug ?? ''}?paywall=1`} replace />
  return <>{children}</>
}
