import { useEffect, Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { RutaProtegida } from './components/layout/RutaProtegida'
import { sincronizar } from './services/sync'
import { migrarProgresoLegado } from './services/storage'
import { iniciarSesionAnonima } from './services/supabase'

// Auth callback (magic link)
import AuthCallback from './pages/auth/AuthCallback'

// Si Supabase redirige al root con token de auth (PKCE: ?code= / Implicit: #access_token=),
// renderizamos AuthCallback antes de que Navigate borre el parámetro.
function RootOrCallback() {
  if (typeof window !== 'undefined') {
    const hash   = window.location.hash
    const search = window.location.search
    if (hash.includes('access_token') || search.includes('code=') || hash.includes('error') || search.includes('error')) {
      return <AuthCallback />
    }
  }
  return <Navigate to="/mis-oposiciones" replace />
}

// Onboarding (no protegidas)
// AUTH DESACTIVADO — reactivar mas adelante:
// import OnboardingEmail from './pages/onboarding/OnboardingEmail'
// import OnboardingConfirmar from './pages/onboarding/OnboardingConfirmar'
// import OnboardingOposicion from './pages/onboarding/OnboardingOposicion'

// Páginas de la app (protegidas)
import MisOposiciones from './pages/MisOposiciones'
import OposicionDashboard from './pages/OposicionDashboard'
import { BotonMusica } from './components/audio/BotonMusica'
import { BotonTema } from './components/ui/BotonTema'
import { DesktopShell } from './components/layout/DesktopShell'

// Páginas existentes (lazy)
const Temario = lazy(() => import('./pages/Temario').then(m => ({ default: m.Temario })))
const TemaDetalle = lazy(() => import('./pages/TemaDetalle').then(m => ({ default: m.TemaDetalle })))
const FlashcardsGlobal = lazy(() => import('./pages/FlashcardsGlobal').then(m => ({ default: m.FlashcardsGlobal })))
const Tests = lazy(() => import('./pages/Tests').then(m => ({ default: m.Tests })))
const Simulacro = lazy(() => import('./pages/Simulacro').then(m => ({ default: m.Simulacro })))
const Estadisticas = lazy(() => import('./pages/Estadisticas').then(m => ({ default: m.Estadisticas })))
const Examen = lazy(() => import('./pages/Examen').then(m => ({ default: m.Examen })))
const SesionDiaria = lazy(() => import('./pages/SesionDiaria').then(m => ({ default: m.SesionDiaria })))
const Perfil = lazy(() => import('./pages/Perfil').then(m => ({ default: m.Perfil })))
const ProCoachAI = lazy(() => import('./pages/ProCoachAI'))
const ProCoachChat = lazy(() => import('./pages/ProCoachChat'))
const Equivalencias = lazy(() => import('./pages/Equivalencias'))
const Psicotecnicos = lazy(() => import('./pages/Psicotecnicos'))
const Supuestos = lazy(() => import('./pages/Supuestos'))
const SupuestoDetalle = lazy(() => import('./pages/SupuestoDetalle'))
const Entrevista = lazy(() => import('./pages/Entrevista'))
const Personalidad = lazy(() => import('./pages/Personalidad'))
const TutorGlobal = lazy(() => import('./pages/TutorGlobal'))

const Loading = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50">
    <span className="text-slate-400 text-sm">Cargando...</span>
  </div>
)

// Run once at app startup before any rendering
migrarProgresoLegado()

export default function App() {
  useEffect(() => {
    iniciarSesionAnonima()
      .then(({ error }) => { if (!error) return sincronizar() })
      .catch(() => { /* sin conexión, ignorar */ })
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return
      iniciarSesionAnonima()
        .then(({ error }) => { if (!error) return sincronizar() })
        .catch(() => {})
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [])

  return (
    <>
      <Suspense fallback={<Loading />}>
        <DesktopShell>
        <Routes>
        {/* Auth callback — destino del magic link */}
        <Route path="/auth/callback" element={<AuthCallback />} />

        {/* AUTH DESACTIVADO — reactivar mas adelante.
            Rutas de onboarding y AuthCallback conservadas pero sin montar. */}

        {/* App protegida */}
        <Route path="/mis-oposiciones" element={<RutaProtegida><MisOposiciones /></RutaProtegida>} />
        <Route path="/oposicion/:slug" element={<RutaProtegida><OposicionDashboard /></RutaProtegida>} />
        <Route path="/oposicion/:slug/temario" element={<RutaProtegida><Temario /></RutaProtegida>} />
        <Route path="/oposicion/:slug/temario/:id" element={<RutaProtegida><TemaDetalle /></RutaProtegida>} />
        <Route path="/oposicion/:slug/flashcards" element={<RutaProtegida><FlashcardsGlobal /></RutaProtegida>} />
        <Route path="/oposicion/:slug/tests" element={<RutaProtegida><Tests /></RutaProtegida>} />
        <Route path="/oposicion/:slug/tests/simulacro" element={<RutaProtegida><Simulacro /></RutaProtegida>} />
        <Route path="/oposicion/:slug/estadisticas" element={<RutaProtegida><Estadisticas /></RutaProtegida>} />
        <Route path="/oposicion/:slug/examen" element={<RutaProtegida><Examen /></RutaProtegida>} />
        <Route path="/oposicion/:slug/sesion-diaria" element={<RutaProtegida><SesionDiaria /></RutaProtegida>} />
        <Route path="/oposicion/:slug/perfil" element={<RutaProtegida><Perfil /></RutaProtegida>} />
        <Route path="/oposicion/:slug/psicotecnicos" element={<RutaProtegida><Psicotecnicos /></RutaProtegida>} />
        <Route path="/oposicion/:slug/supuestos" element={<RutaProtegida><Supuestos /></RutaProtegida>} />
        <Route path="/oposicion/:slug/supuestos/:id" element={<RutaProtegida><SupuestoDetalle /></RutaProtegida>} />
        <Route path="/oposicion/:slug/entrevista" element={<RutaProtegida><Entrevista /></RutaProtegida>} />
        <Route path="/oposicion/:slug/personalidad" element={<RutaProtegida><Personalidad /></RutaProtegida>} />
        <Route path="/oposicion/:slug/tutor" element={<RutaProtegida><TutorGlobal /></RutaProtegida>} />

        <Route path="/procoach" element={<ProCoachAI />} />
        <Route path="/procoach/chat" element={<ProCoachChat />} />
        <Route path="/equivalencias" element={<Equivalencias />} />

        {/* Redirecciones */}
        <Route path="/" element={<RootOrCallback />} />
        <Route path="*" element={<Navigate to="/mis-oposiciones" replace />} />
        </Routes>
        </DesktopShell>
      </Suspense>
      <BotonMusica />
      <BotonTema />
    </>
  )
}
