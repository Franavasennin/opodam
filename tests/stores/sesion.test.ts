import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { User, Session } from '@supabase/supabase-js'

// Supabase falso: controlamos usuario, rol y acceso, y capturamos el oyente
// de onAuthStateChange para simular inicios y cierres de sesión.
const m = vi.hoisted(() => ({
  obtenerUsuario: vi.fn(),
  esOwner: vi.fn(),
  tieneAccesoOposicion: vi.fn(),
  oyente: null as null | ((evento: string, session: Session | null) => void),
}))
vi.mock('../../src/services/supabase', () => ({
  obtenerUsuario: () => m.obtenerUsuario(),
  esOwner: () => m.esOwner(),
  tieneAccesoOposicion: (slug: string) => m.tieneAccesoOposicion(slug),
  supabase: {
    auth: {
      onAuthStateChange: (fn: typeof m.oyente) => {
        m.oyente = fn
        return { data: { subscription: { unsubscribe: () => { m.oyente = null } } } }
      },
    },
  },
}))

import { useSesionStore, reiniciarSesionStore, tieneCuenta } from '../../src/stores/sesion'

const usuario = (id: string, extra: Partial<User> = {}) =>
  ({ id, email: `${id}@opodam.test`, is_anonymous: false, ...extra }) as User
const sesionDe = (u: User | null) => (u ? ({ user: u } as Session) : null)

beforeEach(() => {
  reiniciarSesionStore()
  vi.clearAllMocks()
  m.obtenerUsuario.mockResolvedValue(usuario('ana'))
  m.esOwner.mockResolvedValue(false)
  m.tieneAccesoOposicion.mockResolvedValue(true)
})

describe('tieneCuenta', () => {
  it('exige usuario con email y no anónimo', () => {
    expect(tieneCuenta(null)).toBe(false)
    expect(tieneCuenta(usuario('x', { is_anonymous: true }))).toBe(false)
    expect(tieneCuenta(usuario('x', { email: undefined }))).toBe(false)
    expect(tieneCuenta(usuario('x'))).toBe(true)
  })
})

describe('iniciar', () => {
  it('lee la sesión una sola vez aunque la pidan varios guards a la vez', async () => {
    const s = useSesionStore.getState()
    await Promise.all([s.iniciar(), s.iniciar(), s.iniciar()])
    expect(m.obtenerUsuario).toHaveBeenCalledTimes(1)
    expect(useSesionStore.getState()).toMatchObject({ estado: 'lista', usuario: { id: 'ana' } })
  })

  it('un error al leer la sesión termina en "lista" sin usuario (no deja el guard colgado)', async () => {
    m.obtenerUsuario.mockRejectedValue(new Error('sin red'))
    await useSesionStore.getState().iniciar()
    expect(useSesionStore.getState()).toMatchObject({ estado: 'lista', usuario: null })
  })

  it('refleja el cierre de sesión que llega por onAuthStateChange', async () => {
    await useSesionStore.getState().iniciar()
    m.oyente?.('SIGNED_OUT', null)
    expect(useSesionStore.getState().usuario).toBeNull()
  })
})

describe('cargarRol', () => {
  it('consulta el rol una vez y lo cachea', async () => {
    m.esOwner.mockResolvedValue(true)
    const s = useSesionStore.getState()
    await Promise.all([s.cargarRol(), s.cargarRol()])
    await s.cargarRol()
    expect(m.esOwner).toHaveBeenCalledTimes(1)
    expect(useSesionStore.getState().puedeVerPrivadas).toBe(true)
  })

  it('un fallo de red no se cachea', async () => {
    m.esOwner.mockRejectedValueOnce(new Error('sin red'))
    expect(await useSesionStore.getState().cargarRol()).toBe(false)
    expect(useSesionStore.getState().puedeVerPrivadas).toBeNull()
    m.esOwner.mockResolvedValue(true)
    expect(await useSesionStore.getState().cargarRol()).toBe(true)
  })

  it('al cambiar de usuario se olvida el rol del anterior', async () => {
    m.esOwner.mockResolvedValue(true)
    await useSesionStore.getState().iniciar()
    await useSesionStore.getState().cargarRol()
    m.oyente?.('SIGNED_IN', sesionDe(usuario('luis')))
    expect(useSesionStore.getState()).toMatchObject({ usuario: { id: 'luis' }, puedeVerPrivadas: null })
  })

  it('una respuesta que llega tras cambiar de usuario no contamina la caché del nuevo', async () => {
    await useSesionStore.getState().iniciar()
    let resolver!: (v: boolean) => void
    m.esOwner.mockReturnValueOnce(new Promise<boolean>(r => { resolver = r }))
    const enCurso = useSesionStore.getState().cargarRol()
    m.oyente?.('SIGNED_IN', sesionDe(usuario('luis')))
    resolver(true)
    await enCurso
    expect(useSesionStore.getState().puedeVerPrivadas).toBeNull()
  })
})

describe('comprobarAcceso', () => {
  it('cachea por oposición', async () => {
    m.tieneAccesoOposicion.mockImplementation(async (slug: string) => slug === 'cgpc')
    const s = useSesionStore.getState()
    expect(await s.comprobarAcceso('cgpc')).toBe(true)
    expect(await s.comprobarAcceso('cgpc')).toBe(true)
    expect(await s.comprobarAcceso('policia-local')).toBe(false)
    expect(m.tieneAccesoOposicion).toHaveBeenCalledTimes(2)
    expect(useSesionStore.getState().accesos).toEqual({ cgpc: true, 'policia-local': false })
  })

  it('un error cuenta como sin acceso (fail-closed)', async () => {
    m.tieneAccesoOposicion.mockRejectedValue(new Error('sin red'))
    expect(await useSesionStore.getState().comprobarAcceso('cgpc')).toBe(false)
    expect(useSesionStore.getState().accesos.cgpc).toBe(false)
  })

  it('al cerrar sesión se vacían los accesos', async () => {
    await useSesionStore.getState().iniciar()
    await useSesionStore.getState().comprobarAcceso('cgpc')
    m.oyente?.('SIGNED_OUT', null)
    expect(useSesionStore.getState().accesos).toEqual({})
  })
})
