import { test, expect } from 'vitest'
import { buildSystemPrompt, normalizarFlashcard, normalizarPregunta } from '../functions/tutor-chat.cjs'

test('normalizarFlashcard soporta ambos formatos', () => {
  expect(normalizarFlashcard({ anverso: 'a', reverso: 'b' })).toEqual({ front: 'a', back: 'b' })
  expect(normalizarFlashcard({ pregunta: 'p', respuesta: 'r' })).toEqual({ front: 'p', back: 'r' })
})

test('normalizarPregunta resuelve la opción correcta en ambos formatos', () => {
  expect(normalizarPregunta({ enunciado: 'e', opciones: ['x','y'], correcta: 1 }).correctaTexto).toBe('y')
  expect(normalizarPregunta({ enunciado: 'e', opciones: ['x','y','z'], respuestaCorrecta: 2 }).correctaTexto).toBe('z')
})

test('buildSystemPrompt incluye el título, las secciones y la regla de aviso', () => {
  const prompt = buildSystemPrompt({
    titulo: 'Tema Test',
    secciones: [{ titulo: 'S1', contenido: 'contenido uno' }],
    flashcards: [{ anverso: 'fa', reverso: 'fb' }],
    preguntas: [{ enunciado: 'pe', opciones: ['o1','o2'], correcta: 0 }],
  })
  expect(prompt).toMatch(/Tema Test/)
  expect(prompt).toMatch(/contenido uno/)
  expect(prompt).toMatch(/no aparece en el temario oficial/i)
})
