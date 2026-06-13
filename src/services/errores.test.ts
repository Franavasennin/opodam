import { describe, it, expect, beforeEach } from 'vitest'
import {
  registrarRespuesta,
  registrarLote,
  preguntasEnCuaderno,
  contarErrores,
  GRADUACION,
} from './errores'
import { getProgreso } from './storage'

beforeEach(() => {
  localStorage.clear()
})

describe('cuaderno de errores', () => {
  it('añade una pregunta al fallarla', () => {
    registrarRespuesta('p1', 3, false)
    expect(contarErrores()).toBe(1)
    expect(getProgreso().erroresPorPregunta['p1']).toMatchObject({ temaId: 3, fallos: 1, aciertosSeguidos: 0 })
  })

  it('no añade preguntas que se aciertan a la primera', () => {
    registrarRespuesta('p1', 3, true)
    expect(contarErrores()).toBe(0)
  })

  it('gradúa (saca del cuaderno) tras GRADUACION aciertos seguidos', () => {
    registrarRespuesta('p1', 3, false)            // entra
    for (let i = 0; i < GRADUACION - 1; i++) {
      registrarRespuesta('p1', 3, true)           // aciertos intermedios: sigue dentro
      expect(contarErrores()).toBe(1)
    }
    registrarRespuesta('p1', 3, true)             // último acierto: gradúa
    expect(contarErrores()).toBe(0)
  })

  it('un fallo reinicia la racha de aciertos', () => {
    registrarRespuesta('p1', 3, false)
    registrarRespuesta('p1', 3, true)             // aciertosSeguidos = 1
    registrarRespuesta('p1', 3, false)            // reinicia a 0 y suma fallo
    const e = getProgreso().erroresPorPregunta['p1']
    expect(e.aciertosSeguidos).toBe(0)
    expect(e.fallos).toBe(2)
    expect(contarErrores()).toBe(1)
  })

  it('registrarLote procesa todas las respuestas pasadas', () => {
    registrarLote([
      { id: 'p1', temaId: 1, acierto: false },
      { id: 'p2', temaId: 1, acierto: false },
    ])
    expect(contarErrores()).toBe(2)
  })

  it('ordena el cuaderno por fragilidad: más fallos primero', () => {
    registrarRespuesta('pA', 1, false)
    registrarRespuesta('pB', 2, false)
    registrarRespuesta('pB', 2, false)            // pB con 2 fallos
    const orden = preguntasEnCuaderno().map(x => x.id)
    expect(orden[0]).toBe('pB')
  })
})
