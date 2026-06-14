import { describe, it, expect } from 'vitest'
import {
  cobertura,
  evolucionNotas,
  calcularPrediccion,
  planSemana,
  diasDesdeUltimoSimulacro,
} from '../../src/services/prediccion'
import type { ExamenResultado, ProgresoTema } from '../../src/types'

const tema = (p: Partial<ProgresoTema>): ProgresoTema => ({
  vueltas: 0, ultimaRevision: null, porcentajeAciertos: 0, teoriaLeida: false, ...p,
})

const examen = (fecha: string, nota: number, modo: ExamenResultado['modo'] = 'completo'): ExamenResultado => ({
  id: `${fecha}T00:00:00.000Z`, fecha, modo, nota,
  aciertos: 0, errores: 0, enBlanco: 0, aprobado: nota >= 5,
  tiempoSegundos: 0, preguntasIds: [], respuestasUsuario: {}, resultadosPorTema: {},
})

describe('cobertura', () => {
  it('sin temas ⇒ 0', () => {
    expect(cobertura({}, [])).toBe(0)
  })
  it('cuenta solo los temas con ≥1 vuelta', () => {
    const temas = { '1': tema({ vueltas: 2 }), '2': tema({ vueltas: 0 }), '3': tema({ vueltas: 1 }) }
    expect(cobertura(temas, [1, 2, 3, 4])).toBe(50) // 2 de 4
  })
})

describe('evolucionNotas', () => {
  it('invierte a orden cronológico (antiguo→reciente) y recorta', () => {
    // historial llega con el más reciente primero
    const hist = [examen('2026-06-10', 8), examen('2026-06-05', 6), examen('2026-06-01', 4)]
    const evo = evolucionNotas(hist)
    expect(evo.map(e => e.fecha)).toEqual(['2026-06-01', '2026-06-05', '2026-06-10'])
    expect(evo.map(e => e.nota)).toEqual([4, 6, 8])
  })
  it('respeta el máximo', () => {
    const hist = Array.from({ length: 20 }, (_, i) => examen(`2026-06-${String(i + 1).padStart(2, '0')}`, 5))
    expect(evolucionNotas(hist, 5)).toHaveLength(5)
  })
})

describe('calcularPrediccion', () => {
  it('sin simulacros ⇒ no fiable, nota 0', () => {
    const p = calcularPrediccion([], 50, 70)
    expect(p.fiable).toBe(false)
    expect(p.nSimulacros).toBe(0)
    expect(p.nota).toBe(0)
  })

  it('descuenta por cobertura y retención', () => {
    // base 8, cobertura 100%, retención 100% ⇒ 8 × 1 × (0.6+0.4) = 8
    const full = calcularPrediccion([examen('2026-06-10', 8)], 100, 100)
    expect(full.base).toBe(8)
    expect(full.nota).toBe(8)
    // misma base con cobertura 50% ⇒ la mitad
    const media = calcularPrediccion([examen('2026-06-10', 8)], 50, 100)
    expect(media.nota).toBe(4)
    // retención baja modula entre 0.6 y 1: 8 × 1 × 0.6 = 4.8
    const olvido = calcularPrediccion([examen('2026-06-10', 8)], 100, 0)
    expect(olvido.nota).toBe(4.8)
  })

  it('promedia los 3 simulacros más recientes', () => {
    const hist = [examen('2026-06-10', 9), examen('2026-06-08', 6), examen('2026-06-05', 6), examen('2026-06-01', 0)]
    const p = calcularPrediccion(hist, 100, 100)
    expect(p.base).toBe(7) // (9+6+6)/3, ignora el cuarto
    expect(p.nSimulacros).toBe(3)
  })

  it('banda más estrecha con más datos', () => {
    const uno = calcularPrediccion([examen('2026-06-10', 7)], 100, 100)
    const tres = calcularPrediccion(
      [examen('2026-06-10', 7), examen('2026-06-08', 7), examen('2026-06-05', 7)], 100, 100,
    )
    expect(tres.banda).toBeLessThan(uno.banda)
  })

  it('asigna semáforo por umbrales', () => {
    expect(calcularPrediccion([examen('2026-06-10', 9)], 100, 100).semaforo).toBe('verde')
    expect(calcularPrediccion([examen('2026-06-10', 5)], 100, 100).semaforo).toBe('ambar')
    expect(calcularPrediccion([examen('2026-06-10', 4)], 100, 100).semaforo).toBe('rojo')
  })
})

describe('diasDesdeUltimoSimulacro', () => {
  it('null si no hay historial', () => {
    expect(diasDesdeUltimoSimulacro([], '2026-06-13')).toBeNull()
  })
  it('mide desde el más reciente', () => {
    const hist = [examen('2026-06-06', 5), examen('2026-06-01', 5)]
    expect(diasDesdeUltimoSimulacro(hist, '2026-06-13')).toBe(7)
  })
})

describe('planSemana', () => {
  it('prioriza peor tema, flashcards y simulacro (máx 3)', () => {
    const acciones = planSemana({
      peorTema: { id: 5, titulo: 'Derecho Penal' },
      flashcardsPendientes: 12,
      diasDesdeUltimoSimulacro: 10,
      coberturaPct: 60,
    })
    expect(acciones).toHaveLength(3)
    expect(acciones[0].ruta).toBe('temario')
    expect(acciones[1].texto).toContain('12 flashcards')
    expect(acciones[2].ruta).toBe('examen')
  })

  it('sin peor tema y temario incompleto ⇒ sugiere tema nuevo', () => {
    const acciones = planSemana({
      peorTema: null, flashcardsPendientes: 0, diasDesdeUltimoSimulacro: null, coberturaPct: 30,
    })
    expect(acciones[0].texto).toContain('tema nuevo')
    expect(acciones.some(a => a.texto.includes('primer simulacro'))).toBe(true)
  })

  it('no sugiere simulacro si fue reciente', () => {
    const acciones = planSemana({
      peorTema: null, flashcardsPendientes: 0, diasDesdeUltimoSimulacro: 2, coberturaPct: 100,
    })
    expect(acciones.some(a => a.ruta === 'examen')).toBe(false)
  })

  it('singular en flashcard pendiente única', () => {
    const acciones = planSemana({
      peorTema: null, flashcardsPendientes: 1, diasDesdeUltimoSimulacro: 0, coberturaPct: 100,
    })
    expect(acciones[0].texto).toContain('1 flashcard pendiente')
  })
})
