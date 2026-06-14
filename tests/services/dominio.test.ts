import { describe, it, expect } from 'vitest'
import {
  diasEntre, factorRetencion, dominioTema, estadoDominio,
  temasEnRiesgo, retencionMediaGlobal,
} from '../../src/services/dominio'
import type { ProgresoTema } from '../../src/types'

const tema = (p: Partial<ProgresoTema>): ProgresoTema => ({
  vueltas: 0, ultimaRevision: null, porcentajeAciertos: 0, teoriaLeida: false, ...p,
})

describe('diasEntre', () => {
  it('cuenta días enteros', () => {
    expect(diasEntre('2026-06-01', '2026-06-08')).toBe(7)
  })
  it('nunca es negativo (revisión futura ⇒ 0)', () => {
    expect(diasEntre('2026-06-20', '2026-06-08')).toBe(0)
  })
  it('mismo día ⇒ 0', () => {
    expect(diasEntre('2026-06-08', '2026-06-08')).toBe(0)
  })
})

describe('factorRetencion', () => {
  it('sin fecha de revisión ⇒ 0', () => {
    expect(factorRetencion(null, 3, '2026-06-08')).toBe(0)
  })
  it('revisado hoy ⇒ 1', () => {
    expect(factorRetencion('2026-06-08', 0, '2026-06-08')).toBe(1)
  })
  it('decae con los días (7 días, 0 vueltas ⇒ exp(-1))', () => {
    expect(factorRetencion('2026-06-01', 0, '2026-06-08')).toBeCloseTo(Math.exp(-1), 5)
  })
  it('cada vuelta alarga la vida media (más retención a igual antigüedad)', () => {
    const f0 = factorRetencion('2026-06-01', 0, '2026-06-08')
    const f3 = factorRetencion('2026-06-01', 3, '2026-06-08')
    expect(f3).toBeGreaterThan(f0)
  })
})

describe('dominioTema', () => {
  it('tema fresco ⇒ dominio = porcentaje', () => {
    expect(dominioTema(tema({ vueltas: 1, porcentajeAciertos: 80, ultimaRevision: '2026-06-08' }), '2026-06-08')).toBe(80)
  })
  it('decae con el tiempo', () => {
    const d = dominioTema(tema({ vueltas: 0, porcentajeAciertos: 80, ultimaRevision: '2026-06-01' }), '2026-06-08')
    expect(d).toBe(Math.round(80 * Math.exp(-1))) // 29
  })
  it('sin progreso ⇒ 0', () => {
    expect(dominioTema(undefined, '2026-06-08')).toBe(0)
  })
})

describe('estadoDominio', () => {
  it('nuevo cuando no hay actividad', () => {
    expect(estadoDominio(undefined, '2026-06-08')).toBe('nuevo')
    expect(estadoDominio(tema({ teoriaLeida: true }), '2026-06-08')).toBe('nuevo')
  })
  it('dominado ≥75', () => {
    expect(estadoDominio(tema({ vueltas: 3, porcentajeAciertos: 90, ultimaRevision: '2026-06-08' }), '2026-06-08')).toBe('dominado')
  })
  it('riesgo en la franja 40–75', () => {
    // 80% revisado hace 7 días con 3 vueltas: 80*exp(-7/28) ≈ 62
    expect(estadoDominio(tema({ vueltas: 3, porcentajeAciertos: 80, ultimaRevision: '2026-06-01' }), '2026-06-08')).toBe('riesgo')
  })
  it('olvidado <40', () => {
    // 80% sin vueltas hace 7 días ≈ 29
    expect(estadoDominio(tema({ vueltas: 0, porcentajeAciertos: 80, ultimaRevision: '2026-06-01' }), '2026-06-08')).toBe('olvidado')
  })
})

describe('temasEnRiesgo', () => {
  const temas: Record<string, ProgresoTema> = {
    '1': tema({ vueltas: 3, porcentajeAciertos: 95, ultimaRevision: '2026-06-08' }), // dominado
    '2': tema({ vueltas: 0, porcentajeAciertos: 80, ultimaRevision: '2026-06-01' }), // olvidado ~29
    '3': tema({ vueltas: 3, porcentajeAciertos: 80, ultimaRevision: '2026-06-01' }), // riesgo ~62
    '4': tema({ teoriaLeida: true }),                                               // nuevo
  }
  it('solo incluye riesgo/olvidado, lo más frágil primero', () => {
    const r = temasEnRiesgo(temas, [1, 2, 3, 4], '2026-06-08')
    expect(r.map(t => t.id)).toEqual([2, 3])
  })
  it('excluye dominados y nuevos', () => {
    const ids = temasEnRiesgo(temas, [1, 2, 3, 4], '2026-06-08').map(t => t.id)
    expect(ids).not.toContain(1)
    expect(ids).not.toContain(4)
  })
  it('respeta el límite', () => {
    expect(temasEnRiesgo(temas, [1, 2, 3, 4], '2026-06-08', 1).length).toBe(1)
  })
})

describe('retencionMediaGlobal', () => {
  it('promedia solo los temas iniciados', () => {
    const temas: Record<string, ProgresoTema> = {
      '1': tema({ vueltas: 1, porcentajeAciertos: 70, ultimaRevision: '2026-06-08' }), // factor 1
      '2': tema({ teoriaLeida: true }),                                               // nuevo, ignorado
    }
    expect(retencionMediaGlobal(temas, '2026-06-08')).toBe(100)
  })
  it('0 si no hay temas iniciados', () => {
    expect(retencionMediaGlobal({}, '2026-06-08')).toBe(0)
  })
})
