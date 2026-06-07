import { test, expect } from 'vitest'
import { buildSystemPrompt, validarMensajes } from '../functions/entrevista-chat.cjs'

test('buildSystemPrompt menciona el cuerpo y el modo practica', () => {
  const p = buildSystemPrompt({ cuerpo: 'cgpc', modo: 'practica' })
  expect(p).toMatch(/cgpc/i)
  expect(p).toMatch(/STAR/)
  expect(p).toMatch(/entrenador/i)
})

test('buildSystemPrompt en modo examen pide feedback minimo', () => {
  const p = buildSystemPrompt({ cuerpo: 'policia-local', modo: 'examen' })
  expect(p).toMatch(/examen/i)
})

test('validarMensajes acepta validos y rechaza invalidos', () => {
  expect(validarMensajes([{ role: 'user', content: 'hola' }])).toBeNull()
  expect(validarMensajes([])).not.toBeNull()
  expect(validarMensajes([{ role: 'x', content: 'y' }])).not.toBeNull()
})
