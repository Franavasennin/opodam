import { describe, it, expect } from 'vitest'
import { fusionar, decodificarVector, type Puntuado } from './retrieval'

describe('decodificarVector', () => {
  it('base64 int8 → Float32 dividido por 127', () => {
    const bytes = new Uint8Array([127, (-64) & 0xff, 0])
    const v = decodificarVector(btoa(String.fromCharCode(...bytes)))
    expect(v[0]).toBeCloseTo(1, 5)
    expect(v[1]).toBeCloseTo(-64 / 127, 5)
    expect(v[2]).toBe(0)
  })
})

describe('fusionar', () => {
  it('normaliza min-max y combina al 50/50', () => {
    const lex: Puntuado[] = [{ i: 0, score: 10 }, { i: 1, score: 0 }]
    const sem: Puntuado[] = [{ i: 0, score: 0 }, { i: 1, score: 4 }]
    const r = fusionar(lex, sem, 0.5, 0.5)
    const m = new Map(r.map(x => [x.i, x.score]))
    expect(m.get(0)).toBeCloseTo(0.5, 5)
    expect(m.get(1)).toBeCloseTo(0.5, 5)
  })
  it('sin lista semántica devuelve el orden léxico', () => {
    const lex: Puntuado[] = [{ i: 2, score: 5 }, { i: 3, score: 1 }]
    const r = fusionar(lex, [], 0.5, 0.5)
    expect(r[0].i).toBe(2)
  })
})
