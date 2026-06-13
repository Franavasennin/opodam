import { describe, it, expect, beforeEach } from 'vitest'
import { calcularNotaExamen, calcularDebilidadesPorExamen } from '../../src/services/examen'

beforeEach(() => localStorage.clear())

describe('calcularNotaExamen (consciente del total y la penalización)', () => {
  it('50 aciertos de 50, 0 errores = 10.00', () => {
    expect(calcularNotaExamen(50, 0, 50)).toBe(10)
  })
  it('25 aciertos de 50, 0 errores = 5.00 (aprobado justo)', () => {
    expect(calcularNotaExamen(25, 0, 50)).toBe(5)
  })
  it('37 aciertos 9 errores de 50 = 6.80 (penalización 1/3)', () => {
    // (37 − 9×1/3)/50×10 = (37−3)/50×10 = 6.80
    expect(calcularNotaExamen(37, 9, 50)).toBe(6.80)
  })
  it('penaliza de forma continua: 25 aciertos 2 errores de 50 ≈ 4.87', () => {
    // (25 − 2×1/3)/50×10 = 24.3333/50×10 = 4.866… → 4.87
    expect(calcularNotaExamen(25, 2, 50)).toBe(4.87)
  })
  it('penalización 0: los errores no restan', () => {
    expect(calcularNotaExamen(25, 10, 50, 0)).toBe(5)
  })
  it('penalización mayor (1/2) resta más', () => {
    // (24 − 6×1/2)/50×10 = (24−3)/50×10 = 4.20
    expect(calcularNotaExamen(24, 6, 50, 1 / 2)).toBe(4.20)
  })
  it('corrige el techo del mini-examen: 25 de 25 = 10', () => {
    expect(calcularNotaExamen(25, 0, 25)).toBe(10)
  })
  it('nota nunca negativa', () => {
    expect(calcularNotaExamen(0, 50, 50)).toBe(0)
  })
  it('nota máxima 10', () => {
    expect(calcularNotaExamen(100, 0, 50)).toBe(10)
  })
  it('total 0 devuelve 0 sin romper', () => {
    expect(calcularNotaExamen(0, 0, 0)).toBe(0)
  })
})

describe('calcularDebilidadesPorExamen', () => {
  it('devuelve objeto vacío cuando no hay preguntas', () => {
    expect(calcularDebilidadesPorExamen([], {}, {})).toEqual({})
  })
  it('cuenta aciertos y errores por tema', () => {
    const preguntas = [
      { id: 'p1', temaId: 5 },
      { id: 'p2', temaId: 5 },
      { id: 'p3', temaId: 7 },
    ]
    const respuestas: Record<string, number | null> = { p1: 0, p2: 1, p3: null }
    const correctas: Record<string, number> = { p1: 0, p2: 0, p3: 2 }
    const result = calcularDebilidadesPorExamen(preguntas, respuestas, correctas)
    expect(result[5]).toEqual({ aciertos: 1, errores: 1, total: 2 })
    expect(result[7]).toEqual({ aciertos: 0, errores: 0, total: 1 }) // en blanco no penaliza
  })
})
