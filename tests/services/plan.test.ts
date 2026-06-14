import { describe, it, expect } from 'vitest'
import { calcularPlan } from '../../src/services/plan'
import type { ProgresoTema } from '../../src/types'

const tema = (p: Partial<ProgresoTema>): ProgresoTema => ({
  vueltas: 0, ultimaRevision: null, porcentajeAciertos: 0, teoriaLeida: false, ...p,
})

// n temas estudiados; el primero fija la fecha de inicio (primera revisión).
function temasEstudiados(n: number, primera = '2026-06-01'): Record<string, ProgresoTema> {
  const out: Record<string, ProgresoTema> = {}
  for (let i = 1; i <= n; i++) {
    out[String(i)] = tema({ vueltas: 1, ultimaRevision: i === 1 ? primera : '2026-06-15' })
  }
  return out
}

describe('calcularPlan', () => {
  it('sin temas estudiados ⇒ estado sin-datos', () => {
    const plan = calcularPlan({ '1': tema({ teoriaLeida: true }) }, 45, '2026-09-01', '2026-06-15')
    expect(plan.estado).toBe('sin-datos')
    expect(plan.estudiados).toBe(0)
  })

  it('calcula ritmo semanal y temas restantes', () => {
    // 10 estudiados en 2 semanas ⇒ 5 temas/semana; restan 35 de 45
    const plan = calcularPlan(temasEstudiados(10), 45, '2026-12-01', '2026-06-15')
    expect(plan.estudiados).toBe(10)
    expect(plan.restantes).toBe(35)
    expect(plan.ritmoSemanal).toBe(5)
  })

  it('sin fecha de examen ⇒ sin-fecha, margen y ritmoNecesario null', () => {
    const plan = calcularPlan(temasEstudiados(10), 45, null, '2026-06-15')
    expect(plan.estado).toBe('sin-fecha')
    expect(plan.margenDias).toBeNull()
    expect(plan.ritmoNecesario).toBeNull()
    expect(plan.fechaFinProyectada > '2026-06-15').toBe(true)
  })

  it('a buen ritmo y examen lejano ⇒ adelantado (margen positivo)', () => {
    const plan = calcularPlan(temasEstudiados(10), 45, '2026-12-01', '2026-06-15')
    expect(plan.estado).toBe('adelantado')
    expect(plan.margenDias).toBeGreaterThan(7)
  })

  it('ritmo lento y examen pronto ⇒ atrasado (margen negativo)', () => {
    // 2 estudiados en 2 semanas ⇒ 1 tema/semana; restan 43; examen en ~3 semanas
    const temas = { '1': tema({ vueltas: 1, ultimaRevision: '2026-06-01' }), '2': tema({ vueltas: 1, ultimaRevision: '2026-06-15' }) }
    const plan = calcularPlan(temas, 45, '2026-07-06', '2026-06-15')
    expect(plan.estado).toBe('atrasado')
    expect(plan.margenDias!).toBeLessThan(0)
    expect(plan.ritmoNecesario).toBeGreaterThan(plan.ritmoSemanal)
  })

  it('examen ya pasado ⇒ sin-fecha', () => {
    const plan = calcularPlan(temasEstudiados(10), 45, '2026-06-01', '2026-06-15')
    expect(plan.estado).toBe('sin-fecha')
  })
})
