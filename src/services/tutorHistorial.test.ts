import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock del módulo supabase ANTES de importar el servicio.
// vi.hoisted garantiza que los mocks existen cuando vi.mock (hoisteado) corre.
const { obtenerUsuario, single, upsert, from } = vi.hoisted(() => {
  const single = vi.fn()
  const eq2 = vi.fn(() => ({ single }))
  const eq1 = vi.fn(() => ({ eq: eq2 }))
  const select = vi.fn(() => ({ eq: eq1 }))
  const upsert = vi.fn(() => Promise.resolve({ error: null }))
  const from = vi.fn(() => ({ select, upsert }))
  return { obtenerUsuario: vi.fn(), single, select, upsert, from }
})

vi.mock('./supabase', () => ({
  supabase: { from },
  obtenerUsuario,
}))

import { cargarHistorial, guardarHistorial } from './tutorHistorial'

beforeEach(() => { vi.clearAllMocks(); obtenerUsuario.mockResolvedValue({ id: 'u1' }) })

describe('cargarHistorial', () => {
  it('devuelve los mensajes de la fila', async () => {
    single.mockResolvedValue({ data: { mensajes: [{ role: 'user', content: 'hola' }] }, error: null })
    const r = await cargarHistorial('cgpc', 1)
    expect(r).toEqual([{ role: 'user', content: 'hola' }])
  })

  it('devuelve [] si no hay fila', async () => {
    single.mockResolvedValue({ data: null, error: null })
    expect(await cargarHistorial('cgpc', 1)).toEqual([])
  })

  it('devuelve [] si Supabase lanza', async () => {
    single.mockRejectedValue(new Error('down'))
    expect(await cargarHistorial('cgpc', 1)).toEqual([])
  })
})

describe('guardarHistorial', () => {
  it('hace upsert con la clave (user_id, oposicion, tema_id)', async () => {
    await guardarHistorial('cgpc', 1, [{ role: 'user', content: 'q' }])
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: 'u1', oposicion: 'cgpc', tema_id: 1 }),
      expect.objectContaining({ onConflict: 'user_id,oposicion,tema_id' }),
    )
  })

  it('no lanza si Supabase falla', async () => {
    upsert.mockRejectedValueOnce(new Error('down'))
    await expect(guardarHistorial('cgpc', 1, [])).resolves.toBeUndefined()
  })
})
