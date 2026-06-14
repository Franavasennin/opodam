import { describe, it, expect } from 'vitest'
import { textoFlashcard, ttsDisponible, hablar, pararTTS } from '../../src/services/tts'

describe('textoFlashcard', () => {
  it('solo pregunta cuando no hay respuesta', () => {
    expect(textoFlashcard('¿Qué es el habeas corpus?')).toBe('¿Qué es el habeas corpus?')
  })
  it('encadena pregunta y respuesta', () => {
    expect(textoFlashcard('¿Capital?', 'Madrid')).toBe('¿Capital?. Respuesta: Madrid')
  })
  it('recorta espacios y trata respuesta vacía como ausente', () => {
    expect(textoFlashcard('  P  ', '   ')).toBe('P')
  })
})

describe('TTS defensivo (sin Web Speech API en jsdom)', () => {
  it('ttsDisponible devuelve un booleano sin lanzar', () => {
    expect(typeof ttsDisponible()).toBe('boolean')
  })
  it('hablar y pararTTS no lanzan aunque no haya soporte', () => {
    expect(() => hablar('hola')).not.toThrow()
    expect(() => pararTTS()).not.toThrow()
  })
})
