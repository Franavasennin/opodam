const { test } = require('node:test')
const assert = require('node:assert')
const { buildSystemPrompt, normalizarFlashcard, normalizarPregunta } = require('../functions/tutor-chat.cjs')

test('normalizarFlashcard soporta ambos formatos', () => {
  assert.deepStrictEqual(
    normalizarFlashcard({ anverso: 'a', reverso: 'b' }),
    { front: 'a', back: 'b' }
  )
  assert.deepStrictEqual(
    normalizarFlashcard({ pregunta: 'p', respuesta: 'r' }),
    { front: 'p', back: 'r' }
  )
})

test('normalizarPregunta resuelve la opción correcta en ambos formatos', () => {
  assert.strictEqual(normalizarPregunta({ enunciado: 'e', opciones: ['x','y'], correcta: 1 }).correctaTexto, 'y')
  assert.strictEqual(normalizarPregunta({ enunciado: 'e', opciones: ['x','y','z'], respuestaCorrecta: 2 }).correctaTexto, 'z')
})

test('buildSystemPrompt incluye el título, las secciones y la regla de aviso', () => {
  const prompt = buildSystemPrompt({
    titulo: 'Tema Test',
    secciones: [{ titulo: 'S1', contenido: 'contenido uno' }],
    flashcards: [{ anverso: 'fa', reverso: 'fb' }],
    preguntas: [{ enunciado: 'pe', opciones: ['o1','o2'], correcta: 0 }],
  })
  assert.match(prompt, /Tema Test/)
  assert.match(prompt, /contenido uno/)
  assert.match(prompt, /no aparece en el temario oficial/i)
})
