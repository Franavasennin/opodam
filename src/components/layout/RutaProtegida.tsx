import { useEffect, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { estadoAcceso } from '../../services/supabase'
import { rutaDesdeEstado } from '../../services/suscripcion'
import { tieneCuenta, useSesion, useSesionStore } from '../../stores/sesion'
import { esSlugConocido, useOposicionStore } from '../../stores/oposicion'

function Cargando() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
      <span style={{ color: 'var(--mute)', fontSize: 14 }}>Cargando…</span>
    </div>
  )
}

/**
 * La oposición del `:slug` de la URL pasa a ser la activa antes de montar la
 * página. Sin esto, entrar por enlace directo a /oposicion/policia-local/…
 * con `cgpc` activa leía y guardaba el progreso en la oposición equivocada.
 * Devuelve `true` mientras el cambio está pendiente.
 */
function useAlinearOposicionActiva(): boolean {
  const { slug } = useParams()
  const activa = useOposicionStore(s => s.slug)
  const pendiente = !!slug && esSlugConocido(slug) && slug !== activa
  useEffect(() => {
    if (pendiente && slug) useOposicionStore.getState().activar(slug)
  }, [pendiente, slug])
  return pendiente
}

type Fase = 'cargando' | 'render' | 'interno' | 'externo'

const URL_EXPIRACION =
  (import.meta.env.VITE_URL_EXPIRACION as string | undefined) ??
  'https://opodam.vercel.app/precios'

/** Modelo trial (retirado del routing; se conserva por si se recupera). */
export function RutaProtegida({ children }: { children: React.ReactNode }) {
  const { lista, usuario } = useSesion()
  const conCuenta = tieneCuenta(usuario)
  const [fase, setFase] = useState<Fase>('cargando')

  useEffect(() => {
    if (!lista || !conCuenta) return
    let activo = true
    ;(async () => {
      const ruta = rutaDesdeEstado(await estadoAcceso())
      if (!activo) return
      if (ruta == null) setFase('render')
      else if (ruta === 'EXTERNO') setFase('externo')
      else setFase('interno')
    })()
    return () => { activo = false }
  }, [lista, conCuenta])

  useEffect(() => {
    if (fase === 'externo') window.location.href = URL_EXPIRACION
  }, [fase])

  if (!lista) return <Cargando />
  if (!conCuenta) return <Navigate to="/onboarding/email" replace />
  if (fase === 'cargando') return <Cargando />
  if (fase === 'interno') return <Navigate to="/mis-oposiciones" replace />
  if (fase === 'externo') return null
  return <>{children}</>
}

/** Requiere sesión con email (sin mirar suscripción). */
export function RutaConSesion({ children }: { children: React.ReactNode }) {
  const { lista, usuario } = useSesion()
  const alineando = useAlinearOposicionActiva()
  if (!lista) return <Cargando />
  if (!tieneCuenta(usuario)) return <Navigate to="/onboarding/email" replace />
  if (alineando) return <Cargando />
  return <>{children}</>
}

/**
 * Gating por suscripción de oposición (modelo vigente, sin trial).
 * Requiere sesión con email y suscripción activa para el :slug de la URL.
 * Sin suscripción → redirige al dashboard de la oposición (donde se muestra el paywall).
 */
export function RutaOposicion({ children }: { children: React.ReactNode }) {
  const { slug } = useParams()
  const { lista, usuario } = useSesion()
  const conCuenta = tieneCuenta(usuario)
  const acceso = useSesionStore(s => (slug ? s.accesos[slug] : false))
  const alineando = useAlinearOposicionActiva()

  useEffect(() => {
    if (lista && conCuenta && slug) void useSesionStore.getState().comprobarAcceso(slug)
  }, [lista, conCuenta, slug])

  if (!lista) return <Cargando />
  if (!conCuenta) return <Navigate to="/onboarding/email" replace />
  if (!slug) return <Navigate to="/mis-oposiciones" replace />
  if (acceso == null) return <Cargando />
  if (!acceso) return <Navigate to={`/oposicion/${slug}?paywall=1`} replace />
  if (alineando) return <Cargando />
  return <>{children}</>
}
