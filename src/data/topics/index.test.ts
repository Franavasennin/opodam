import { describe, it, expect } from 'vitest'
import { obtenerTopics } from './index'

describe('obtenerTopics', () => {
  it('devuelve el modulo de CGPC con 45 temas', () => {
    const t = obtenerTopics('cgpc')
    expect(t.TOTAL_TEMAS).toBe(45)
    expect(typeof t.cargarTema).toBe('function')
  })

  it('devuelve el modulo de Policia Local con 37 temas', () => {
    const t = obtenerTopics('policia-local')
    expect(t.TOTAL_TEMAS).toBe(37)
  })

  it('lanza error para un slug desconocido', () => {
    expect(() => obtenerTopics('inexistente')).toThrow()
  })
})
