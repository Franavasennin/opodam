import { describe, it, expect } from 'vitest'
import { CATEGORIAS, cargarCategoria } from './index'

describe('psicotecnicos index', () => {
  it('expone 5 categorías con id y titulo', () => {
    expect(CATEGORIAS).toHaveLength(5)
    expect(CATEGORIAS[0]).toHaveProperty('id')
    expect(CATEGORIAS[0]).toHaveProperty('titulo')
  })

  it('cargarCategoria devuelve un array de preguntas', async () => {
    const preguntas = await cargarCategoria('series-numericas')
    expect(Array.isArray(preguntas)).toBe(true)
    expect(preguntas[0]).toHaveProperty('enunciado')
    expect(preguntas[0]).toHaveProperty('respuestaCorrecta')
  })

  it('categoría inexistente devuelve []', async () => {
    expect(await cargarCategoria('no-existe')).toEqual([])
  })
})
