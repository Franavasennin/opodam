import { describe, it, expect } from 'vitest'
import { resumenAlumno, construirPerfilAlumno } from '../../src/services/perfilAlumno'
import type { Progreso } from '../../src/types'

const base = (p: Partial<Progreso>): Progreso => ({
  temas: {},
  flashcards: {},
  racha: { dias: 0, ultimoEstudio: null },
  tiempoTotalSegundos: 0,
  notificaciones: { hora: '19:00', activas: false },
  historialExamenes: [],
  sesionDiaria: null,
  rendimientoPorTema: {},
  erroresPorPregunta: {},
  calibracion: { seguroAcierto: 0, seguroFallo: 0, dudoAcierto: 0, dudoFallo: 0 },
  tiempoPorTema: {},
  ...p,
})

const metas = [{ id: 1, titulo: 'Constitución' }, { id: 2, titulo: 'Penal' }]

describe('resumenAlumno', () => {
  it('ordena temas débiles por peor ratio y resuelve título', () => {
    const prog = base({
      rendimientoPorTema: {
        '1': { aciertos: 2, errores: 8, total: 10 }, // 20%
        '2': { aciertos: 7, errores: 3, total: 10 }, // 70%
      },
    })
    const r = resumenAlumno(prog, metas)
    expect(r.temasDebiles[0]).toEqual({ id: 1, titulo: 'Constitución', ratio: 20 })
    expect(r.temasDebiles[1].ratio).toBe(70)
  })

  it('cuenta el cuaderno de errores pendiente', () => {
    const prog = base({
      erroresPorPregunta: {
        'q1': { temaId: 1, fallos: 1, aciertosSeguidos: 0, ultimoFallo: '2026-06-10' },
        'q2': { temaId: 2, fallos: 2, aciertosSeguidos: 1, ultimoFallo: '2026-06-12' },
      },
    })
    expect(resumenAlumno(prog, metas).cuadernoPendiente).toBe(2)
  })
})

describe('construirPerfilAlumno', () => {
  it('devuelve null sin datos útiles', () => {
    expect(construirPerfilAlumno(base({}), metas)).toBeNull()
  })

  it('incluye temas flojos y cuaderno cuando hay datos', () => {
    const prog = base({
      rendimientoPorTema: { '1': { aciertos: 2, errores: 8, total: 10 } },
      erroresPorPregunta: { 'q1': { temaId: 1, fallos: 1, aciertosSeguidos: 0, ultimoFallo: '2026-06-10' } },
    })
    const txt = construirPerfilAlumno(prog, metas)!
    expect(txt).toContain('PERFIL DEL ALUMNO')
    expect(txt).toContain('T1 «Constitución» (20% aciertos)')
    expect(txt).toContain('1 pregunta pendiente')
  })

  it('incluye calibración solo con ≥5 muestras', () => {
    const sinMuestras = base({
      erroresPorPregunta: { 'q1': { temaId: 1, fallos: 1, aciertosSeguidos: 0, ultimoFallo: '2026-06-10' } },
      calibracion: { seguroAcierto: 1, seguroFallo: 1, dudoAcierto: 0, dudoFallo: 0 },
    })
    expect(construirPerfilAlumno(sinMuestras, metas)).not.toContain('falsos seguros')

    const conMuestras = base({
      calibracion: { seguroAcierto: 4, seguroFallo: 2, dudoAcierto: 2, dudoFallo: 1 },
    })
    expect(construirPerfilAlumno(conMuestras, metas)).toContain('falsos seguros')
  })
})
