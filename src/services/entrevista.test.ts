import { describe, it, expect, vi, afterEach } from 'vitest'
import { enviarTurnoEntrevista } from './entrevista'

afterEach(() => { vi.restoreAllMocks() })

describe('enviarTurnoEntrevista', () => {
  const base = { messages: [{ role: 'user' as const, content: 'hola' }], cuerpo: 'cgpc', modo: 'practica' as const }

  it('devuelve content en 200', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve({ content: 'siguiente pregunta' }) }))
    const r = await enviarTurnoEntrevista(base.messages, base.cuerpo, base.modo)
    expect(r).toEqual({ content: 'siguiente pregunta', error: null })
  })

  it('devuelve error cuando no es ok', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 502, json: () => Promise.resolve({ error: 'boom' }) }))
    const r = await enviarTurnoEntrevista(base.messages, base.cuerpo, base.modo)
    expect(r.content).toBeNull()
    expect(r.error).toBe('boom')
  })

  it('captura excepciones de red', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
    const r = await enviarTurnoEntrevista(base.messages, base.cuerpo, base.modo)
    expect(r.error).toBe('offline')
  })
})
