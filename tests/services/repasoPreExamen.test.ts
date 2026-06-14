import { describe, it, expect } from 'vitest'
import { diasHastaExamen, planPreExamen } from '../../src/services/repasoPreExamen'
import type { ProgresoTema } from '../../src/types'

const HOY = '2026-06-14'
const tema = (p: Partial<ProgresoTema>): ProgresoTema => ({
  vueltas: 0, ultimaRevision: null, porcentajeAciertos: 0, teoriaLeida: false, ...p,
})

describe('diasHastaExamen', () => {
  it('cuenta los días hasta una fecha futura', () => {
    expect(diasHastaExamen('2026-06-20', HOY)).toBe(6)
  })
  it('null si no hay fecha o ya pasó', () => {
    expect(diasHastaExamen(null, HOY)).toBeNull()
    expect(diasHastaExamen('2026-06-01', HOY)).toBeNull()
  })
})

describe('planPreExamen', () => {
  const temas: Record<string, ProgresoTema> = {
    '1': tema({ vueltas: 2, ultimaRevision: '2026-06-13', porcentajeAciertos: 80 }), // fresco ⇒ poco riesgo
    '2': tema({ vueltas: 1, ultimaRevision: '2026-05-01', porcentajeAciertos: 70 }), // viejo ⇒ alto riesgo
    '3': tema({ vueltas: 0, ultimaRevision: null }),                                  // no estudiado
  }
  const ids = [1, 2, 3]

  it('inactivo fuera de la ventana de 7 días', () => {
    const plan = planPreExamen(temas, ids, '2026-06-30', HOY)
    expect(plan.activo).toBe(false)
    expect(plan.conceptos).toEqual([])
  })

  it('inactivo sin fecha de examen', () => {
    expect(planPreExamen(temas, ids, null, HOY).activo).toBe(false)
  })

  it('activo dentro de la ventana y prioriza lo más frágil', () => {
    const plan = planPreExamen(temas, ids, '2026-06-18', HOY) // faltan 4 días
    expect(plan.activo).toBe(true)
    expect(plan.dias).toBe(4)
    expect(plan.vedaContenidoNuevo).toBe(false)
    expect(plan.simulacroHoy).toBe(true)
    // excluye el no estudiado (3) y pone el más olvidado (2) primero
    expect(plan.conceptos.map(c => c.id)).toEqual([2, 1])
  })

  it('veda contenido nuevo en las últimas 48 h', () => {
    const plan = planPreExamen(temas, ids, '2026-06-15', HOY) // falta 1 día
    expect(plan.vedaContenidoNuevo).toBe(true)
  })

  it('la importancia pondera la prioridad', () => {
    // tema 1 es más fresco pero con importancia alta puede adelantar al 2
    const plan = planPreExamen(temas, ids, '2026-06-18', HOY, { importancia: { 1: 100 } })
    expect(plan.conceptos[0].id).toBe(1)
  })

  it('respeta el límite de conceptos', () => {
    const plan = planPreExamen(temas, ids, '2026-06-18', HOY, { limite: 1 })
    expect(plan.conceptos).toHaveLength(1)
  })

  it('simulacroHoy es false si ya se hizo uno hoy', () => {
    const plan = planPreExamen(temas, ids, '2026-06-18', HOY, { simulacroHechoHoy: true })
    expect(plan.simulacroHoy).toBe(false)
  })
})
