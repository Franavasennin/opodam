import { describe, it, expect, vi, afterEach } from 'vitest'
import { generarPsicotecnicos, generarSupuesto } from './practica'

afterEach(() => { vi.restoreAllMocks() })

describe('practica service', () => {
  it('generarPsicotecnicos devuelve preguntas en 200', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true, status: 200, json: () => Promise.resolve({ preguntas: [{ enunciado: 'e', opciones: ['a', 'b'], respuestaCorrecta: 0, explicacion: 'x' }] }),
    }))
    const r = await generarPsicotecnicos('series-numericas')
    expect(r.error).toBeNull()
    expect(r.preguntas).toHaveLength(1)
  })

  it('generarPsicotecnicos devuelve error en fallo', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 502, json: () => Promise.resolve({ error: 'boom' }) }))
    const r = await generarPsicotecnicos('series-numericas')
    expect(r.preguntas).toEqual([])
    expect(r.error).toBe('boom')
  })

  it('generarSupuesto devuelve supuesto en 200', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true, status: 200, json: () => Promise.resolve({ supuesto: { titulo: 't', caso: 'c', preguntas: [] } }),
    }))
    const r = await generarSupuesto('cgpc', 'temario')
    expect(r.error).toBeNull()
    expect(r.supuesto?.caso).toBe('c')
  })
})
