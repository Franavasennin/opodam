import { describe, it, expect, vi, afterEach } from 'vitest'
import { generarTestDuda, generarFlashcardsDuda } from './practica'

afterEach(() => { vi.restoreAllMocks() })

describe('generarTestDuda', () => {
  it('mapea preguntas y añade id', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ preguntas: [{ enunciado: 'q', opciones: ['a','b','c'], respuestaCorrecta: 1, explicacion: 'e' }] }),
    })))
    const { preguntas, error } = await generarTestDuda('duda', 'ctx')
    expect(error).toBeNull()
    expect(preguntas[0].id).toBeTruthy()
    expect(preguntas[0].respuestaCorrecta).toBe(1)
  })
  it('propaga error de red', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: false, status: 502, json: () => Promise.resolve({ error: 'x' }) })))
    const { preguntas, error } = await generarTestDuda('d', 'c')
    expect(preguntas).toEqual([])
    expect(error).toBeTruthy()
  })
})

describe('generarFlashcardsDuda', () => {
  it('devuelve flashcards', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ flashcards: [{ pregunta: 'p', respuesta: 'r' }] }),
    })))
    const { flashcards, error } = await generarFlashcardsDuda('d', 'c')
    expect(error).toBeNull()
    expect(flashcards[0]).toEqual({ pregunta: 'p', respuesta: 'r' })
  })
})
