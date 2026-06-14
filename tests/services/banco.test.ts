import { describe, it, expect } from 'vitest'
import { mapearFilaBanco, fusionarBanco, type FilaBanco } from '../../src/services/banco'

const fila = (p: Partial<FilaBanco>): FilaBanco => ({
  id: 'abc', tema_id: 3, enunciado: '¿Qué artículo?', opciones: ['A', 'B', 'C', 'D'],
  correcta: 1, explicacion: 'Porque sí', ...p,
})

describe('mapearFilaBanco', () => {
  it('mapea la fila al formato Pregunta con prefijo de id y temaId', () => {
    const p = mapearFilaBanco(fila({ id: 'xyz', tema_id: 7 }))
    expect(p.id).toBe('banco-xyz')
    expect(p.temaId).toBe(7)
    expect(p.correcta).toBe(1)
    expect(p.opciones).toEqual(['A', 'B', 'C', 'D'])
  })
  it('explicacion null ⇒ cadena vacía', () => {
    expect(mapearFilaBanco(fila({ explicacion: null })).explicacion).toBe('')
  })
})

describe('fusionarBanco', () => {
  const q = (enunciado: string) => ({ enunciado })

  it('añade preguntas del banco que no duplican enunciado local', () => {
    const out = fusionarBanco([q('Uno'), q('Dos')], [q('Tres'), q('Cuatro')])
    expect(out.map(p => p.enunciado)).toEqual(['Uno', 'Dos', 'Tres', 'Cuatro'])
  })

  it('descarta duplicados ignorando mayúsculas y espacios', () => {
    const out = fusionarBanco([q('La Constitución  Española')], [q('la constitución española'), q('Nueva')])
    expect(out.map(p => p.enunciado)).toEqual(['La Constitución  Española', 'Nueva'])
  })

  it('deduplica también dentro del propio banco', () => {
    const out = fusionarBanco([], [q('Repe'), q('repe'), q('Otra')])
    expect(out.map(p => p.enunciado)).toEqual(['Repe', 'Otra'])
  })

  it('locales siempre primero', () => {
    const out = fusionarBanco([q('L1')], [q('B1')])
    expect(out[0].enunciado).toBe('L1')
  })
})
