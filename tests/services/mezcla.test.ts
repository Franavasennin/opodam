import { describe, it, expect } from 'vitest'
import { elegirTemasMezcla, intercalarPreguntas } from '../../src/services/mezcla'
import type { ProgresoTema } from '../../src/types'

const tema = (p: Partial<ProgresoTema>): ProgresoTema => ({
  vueltas: 0, ultimaRevision: null, porcentajeAciertos: 0, teoriaLeida: false, ...p,
})

const HOY = '2026-06-14'

describe('elegirTemasMezcla', () => {
  it('sin temas estudiados ⇒ vacío', () => {
    const sel = elegirTemasMezcla({ '1': tema({ vueltas: 0 }) }, [1], HOY)
    expect(sel.ids).toEqual([])
    expect(sel.debil).toBeNull()
  })

  it('elige débil + riesgo + dominado de perfiles distintos', () => {
    const temas: Record<string, ProgresoTema> = {
      // dominado: alto acierto, revisado ayer ⇒ dominio alto
      '1': tema({ vueltas: 3, porcentajeAciertos: 95, ultimaRevision: '2026-06-13' }),
      // débil: peor acierto
      '2': tema({ vueltas: 2, porcentajeAciertos: 20, ultimaRevision: '2026-06-13' }),
      // riesgo: buen acierto pero recuerdo parcialmente decaído (estado 'riesgo')
      '3': tema({ vueltas: 2, porcentajeAciertos: 70, ultimaRevision: '2026-06-05' }),
    }
    const sel = elegirTemasMezcla(temas, [1, 2, 3], HOY)
    expect(sel.debil).toBe(2)
    expect(sel.riesgo).toBe(3)
    expect(sel.dominado).toBe(1)
    expect(sel.ids).toEqual([2, 3, 1])
  })

  it('ids siempre distintos aunque un tema encaje en varias categorías', () => {
    const temas = {
      '1': tema({ vueltas: 1, porcentajeAciertos: 30, ultimaRevision: '2026-05-20' }),
      '2': tema({ vueltas: 1, porcentajeAciertos: 90, ultimaRevision: '2026-06-13' }),
    }
    const sel = elegirTemasMezcla(temas, [1, 2], HOY)
    expect(new Set(sel.ids).size).toBe(sel.ids.length)
    expect(sel.ids).toHaveLength(2) // solo 2 estudiados
  })

  it('rellena hasta 3 cuando faltan categorías', () => {
    const temas = {
      '1': tema({ vueltas: 1, porcentajeAciertos: 40, ultimaRevision: '2026-06-13' }),
      '2': tema({ vueltas: 1, porcentajeAciertos: 50, ultimaRevision: '2026-06-13' }),
      '3': tema({ vueltas: 1, porcentajeAciertos: 60, ultimaRevision: '2026-06-13' }),
      '4': tema({ vueltas: 1, porcentajeAciertos: 70, ultimaRevision: '2026-06-13' }),
    }
    const sel = elegirTemasMezcla(temas, [1, 2, 3, 4], HOY)
    expect(sel.ids).toHaveLength(3)
    expect(new Set(sel.ids).size).toBe(3)
  })
})

describe('intercalarPreguntas', () => {
  const q = (id: string) => ({ id })

  it('entrelaza en round-robin y etiqueta temaId', () => {
    const out = intercalarPreguntas([
      { temaId: 5, preguntas: [q('a'), q('b')] },
      { temaId: 9, preguntas: [q('c'), q('d')] },
    ], 10)
    expect(out.map(p => p.id)).toEqual(['a', 'c', 'b', 'd'])
    expect(out.map(p => p.temaId)).toEqual([5, 9, 5, 9])
  })

  it('recorta a n', () => {
    const out = intercalarPreguntas([
      { temaId: 1, preguntas: [q('a'), q('b'), q('c')] },
      { temaId: 2, preguntas: [q('d'), q('e'), q('f')] },
    ], 3)
    expect(out).toHaveLength(3)
    expect(out.map(p => p.id)).toEqual(['a', 'd', 'b'])
  })

  it('tolera grupos de distinto tamaño', () => {
    const out = intercalarPreguntas([
      { temaId: 1, preguntas: [q('a')] },
      { temaId: 2, preguntas: [q('b'), q('c')] },
    ], 10)
    expect(out.map(p => p.id)).toEqual(['a', 'b', 'c'])
  })
})
