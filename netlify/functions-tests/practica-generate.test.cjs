import { test, expect } from 'vitest'
import { buildPrompt, validarItems } from '../functions/practica-generate.cjs'

test('buildPrompt psicotecnico menciona la categoría', () => {
  const p = buildPrompt({ tipo: 'psicotecnico', categoria: 'series-numericas' })
  expect(p).toMatch(/series/i)
  expect(p).toMatch(/JSON/i)
})

test('buildPrompt supuesto incluye el contexto del temario', () => {
  const p = buildPrompt({ tipo: 'supuesto', slug: 'cgpc', contexto: 'texto del temario X' })
  expect(p).toMatch(/texto del temario X/)
  expect(p).toMatch(/caso/i)
})

test('validarItems acepta preguntas válidas y rechaza inválidas', () => {
  const ok = [{ enunciado: 'e', opciones: ['a', 'b'], respuestaCorrecta: 1, explicacion: 'x' }]
  expect(validarItems(ok)).toBe(true)
  expect(validarItems([{ enunciado: 'e', opciones: ['a'], respuestaCorrecta: 5 }])).toBe(false)
  expect(validarItems('no-array')).toBe(false)
})
