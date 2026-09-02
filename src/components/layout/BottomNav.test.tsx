import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, within, act, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { BottomNav } from './BottomNav'

// BottomNav consulta el rol para decidir si lista oposiciones privadas, y
// persiste el slug activo al cambiar de oposición. Ninguna de las dos cosas
// debe tocar red ni almacenamiento en un test de interfaz.
const esOwner = vi.fn<() => Promise<boolean>>()
vi.mock('../../services/supabase', () => ({ esOwner: () => esOwner() }))
vi.mock('../../services/storage', () => ({ setActiveSlug: vi.fn() }))

/** Monta BottomNav en un router real para poder navegar de verdad. */
function montar(rutaInicial = '/oposicion/cgpc') {
  const router = createMemoryRouter(
    [{ path: '*', element: <BottomNav /> }],
    { initialEntries: [rutaInicial] },
  )
  render(<RouterProvider router={router} />)
  return router
}

const abrirHoja = () => screen.getByRole('button', { name: 'Más' })
const hoja = () => screen.queryByRole('dialog', { name: 'Más secciones' })

beforeEach(() => {
  esOwner.mockResolvedValue(false)
})

afterEach(() => {
  cleanup()
  document.body.style.overflow = ''
  vi.clearAllMocks()
})

describe('BottomNav — barra de pestañas', () => {
  it('no se renderiza fuera de una oposición', async () => {
    await act(async () => { montar('/mis-oposiciones') })
    expect(screen.queryByRole('navigation', { name: 'Navegación principal' })).toBeNull()
  })

  it('muestra los cuatro destinos primarios más "Más", con nombre accesible', async () => {
    await act(async () => { montar() })
    const nav = screen.getByRole('navigation', { name: 'Navegación principal' })
    for (const etiqueta of ['Resumen', 'Temario', 'Fichas', 'Tests']) {
      expect(within(nav).getByRole('link', { name: etiqueta })).toBeInTheDocument()
    }
    expect(within(nav).getByRole('button', { name: 'Más' })).toBeInTheDocument()
  })

  it('marca el destino actual con aria-current="page"', async () => {
    await act(async () => { montar('/oposicion/cgpc/temario') })
    expect(screen.getByRole('link', { name: 'Temario' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Resumen' })).not.toHaveAttribute('aria-current')
  })
})

describe('BottomNav — hoja "Más"', () => {
  it('se abre como diálogo modal, bloquea el scroll y mueve el foco dentro', async () => {
    const user = userEvent.setup()
    await act(async () => { montar() })

    expect(hoja()).toBeNull()
    expect(abrirHoja()).toHaveAttribute('aria-expanded', 'false')

    await user.click(abrirHoja())

    const panel = hoja()
    expect(panel).toBeInTheDocument()
    expect(panel).toHaveAttribute('aria-modal', 'true')
    expect(abrirHoja()).toHaveAttribute('aria-expanded', 'true')
    expect(document.body.style.overflow).toBe('hidden')
    expect(panel!.contains(document.activeElement)).toBe(true)
  })

  it('cierra con Escape, restaura el scroll y devuelve el foco al disparador', async () => {
    const user = userEvent.setup()
    await act(async () => { montar() })
    await user.click(abrirHoja())
    expect(document.body.style.overflow).toBe('hidden')

    await user.keyboard('{Escape}')

    expect(hoja()).toBeNull()
    expect(document.body.style.overflow).toBe('')
    expect(document.activeElement).toBe(abrirHoja())
  })

  it('atrapa el foco: Tab en el último elemento vuelve al primero', async () => {
    const user = userEvent.setup()
    await act(async () => { montar() })
    await user.click(abrirHoja())

    const panel = hoja()!
    const focusables = panel.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
    )
    const primero = focusables[0]
    const ultimo = focusables[focusables.length - 1]
    expect(focusables.length).toBeGreaterThan(1)

    ultimo.focus()
    await user.tab()
    expect(document.activeElement).toBe(primero)

    await user.tab({ shift: true })
    expect(document.activeElement).toBe(ultimo)
  })

  it('restaura el scroll al desmontar con la hoja abierta', async () => {
    const user = userEvent.setup()
    await act(async () => { montar() })
    await user.click(abrirHoja())
    expect(document.body.style.overflow).toBe('hidden')

    cleanup()

    expect(document.body.style.overflow).toBe('')
  })

  /**
   * Regresión. El efecto que bloquea el scroll dependía solo de `hoja`, y el
   * `return null` por falta de slug va después. Al salir de /oposicion/:slug
   * con la hoja abierta (botón atrás), la hoja desaparecía del DOM pero la
   * limpieza no corría: `body` se quedaba en `overflow: hidden`. Con teclado
   * aún se podía pulsar Escape; en táctil el usuario se quedaba sin scroll.
   */
  it('si la ruta sale de la oposición con la hoja abierta, no deja el scroll bloqueado', async () => {
    const user = userEvent.setup()
    let router!: ReturnType<typeof montar>
    await act(async () => { router = montar() })
    await user.click(abrirHoja())
    expect(document.body.style.overflow).toBe('hidden')

    await act(async () => { await router.navigate('/mis-oposiciones') })

    expect(hoja()).toBeNull()
    expect(screen.queryByRole('navigation', { name: 'Navegación principal' })).toBeNull()
    expect(document.body.style.overflow).toBe('')
  })
})

describe('BottomNav — oposiciones privadas', () => {
  it('las oculta a un usuario sin rol owner/beta', async () => {
    const user = userEvent.setup()
    esOwner.mockResolvedValue(false)
    await act(async () => { montar() })
    await user.click(abrirHoja())

    expect(within(hoja()!).queryByText(/Security\+/)).toBeNull()
  })

  it('las muestra a owner/beta', async () => {
    const user = userEvent.setup()
    esOwner.mockResolvedValue(true)
    await act(async () => { montar() })
    await user.click(abrirHoja())

    expect(within(hoja()!).getByText(/Security\+/)).toBeInTheDocument()
  })

  it('no revienta si la consulta de rol falla', async () => {
    const user = userEvent.setup()
    esOwner.mockRejectedValue(new Error('sin red'))
    await act(async () => { montar() })
    await user.click(abrirHoja())

    expect(hoja()).toBeInTheDocument()
    expect(within(hoja()!).queryByText(/Security\+/)).toBeNull()
  })
})
