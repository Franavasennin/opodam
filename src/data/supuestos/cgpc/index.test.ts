import { describe, it, expect } from 'vitest'
import { SUPUESTOS_META, cargarSupuesto } from './index'

describe('supuestos cgpc index', () => {
  it('SUPUESTOS_META tiene al menos un supuesto con id y titulo', () => {
    expect(SUPUESTOS_META.length).toBeGreaterThan(0)
    expect(SUPUESTOS_META[0]).toHaveProperty('id')
    expect(SUPUESTOS_META[0]).toHaveProperty('titulo')
  })

  it('cargarSupuesto devuelve caso y preguntas', async () => {
    const s = await cargarSupuesto(SUPUESTOS_META[0].id)
    expect(s).not.toBeNull()
    expect(typeof s!.caso).toBe('string')
    expect(Array.isArray(s!.preguntas)).toBe(true)
  })

  it('id inexistente devuelve null', async () => {
    expect(await cargarSupuesto('no-existe')).toBeNull()
  })
})
