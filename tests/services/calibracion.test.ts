import { describe, it, expect, beforeEach } from 'vitest'
import {
  calibracionInicial, claseCalibracion, acumular,
  totalConfianza, tasaFalsosSeguros, registrarCalibracion,
} from '../../src/services/calibracion'
import { getProgreso } from '../../src/services/storage'

beforeEach(() => localStorage.clear())

describe('claseCalibracion', () => {
  it('mapea las 4 combinaciones', () => {
    expect(claseCalibracion(true, 'seguro')).toBe('seguroAcierto')
    expect(claseCalibracion(false, 'seguro')).toBe('seguroFallo')
    expect(claseCalibracion(true, 'dudo')).toBe('dudoAcierto')
    expect(claseCalibracion(false, 'dudo')).toBe('dudoFallo')
  })
})

describe('acumular', () => {
  it('suma respetando la casilla y descarta las sin confianza', () => {
    const cal = acumular(calibracionInicial(), [
      { acierto: true, confianza: 'seguro' },
      { acierto: false, confianza: 'seguro' },
      { acierto: true, confianza: 'dudo' },
      { acierto: false },                 // sin confianza → ignorada
    ])
    expect(cal).toEqual({ seguroAcierto: 1, seguroFallo: 1, dudoAcierto: 1, dudoFallo: 0 })
  })
  it('no muta la calibración de entrada', () => {
    const base = calibracionInicial()
    acumular(base, [{ acierto: false, confianza: 'seguro' }])
    expect(base.seguroFallo).toBe(0)
  })
})

describe('tasaFalsosSeguros', () => {
  it('es seguroFallo sobre el total con confianza', () => {
    expect(tasaFalsosSeguros({ seguroAcierto: 3, seguroFallo: 1, dudoAcierto: 0, dudoFallo: 0 })).toBe(25)
  })
  it('0 sin datos', () => {
    expect(tasaFalsosSeguros(calibracionInicial())).toBe(0)
    expect(totalConfianza(calibracionInicial())).toBe(0)
  })
})

describe('registrarCalibracion', () => {
  it('persiste el lote en el progreso', () => {
    registrarCalibracion([
      { acierto: false, confianza: 'seguro' },
      { acierto: true, confianza: 'dudo' },
    ])
    expect(getProgreso().calibracion).toEqual({ seguroAcierto: 0, seguroFallo: 1, dudoAcierto: 1, dudoFallo: 0 })
  })
  it('no escribe si ninguna respuesta lleva confianza', () => {
    registrarCalibracion([{ acierto: true }, { acierto: false }])
    expect(getProgreso().calibracion).toEqual(calibracionInicial())
  })
  it('acumula entre llamadas', () => {
    registrarCalibracion([{ acierto: false, confianza: 'seguro' }])
    registrarCalibracion([{ acierto: false, confianza: 'seguro' }])
    expect(getProgreso().calibracion.seguroFallo).toBe(2)
  })
})
