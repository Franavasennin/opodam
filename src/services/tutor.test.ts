import { describe, it, expect, vi, afterEach } from 'vitest'
import { preguntarTutor } from './tutor'

afterEach(() => { vi.restoreAllMocks() })

describe('preguntarTutor', () => {
  const ctx = { oposicion: 'cgpc', temaId: 1, titulo: 'T', secciones: [], flashcards: [], preguntas: [] }

  it('devuelve content cuando la respuesta es 200', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true, status: 200, json: () => Promise.resolve({ content: 'hola' }),
    }))
    const r = await preguntarTutor([{ role: 'user', content: 'q' }], ctx)
    expect(r).toEqual({ content: 'hola', error: null })
  })

  it('devuelve error cuando la respuesta no es ok', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false, status: 502, json: () => Promise.resolve({ error: 'boom' }),
    }))
    const r = await preguntarTutor([{ role: 'user', content: 'q' }], ctx)
    expect(r.content).toBeNull()
    expect(r.error).toBe('boom')
  })

  it('captura excepciones de red', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
    const r = await preguntarTutor([{ role: 'user', content: 'q' }], ctx)
    expect(r.content).toBeNull()
    expect(r.error).toBe('offline')
  })
})
