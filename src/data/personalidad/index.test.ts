import { describe, it, expect } from 'vitest'
import { RASGOS, cargarCuestionario, puntuar, interpretacion } from './index'

describe('personalidad', () => {
  it('RASGOS y cuestionario no vacíos; ítems con rasgo válido', () => {
    expect(RASGOS.length).toBeGreaterThan(0)
    const items = cargarCuestionario()
    expect(items.length).toBeGreaterThan(0)
    const ids = RASGOS.map(r => r.id)
    for (const it of items) expect(ids).toContain(it.rasgo)
  })

  it('puntuar normaliza 0-100 y aplica inversión', () => {
    const items = cargarCuestionario()
    const rasgo = items[0].rasgo
    const delRasgo = items.filter(i => i.rasgo === rasgo)
    const respuestas: Record<string, number> = {}
    delRasgo.forEach(i => { respuestas[i.id] = i.invertido ? 1 : 5 })
    const res = puntuar(respuestas)
    const r = res.find(x => x.rasgo === rasgo)!
    expect(r.puntuacion).toBe(100)
    expect(r.banda).toBe('alto')
  })

  it('interpretacion devuelve texto para cada banda', () => {
    expect(typeof interpretacion(RASGOS[0].id, 'alto')).toBe('string')
    expect(interpretacion(RASGOS[0].id, 'bajo').length).toBeGreaterThan(0)
  })
})
