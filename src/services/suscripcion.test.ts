import { describe, it, expect } from 'vitest'
import { diasRestantes, rutaDesdeEstado } from './suscripcion'

describe('diasRestantes', () => {
  it('devuelve 7 el mismo día de inicio', () => {
    const ahora = new Date('2026-05-30T12:00:00Z')
    expect(diasRestantes('2026-05-30T12:00:00Z', ahora)).toBe(7)
  })
  it('redondea hacia arriba los días parciales', () => {
    const ahora = new Date('2026-06-02T18:00:00Z') // 3.25 días pasados
    expect(diasRestantes('2026-05-30T12:00:00Z', ahora)).toBe(4) // 7 - 3.25 = 3.75 → ceil 4
  })
  it('devuelve 0 cuando ya expiró', () => {
    const ahora = new Date('2026-06-10T12:00:00Z')
    expect(diasRestantes('2026-05-30T12:00:00Z', ahora)).toBe(0)
  })
  it('devuelve null si no hay trial_start', () => {
    expect(diasRestantes(null, new Date())).toBeNull()
  })
})

describe('rutaDesdeEstado', () => {
  it('activo → null (renderiza)', () => {
    expect(rutaDesdeEstado('activo')).toBeNull()
  })
  it('sin-oposicion → /mis-oposiciones', () => {
    expect(rutaDesdeEstado('sin-oposicion')).toBe('/mis-oposiciones')
  })
  it('expirado → EXTERNO', () => {
    expect(rutaDesdeEstado('expirado')).toBe('EXTERNO')
  })
})
