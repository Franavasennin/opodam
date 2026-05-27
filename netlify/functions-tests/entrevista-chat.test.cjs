const { test } = require('node:test')
const assert = require('node:assert')
const { buildSystemPrompt, validarMensajes } = require('../functions/entrevista-chat.cjs')

test('buildSystemPrompt menciona el cuerpo y el modo practica', () => {
  const p = buildSystemPrompt({ cuerpo: 'cgpc', modo: 'practica' })
  assert.match(p, /cgpc/i)
  assert.match(p, /STAR/)
  assert.match(p, /entrenador/i)
})

test('buildSystemPrompt en modo examen pide feedback minimo', () => {
  const p = buildSystemPrompt({ cuerpo: 'policia-local', modo: 'examen' })
  assert.match(p, /examen/i)
})

test('validarMensajes acepta validos y rechaza invalidos', () => {
  assert.strictEqual(validarMensajes([{ role: 'user', content: 'hola' }]), null)
  assert.notStrictEqual(validarMensajes([]), null)
  assert.notStrictEqual(validarMensajes([{ role: 'x', content: 'y' }]), null)
})
