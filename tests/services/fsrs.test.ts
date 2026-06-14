import { describe, it, expect } from 'vitest'
import {
  type Grado, estadoInicial, repasar, retrievability, intervaloDias, RETENCION_OBJETIVO,
} from '../../src/services/fsrs'

describe('retrievability', () => {
  it('= 1 a los 0 días', () => {
    expect(retrievability(0, 10)).toBeCloseTo(1, 5)
  })
  it('≈ retención objetivo cuando días = estabilidad', () => {
    expect(retrievability(10, 10)).toBeCloseTo(RETENCION_OBJETIVO, 5)
  })
  it('decae con el tiempo', () => {
    expect(retrievability(20, 10)).toBeLessThan(retrievability(5, 10))
  })
})

describe('intervaloDias', () => {
  it('mayor estabilidad ⇒ mayor intervalo', () => {
    expect(intervaloDias(50)).toBeGreaterThan(intervaloDias(5))
  })
  it('nunca por debajo de 1', () => {
    expect(intervaloDias(0.1)).toBeGreaterThanOrEqual(1)
  })
})

describe('estadoInicial', () => {
  it('mejor grado ⇒ más estabilidad y menos dificultad', () => {
    const again = estadoInicial(1)
    const easy = estadoInicial(4)
    expect(easy.stability).toBeGreaterThan(again.stability)
    expect(easy.difficulty).toBeLessThan(again.difficulty)
  })
  it('dificultad siempre dentro de [1,10]', () => {
    for (const g of [1, 2, 3, 4] as Grado[]) {
      const e = estadoInicial(g)
      expect(e.difficulty).toBeGreaterThanOrEqual(1)
      expect(e.difficulty).toBeLessThanOrEqual(10)
    }
  })
})

describe('repasar', () => {
  const base = estadoInicial(3) // Good
  it('acierto (Good) aumenta la estabilidad', () => {
    const nuevo = repasar(base, 3, intervaloDias(base.stability))
    expect(nuevo.stability).toBeGreaterThan(base.stability)
  })
  it('olvido (Again) deja la estabilidad por debajo de la previa en card madura', () => {
    const maduro = { stability: 40, difficulty: 5 }
    const nuevo = repasar(maduro, 1, 40)
    expect(nuevo.stability).toBeLessThan(maduro.stability)
  })
  it('Again sube la dificultad, Easy la baja', () => {
    const peor = repasar(base, 1, 5)
    const mejor = repasar(base, 4, 5)
    expect(peor.difficulty).toBeGreaterThan(base.difficulty)
    expect(mejor.difficulty).toBeLessThan(base.difficulty)
  })
  it('mantiene la dificultad en [1,10]', () => {
    let e = { stability: 5, difficulty: 9.5 }
    for (let i = 0; i < 10; i++) e = repasar(e, 1, 5)
    expect(e.difficulty).toBeLessThanOrEqual(10)
    expect(e.difficulty).toBeGreaterThanOrEqual(1)
  })
})
