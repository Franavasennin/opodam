const { test } = require('node:test')
const assert = require('node:assert')
const { buildPrompt, validarItems } = require('../functions/practica-generate.cjs')

test('buildPrompt psicotecnico menciona la categoría', () => {
  const p = buildPrompt({ tipo: 'psicotecnico', categoria: 'series-numericas' })
  assert.match(p, /series/i)
  assert.match(p, /JSON/i)
})

test('buildPrompt supuesto incluye el contexto del temario', () => {
  const p = buildPrompt({ tipo: 'supuesto', slug: 'cgpc', contexto: 'texto del temario X' })
  assert.match(p, /texto del temario X/)
  assert.match(p, /caso/i)
})

test('validarItems acepta preguntas válidas y rechaza inválidas', () => {
  const ok = [{ enunciado: 'e', opciones: ['a', 'b'], respuestaCorrecta: 1, explicacion: 'x' }]
  assert.strictEqual(validarItems(ok), true)
  assert.strictEqual(validarItems([{ enunciado: 'e', opciones: ['a'], respuestaCorrecta: 5 }]), false)
  assert.strictEqual(validarItems('no-array'), false)
})
