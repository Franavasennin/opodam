import { describe, it, expect, beforeEach } from 'vitest'
import { calcularDebilidades, generarSesionDiaria, totalPreguntasRespondidas } from '../../src/services/adaptativo'
import type { Progreso } from '../../src/types'

beforeEach(() => localStorage.clear())

const rendimiento: Progreso['rendimientoPorTema'] = {
  '5':  { aciertos: 3,  errores: 7,  total: 10 }, // 30%
  '12': { aciertos: 5,  errores: 5,  total: 10 }, // 50%
  '7':  { aciertos: 8,  errores: 2,  total: 10 }, // 80%
  '1':  { aciertos: 1,  errores: 0,  total: 2  }, // total < 3, ignorar
}

describe('calcularDebilidades', () => {
  it('ordena de menor a mayor % aciertos', () => {
    const ids = calcularDebilidades(rendimiento)
    expect(ids[0]).toBe(5)
    expect(ids[1]).toBe(12)
    expect(ids[2]).toBe(7)
  })
  it('excluye temas con menos de 3 preguntas respondidas', () => {
    expect(calcularDebilidades(rendimiento)).not.toContain(1)
  })
  it('devuelve array vacío si no hay datos suficientes', () => {
    expect(calcularDebilidades({})).toEqual([])
  })
  it('limita a 5 resultados por defecto', () => {
    const muchos: Progreso['rendimientoPorTema'] = {}
    for (let i = 1; i <= 10; i++) {
      muchos[String(i)] = { aciertos: i, errores: 10 - i, total: 10 }
    }
    expect(calcularDebilidades(muchos).length).toBe(5)
  })
})

describe('generarSesionDiaria', () => {
  it('devuelve sesión con fecha correcta y completada=false', () => {
    const hoy = new Date().toISOString().slice(0, 10)
    const sesion = generarSesionDiaria(rendimiento, {}, hoy)
    expect(sesion.fecha).toBe(hoy)
    expect(sesion.completada).toBe(false)
    expect(Array.isArray(sesion.flashcardIds)).toBe(true)
    expect(Array.isArray(sesion.preguntaIds)).toBe(true)
  })
})

describe('totalPreguntasRespondidas', () => {
  it('suma los totales de todos los temas', () => {
    expect(totalPreguntasRespondidas(rendimiento)).toBe(32) // 10+10+10+2
  })
  it('devuelve 0 si no hay datos', () => {
    expect(totalPreguntasRespondidas({})).toBe(0)
  })
})
