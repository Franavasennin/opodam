import { describe, it, expect } from 'vitest'
import { seleccionarPreguntasTest } from './seleccionTest'
import type { Pregunta } from '../types'

function hacerPool(nNormal: number, nTrampa: number): Pregunta[] {
  const out: Pregunta[] = []
  for (let i = 0; i < nNormal; i++) {
    out.push({ id: `n${i}`, enunciado: `n${i}`, opciones: ['a', 'b'], respuestaCorrecta: 0, explicacion: '', dificultad: 'normal' })
  }
  for (let i = 0; i < nTrampa; i++) {
    out.push({ id: `t${i}`, enunciado: `t${i}`, opciones: ['a', 'b'], respuestaCorrecta: 0, explicacion: '', dificultad: 'dificil' })
  }
  return out
}

const esTrampa = (p: Pregunta) => p.dificultad === 'dificil'

describe('seleccionarPreguntasTest', () => {
  it('nunca devuelve más de la cantidad pedida', () => {
    const pool = hacerPool(30, 20)
    expect(seleccionarPreguntasTest(pool, 'normal', 30)).toHaveLength(30)
    expect(seleccionarPreguntasTest(pool, 'dificil', 30)).toHaveLength(30)
  })

  it('nunca devuelve más de las disponibles en el pool', () => {
    const pool = hacerPool(5, 3)
    expect(seleccionarPreguntasTest(pool, 'normal', 30)).toHaveLength(8)
    expect(seleccionarPreguntasTest(pool, 'dificil', 30)).toHaveLength(8)
  })

  it('no repite preguntas (ids únicos)', () => {
    const pool = hacerPool(30, 20)
    const sel = seleccionarPreguntasTest(pool, 'dificil', 30)
    const ids = new Set(sel.map(p => p.id))
    expect(ids.size).toBe(sel.length)
  })

  it('modo normal: solo preguntas normales cuando hay suficientes', () => {
    const pool = hacerPool(40, 20)
    const sel = seleccionarPreguntasTest(pool, 'normal', 30)
    expect(sel.every(p => !esTrampa(p))).toBe(true)
  })

  it('modo difícil: ~60% trampa cuando hay suficientes', () => {
    const pool = hacerPool(40, 40)
    const sel = seleccionarPreguntasTest(pool, 'dificil', 30)
    const nTrampa = sel.filter(esTrampa).length
    expect(nTrampa).toBe(18) // round(30 * 0.6)
  })

  it('modo difícil: rellena con normales si faltan trampa', () => {
    const pool = hacerPool(40, 5)
    const sel = seleccionarPreguntasTest(pool, 'dificil', 30)
    expect(sel).toHaveLength(30)
    expect(sel.filter(esTrampa).length).toBe(5) // usa las 5 trampa disponibles
  })

  it('varía entre llamadas (no siempre las mismas)', () => {
    const pool = hacerPool(50, 0)
    const a = seleccionarPreguntasTest(pool, 'normal', 30).map(p => p.id).join(',')
    const b = seleccionarPreguntasTest(pool, 'normal', 30).map(p => p.id).join(',')
    // Con 50 y sacando 30, la probabilidad de orden idéntico es ínfima.
    expect(a).not.toBe(b)
  })
})
