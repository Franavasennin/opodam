import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { Dashboard } from './pages/Dashboard'
import { Temario } from './pages/Temario'
import { TemaDetalle } from './pages/TemaDetalle'
import { FlashcardsGlobal } from './pages/FlashcardsGlobal'
import { Tests } from './pages/Tests'
import { Simulacro } from './pages/Simulacro'
import { Estadisticas } from './pages/Estadisticas'
import { SesionDiaria } from './pages/SesionDiaria'
import { Perfil } from './pages/Perfil'
import { sincronizar } from './services/sync'

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
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="temario" element={<Temario />} />
        <Route path="temario/:id" element={<TemaDetalle />} />
        <Route path="flashcards" element={<FlashcardsGlobal />} />
        <Route path="tests" element={<Tests />} />
        <Route path="tests/simulacro" element={<Simulacro />} />
        <Route path="estadisticas" element={<Estadisticas />} />
        <Route path="sesion-diaria" element={<SesionDiaria />} />
        <Route path="perfil" element={<Perfil />} />
      </Route>
    </Routes>
  )
}
