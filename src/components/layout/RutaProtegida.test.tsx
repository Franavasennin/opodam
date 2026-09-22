import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import type { User } from '@supabase/supabase-js'

const m = vi.hoisted(() => ({
  obtenerUsuario: vi.fn(),
  tieneAccesoOposicion: vi.fn(),
}))
vi.mock('../../services/supabase', () => ({
  obtenerUsuario: () => m.obtenerUsuario(),
  tieneAccesoOposicion: (slug: string) => m.tieneAccesoOposicion(slug),
  esOwner: async () => false,
  supabase: null,
}))

import { RutaConSesion, RutaOposicion } from './RutaProtegida'
import { reiniciarSesionStore, useSesionStore } from '../../stores/sesion'
import { getActiveSlug, setActiveSlug } from '../../services/storage'

const alumna = { id: 'ana', email: 'ana@opodam.test', is_anonymous: false } as User

/** Página que anota con qué oposición activa se renderiza cada vez. */
const vistos: string[] = []
function Pagina({ nombre }: { nombre: string }) {
  const activa = getActiveSlug()
  vistos.push(activa)
  return <p>{nombre} · activa={activa}</p>
}

function montar(ruta: string) {
  const router = createMemoryRouter([
    { path: '/onboarding/email', element: <p>login</p> },
    { path: '/mis-oposiciones', element: <p>mis oposiciones</p> },
    { path: '/oposicion/:slug', element: <RutaConSesion><Pagina nombre="dashboard" /></RutaConSesion> },
    { path: '/oposicion/:slug/tests', element: <RutaOposicion><Pagina nombre="tests" /></RutaOposicion> },
  ], { initialEntries: [ruta] })
  render(<RouterProvider router={router} />)
  return router
}

beforeEach(() => {
  vistos.length = 0
  localStorage.clear()
  setActiveSlug('cgpc')
  m.obtenerUsuario.mockResolvedValue(alumna)
  m.tieneAccesoOposicion.mockResolvedValue(true)
})

afterEach(() => {
  cleanup()
  reiniciarSesionStore()
  vi.clearAllMocks()
})

describe('RutaConSesion', () => {
  it('sin sesión manda al login', async () => {
    m.obtenerUsuario.mockResolvedValue(null)
    montar('/oposicion/cgpc')
    expect(await screen.findByText('login')).toBeInTheDocument()
  })

  it('una sesión anónima (sin email) también va al login', async () => {
    m.obtenerUsuario.mockResolvedValue({ id: 'x', is_anonymous: true } as User)
    montar('/oposicion/cgpc')
    expect(await screen.findByText('login')).toBeInTheDocument()
  })

  it('con sesión renderiza la página', async () => {
    montar('/oposicion/cgpc')
    expect(await screen.findByText(/dashboard/)).toBeInTheDocument()
  })
})

describe('RutaOposicion', () => {
  it('sin suscripción redirige al dashboard con el paywall', async () => {
    m.tieneAccesoOposicion.mockResolvedValue(false)
    const router = montar('/oposicion/cgpc/tests')
    expect(await screen.findByText(/dashboard/)).toBeInTheDocument()
    expect(router.state.location.search).toBe('?paywall=1')
  })

  it('con suscripción renderiza el contenido', async () => {
    montar('/oposicion/cgpc/tests')
    expect(await screen.findByText(/tests · activa=cgpc/)).toBeInTheDocument()
    expect(m.tieneAccesoOposicion).toHaveBeenCalledWith('cgpc')
  })

  it('el acceso se consulta una vez aunque se navegue entre páginas de la oposición', async () => {
    const router = montar('/oposicion/cgpc/tests')
    await screen.findByText(/tests/)
    await router.navigate('/oposicion/cgpc')
    await router.navigate('/oposicion/cgpc/tests')
    expect(await screen.findByText(/tests/)).toBeInTheDocument()
    expect(m.tieneAccesoOposicion).toHaveBeenCalledTimes(1)
  })

  it('entrar por enlace directo a otra oposición la activa ANTES de montar la página', async () => {
    montar('/oposicion/policia-local/tests')
    // La página lee el slug activo al renderizar: nunca debe ver 'cgpc'.
    expect(await screen.findByText('tests · activa=policia-local')).toBeInTheDocument()
    expect(vistos).not.toContain('cgpc')
    expect(getActiveSlug()).toBe('policia-local')
  })

  it('con sesión y acceso ya en caché (navegación interna) tampoco renderiza con la oposición anterior', async () => {
    // Sin esperas asíncronas que lo disimulen: el guard pintaría la página
    // en el mismo render si no esperase a alinear la oposición activa.
    await useSesionStore.getState().iniciar()
    await useSesionStore.getState().comprobarAcceso('policia-local')
    montar('/oposicion/policia-local/tests')
    expect(await screen.findByText('tests · activa=policia-local')).toBeInTheDocument()
    expect(vistos).not.toContain('cgpc')
  })
})

describe('RutaConSesion — oposición activa', () => {
  it('con la sesión ya cargada, el dashboard de otra oposición se monta con esa oposición activa', async () => {
    await useSesionStore.getState().iniciar()
    montar('/oposicion/guardia-civil')
    expect(await screen.findByText('dashboard · activa=guardia-civil')).toBeInTheDocument()
    expect(vistos).not.toContain('cgpc')
  })

  it('un slug desconocido no cambia la oposición activa ni bloquea la página', async () => {
    montar('/oposicion/no-existe')
    expect(await screen.findByText('dashboard · activa=cgpc')).toBeInTheDocument()
  })
})
