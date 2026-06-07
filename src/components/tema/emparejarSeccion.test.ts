import { describe, it, expect } from 'vitest'
import { emparejarSeccion } from './emparejarSeccion'

const secciones = [
  { titulo: 'Composición del Gobierno', contenido: 'El Gobierno se compone del Presidente, Vicepresidentes y Ministros.' },
  { titulo: 'La investidura del Presidente', contenido: 'El candidato es propuesto por el Rey y votado por el Congreso.' },
  { titulo: 'El Consejo de Estado', contenido: 'Supremo órgano consultivo del Gobierno.' },
]

describe('emparejarSeccion', () => {
  it('empareja por título casi exacto', () => {
    expect(emparejarSeccion('Investidura del Presidente', secciones)).toBe(1)
  })
  it('empareja ignorando tildes y mayúsculas', () => {
    expect(emparejarSeccion('composicion gobierno', secciones)).toBe(0)
  })
  it('empareja por aparición en el contenido', () => {
    expect(emparejarSeccion('Consejo de Estado', secciones)).toBe(2)
  })
  it('devuelve 0 cuando no hay coincidencia razonable', () => {
    expect(emparejarSeccion('tráfico de drogas', secciones)).toBe(0)
  })
  it('devuelve 0 con lista vacía', () => {
    expect(emparejarSeccion('lo que sea', [])).toBe(0)
  })
})
