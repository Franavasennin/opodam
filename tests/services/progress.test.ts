import { describe, it, expect, beforeEach } from 'vitest'
import {
  calcularPuntuacionTest,
  debeActualizarRacha,
  contarVueltasGlobal,
  temasPrioritarios,
} from '../../src/services/progress'
import type { Progreso } from '../../src/types'

beforeEach(() => localStorage.clear())

describe('calcularPuntuacionTest', () => {
  it('aplica fórmula oficial (A - E/3) / total * 10', () => {
    expect(calcularPuntuacionTest(8, 2, 10)).toBeCloseTo(7.33, 1)
  })
  it('devuelve 0 cuando errores superan aciertos ponderados', () => {
    expect(calcularPuntuacionTest(0, 15, 15)).toBe(0)
  })
  it('devuelve 10 con todos aciertos', () => {
    expect(calcularPuntuacionTest(10, 0, 10)).toBe(10)
  })
})

describe('debeActualizarRacha', () => {
  it('true si ultimoEstudio fue ayer', () => {
    const ayer = new Date()
    ayer.setDate(ayer.getDate() - 1)
    expect(debeActualizarRacha(ayer.toISOString().slice(0, 10))).toBe(true)
  })
  it('false si ultimoEstudio fue hoy', () => {
    expect(debeActualizarRacha(new Date().toISOString().slice(0, 10))).toBe(false)
  })
  it('false si han pasado 2+ días (racha rota)', () => {
    const hace2 = new Date()
    hace2.setDate(hace2.getDate() - 2)
    expect(debeActualizarRacha(hace2.toISOString().slice(0, 10))).toBe(false)
  })
})

describe('contarVueltasGlobal', () => {
  it('devuelve la vuelta mínima entre todos los temas', () => {
    const temas: Progreso['temas'] = {
      '1': { vueltas: 3, ultimaRevision: null, porcentajeAciertos: 0, teoriaLeida: false },
      '2': { vueltas: 1, ultimaRevision: null, porcentajeAciertos: 0, teoriaLeida: false },
    }
    expect(contarVueltasGlobal(temas, 2)).toBe(1)
  })
  it('devuelve 0 si hay temas sin progreso', () => {
    expect(contarVueltasGlobal({}, 5)).toBe(0)
  })
})

describe('temasPrioritarios', () => {
  it('devuelve IDs con vueltas por debajo de la media', () => {
    const temas: Progreso['temas'] = {
      '1': { vueltas: 5, ultimaRevision: null, porcentajeAciertos: 0, teoriaLeida: false },
      '2': { vueltas: 1, ultimaRevision: null, porcentajeAciertos: 0, teoriaLeida: false },
      '3': { vueltas: 3, ultimaRevision: null, porcentajeAciertos: 0, teoriaLeida: false },
    }
    const ids = temasPrioritarios(temas, [1, 2, 3])
    expect(ids).toContain(2)
    expect(ids).not.toContain(1)
  })
})
