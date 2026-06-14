import { describe, it, expect } from 'vitest'
import {
  acumularTiempo, minutosTema, puntosTiempoAcierto, temasRelecturaPasiva,
} from '../../src/services/tiempo'
import type { ProgresoTema } from '../../src/types'

const tema = (p: Partial<ProgresoTema>): ProgresoTema => ({
  vueltas: 0, ultimaRevision: null, porcentajeAciertos: 0, teoriaLeida: false, ...p,
})

describe('acumularTiempo', () => {
  it('suma sin mutar el original', () => {
    const orig = { '1': 100 }
    const out = acumularTiempo(orig, 1, 50)
    expect(out['1']).toBe(150)
    expect(orig['1']).toBe(100) // no mutado
  })
  it('crea la entrada si no existía y redondea', () => {
    expect(acumularTiempo({}, 3, 12.6)['3']).toBe(13)
  })
  it('ignora segundos no positivos', () => {
    const orig = { '1': 100 }
    expect(acumularTiempo(orig, 1, 0)).toBe(orig)
    expect(acumularTiempo(orig, 1, -5)).toBe(orig)
  })
})

describe('minutosTema', () => {
  it('convierte segundos a minutos enteros', () => {
    expect(minutosTema({ '1': 90 }, 1)).toBe(2) // 1.5 → 2 (redondeo)
    expect(minutosTema({}, 9)).toBe(0)
  })
})

describe('puntosTiempoAcierto', () => {
  const metas = [{ id: 1, titulo: 'A' }, { id: 2, titulo: 'B' }, { id: 3, titulo: 'C' }]

  it('solo incluye temas con tiempo, ordenados por minutos desc', () => {
    const temas = { '1': tema({ vueltas: 1 }), '2': tema({ vueltas: 1 }) }
    const tiempo = { '1': 600, '2': 1800 } // 10 min, 30 min
    const puntos = puntosTiempoAcierto(temas, tiempo, metas)
    expect(puntos.map(p => p.id)).toEqual([2, 1]) // 30 antes que 10, sin el 3
  })

  it('enciende alerta con mucho tiempo + poco acierto medido', () => {
    const temas = { '1': tema({ vueltas: 2, porcentajeAciertos: 40 }) }
    const puntos = puntosTiempoAcierto(temas, { '1': 1800 }, metas) // 30 min, 40%
    expect(puntos[0].alerta).toBe(true)
  })

  it('no alerta si el acierto no está medido (sin vueltas)', () => {
    const temas = { '1': tema({ vueltas: 0, porcentajeAciertos: 0 }) }
    const puntos = puntosTiempoAcierto(temas, { '1': 1800 }, metas)
    expect(puntos[0].medido).toBe(false)
    expect(puntos[0].alerta).toBe(false)
  })

  it('no alerta si buen acierto pese a mucho tiempo', () => {
    const temas = { '1': tema({ vueltas: 2, porcentajeAciertos: 85 }) }
    const puntos = puntosTiempoAcierto(temas, { '1': 3600 }, metas)
    expect(puntos[0].alerta).toBe(false)
  })

  it('no alerta con poco tiempo aunque el acierto sea bajo', () => {
    const temas = { '1': tema({ vueltas: 2, porcentajeAciertos: 20 }) }
    const puntos = puntosTiempoAcierto(temas, { '1': 300 }, metas) // 5 min
    expect(puntos[0].alerta).toBe(false)
  })
})

describe('temasRelecturaPasiva', () => {
  it('filtra los que tienen alerta', () => {
    const temas = {
      '1': tema({ vueltas: 2, porcentajeAciertos: 30 }),
      '2': tema({ vueltas: 2, porcentajeAciertos: 90 }),
    }
    const puntos = puntosTiempoAcierto(temas, { '1': 1800, '2': 1800 }, [
      { id: 1, titulo: 'A' }, { id: 2, titulo: 'B' },
    ])
    const pasivos = temasRelecturaPasiva(puntos)
    expect(pasivos.map(p => p.id)).toEqual([1])
  })
})
