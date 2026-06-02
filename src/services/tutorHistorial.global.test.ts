import { describe, it, expect, vi, beforeEach } from 'vitest'

const upsertMock = vi.fn(() => Promise.resolve({ error: null }))
const singleMock = vi.fn(() => Promise.resolve({ data: { mensajes: [{ role: 'user', content: 'hola' }] } }))

vi.mock('./supabase', () => ({
  obtenerUsuario: () => Promise.resolve({ id: 'u1' }),
  supabase: {
    from: () => ({
      select: () => ({ eq: () => ({ single: singleMock }) }),
      upsert: upsertMock,
    }),
  },
}))

import { cargarHistorialGlobal, guardarHistorialGlobal } from './tutorHistorial'

describe('historial global', () => {
  beforeEach(() => { upsertMock.mockClear() })
  it('carga los mensajes de la fila', async () => {
    const m = await cargarHistorialGlobal('cgpc')
    expect(m).toEqual([{ role: 'user', content: 'hola' }])
  })
  it('guarda con upsert', async () => {
    await guardarHistorialGlobal('cgpc', [{ role: 'user', content: 'x' }])
    expect(upsertMock).toHaveBeenCalledOnce()
  })
})
