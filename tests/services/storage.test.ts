import { describe, it, expect, beforeEach } from 'vitest'
import { getProgreso, saveProgreso, resetProgreso, getProgresoKey } from '../../src/services/storage'
import type { Progreso } from '../../src/types'

const progresoVacio: Progreso = {
  temas: {},
  flashcards: {},
  racha: { dias: 0, ultimoEstudio: null },
  tiempoTotalSegundos: 0,
  notificaciones: { hora: '19:00', activas: false },
  historialExamenes: [],
  sesionDiaria: null,
  rendimientoPorTema: {},
}

beforeEach(() => localStorage.clear())

describe('getProgreso', () => {
  it('devuelve progreso vacío si no hay datos', () => {
    expect(getProgreso()).toEqual(progresoVacio)
  })
  it('devuelve progreso guardado previamente', () => {
    const dato: Progreso = { ...progresoVacio, tiempoTotalSegundos: 300 }
    localStorage.setItem(getProgresoKey(), JSON.stringify(dato))
    expect(getProgreso()).toEqual(dato)
  })
})

describe('saveProgreso', () => {
  it('persiste en localStorage', () => {
    const dato: Progreso = { ...progresoVacio, tiempoTotalSegundos: 600 }
    saveProgreso(dato)
    expect(JSON.parse(localStorage.getItem(getProgresoKey())!)).toEqual(dato)
  })
})

describe('resetProgreso', () => {
  it('borra todos los datos', () => {
    saveProgreso({ ...progresoVacio, tiempoTotalSegundos: 999 })
    resetProgreso()
    expect(getProgreso()).toEqual(progresoVacio)
  })
})
