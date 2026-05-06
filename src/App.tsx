import { useEffect, Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { RutaProtegida } from './components/layout/RutaProtegida'
import { sincronizar } from './services/sync'

// Onboarding (no protegidas)
import OnboardingEmail from './pages/onboarding/OnboardingEmail'
import OnboardingConfirmar from './pages/onboarding/OnboardingConfirmar'
import OnboardingOposicion from './pages/onboarding/OnboardingOposicion'

// Páginas de la app (protegidas)
import MisOposiciones from './pages/MisOposiciones'
import OposicionDashboard from './pages/OposicionDashboard'

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

const Loading = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50">
    <span className="text-slate-400 text-sm">Cargando...</span>
  </div>
)

export default function App() {
  useEffect(() => {
    sincronizar().catch(() => { /* sin conexión, ignorar */ })
    const onVisible = () => {
      if (document.visibilityState === 'visible') sincronizar().catch(() => {})
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [])

  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        {/* Onboarding — sin protección */}
        <Route path="/onboarding/email" element={<OnboardingEmail />} />
        <Route path="/onboarding/confirmar" element={<OnboardingConfirmar />} />
        <Route path="/onboarding/oposicion" element={<OnboardingOposicion />} />

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

        {/* Redirecciones */}
        <Route path="/" element={<Navigate to="/mis-oposiciones" replace />} />
        <Route path="*" element={<Navigate to="/mis-oposiciones" replace />} />
      </Routes>
    </Suspense>
  )
}
