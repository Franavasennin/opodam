import { useEffect, Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { RutaConSesion, RutaOposicion } from './components/layout/RutaProtegida'
import { sincronizar } from './services/sync'
import { migrarProgresoLegado } from './services/storage'

// Auth callback (magic link)
import AuthCallback from './pages/auth/AuthCallback'

// Si Supabase redirige al root con token de auth (PKCE: ?code= / Implicit: #access_token=),
// renderizamos AuthCallback antes de que Navigate borre el parámetro.
// Si no hay token, mostramos la landing page pública.
function RootOrCallback() {
  if (typeof window !== 'undefined') {
    const hash   = window.location.hash
    const search = window.location.search
    if (hash.includes('access_token') || search.includes('code=') || hash.includes('error') || search.includes('error')) {
      return <AuthCallback />
    }
  }
  return <Landing />
}

// Landing pública
import Landing from './pages/Landing'

// Onboarding (no protegidas)
import OnboardingEmail from './pages/onboarding/OnboardingEmail'
import OnboardingConfirmar from './pages/onboarding/OnboardingConfirmar'
import OnboardingOposicion from './pages/onboarding/OnboardingOposicion'

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
const RepasoErrores = lazy(() => import('./pages/RepasoErrores').then(m => ({ default: m.RepasoErrores })))
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
const InformeIdoneidad = lazy(() => import('./pages/InformeIdoneidad'))
const Biodata = lazy(() => import('./pages/Biodata'))
const Terminos = lazy(() => import('./pages/Terminos'))
const Privacidad = lazy(() => import('./pages/Privacidad'))
const Reembolsos = lazy(() => import('./pages/Reembolsos'))

const Loading = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50">
    <span className="text-slate-400 text-sm">Cargando...</span>
  </div>
)

// Run once at app startup before any rendering
migrarProgresoLegado()

export default function App() {
  useEffect(() => {
    sincronizar().catch(() => { /* sin conexión, ignorar */ })
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return
      sincronizar().catch(() => {})
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
        <Route path="/onboarding/email" element={<OnboardingEmail />} />
        <Route path="/onboarding/confirmar" element={<OnboardingConfirmar />} />
        <Route path="/onboarding/oposicion" element={<OnboardingOposicion />} />

        {/* App protegida */}
        <Route path="/mis-oposiciones" element={<RutaConSesion><MisOposiciones /></RutaConSesion>} />
        <Route path="/oposicion/:slug" element={<RutaConSesion><OposicionDashboard /></RutaConSesion>} />
        <Route path="/oposicion/:slug/temario" element={<RutaOposicion><Temario /></RutaOposicion>} />
        <Route path="/oposicion/:slug/temario/:id" element={<RutaOposicion><TemaDetalle /></RutaOposicion>} />
        <Route path="/oposicion/:slug/flashcards" element={<RutaOposicion><FlashcardsGlobal /></RutaOposicion>} />
        <Route path="/oposicion/:slug/tests" element={<RutaOposicion><Tests /></RutaOposicion>} />
        <Route path="/oposicion/:slug/tests/simulacro" element={<RutaOposicion><Simulacro /></RutaOposicion>} />
        <Route path="/oposicion/:slug/repaso-errores" element={<RutaOposicion><RepasoErrores /></RutaOposicion>} />
        <Route path="/oposicion/:slug/estadisticas" element={<RutaOposicion><Estadisticas /></RutaOposicion>} />
        <Route path="/oposicion/:slug/examen" element={<RutaOposicion><Examen /></RutaOposicion>} />
        <Route path="/oposicion/:slug/sesion-diaria" element={<RutaOposicion><SesionDiaria /></RutaOposicion>} />
        <Route path="/oposicion/:slug/perfil" element={<RutaConSesion><Perfil /></RutaConSesion>} />
        <Route path="/oposicion/:slug/psicotecnicos" element={<RutaOposicion><Psicotecnicos /></RutaOposicion>} />
        <Route path="/oposicion/:slug/supuestos" element={<RutaOposicion><Supuestos /></RutaOposicion>} />
        <Route path="/oposicion/:slug/supuestos/:id" element={<RutaOposicion><SupuestoDetalle /></RutaOposicion>} />
        <Route path="/oposicion/:slug/entrevista" element={<RutaOposicion><Entrevista /></RutaOposicion>} />
        <Route path="/oposicion/:slug/personalidad" element={<RutaOposicion><Personalidad /></RutaOposicion>} />
        <Route path="/oposicion/:slug/tutor" element={<RutaOposicion><TutorGlobal /></RutaOposicion>} />
        <Route path="/oposicion/:slug/informe-psicologico" element={<RutaOposicion><InformeIdoneidad /></RutaOposicion>} />
        <Route path="/oposicion/:slug/biodata" element={<RutaOposicion><Biodata /></RutaOposicion>} />

        <Route path="/procoach" element={<ProCoachAI />} />
        <Route path="/procoach/chat" element={<ProCoachChat />} />
        <Route path="/equivalencias" element={<Equivalencias />} />
        <Route path="/terminos"   element={<Terminos />} />
        <Route path="/privacidad" element={<Privacidad />} />
        <Route path="/reembolsos" element={<Reembolsos />} />

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
