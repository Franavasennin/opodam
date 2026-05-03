import { describe, it, expect, beforeEach } from 'vitest'
import { calcularNotaExamen, calcularDebilidadesPorExamen } from '../../src/services/examen'

beforeEach(() => localStorage.clear())

describe('calcularNotaExamen', () => {
  it('50 aciertos 0 errores = 10.00', () => {
    expect(calcularNotaExamen(50, 0)).toBe(10)
  })
  it('25 aciertos 0 errores = 5.00 (aprobado justo)', () => {
    expect(calcularNotaExamen(25, 0)).toBe(5)
  })
  it('37 aciertos 9 errores = 6.80', () => {
    // 37*0.20=7.40, floor(9/3)*0.20=0.60, nota=6.80
    expect(calcularNotaExamen(37, 9)).toBe(6.80)
  })
  it('3 errores exactos restan 0.20', () => {
    expect(calcularNotaExamen(25, 3)).toBe(4.80)
  })
  it('2 errores NO restan nada', () => {
    expect(calcularNotaExamen(25, 2)).toBe(5)
  })
  it('nota nunca negativa', () => {
    expect(calcularNotaExamen(0, 50)).toBe(0)
  })
  it('nota máxima 10', () => {
    expect(calcularNotaExamen(100, 0)).toBe(10)
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
