import { describe, it, expect } from 'vitest'
import { mergeProgreso } from '../../src/services/sync'
import type { Progreso } from '../../src/types'

const base: Progreso = {
  temas: {},
  flashcards: {},
  racha: { dias: 0, ultimoEstudio: null },
  tiempoTotalSegundos: 0,
  notificaciones: { hora: '19:00', activas: false },
  historialExamenes: [],
  sesionDiaria: null,
  rendimientoPorTema: {},
}

describe('mergeProgreso', () => {
  it('temas: gana el que tiene más vueltas', () => {
    const local:  Progreso = { ...base, temas: { '1': { vueltas: 3, ultimaRevision: null, porcentajeAciertos: 0, teoriaLeida: false } } }
    const remoto: Progreso = { ...base, temas: { '1': { vueltas: 5, ultimaRevision: null, porcentajeAciertos: 0, teoriaLeida: false } } }
    expect(mergeProgreso(local, remoto).temas['1'].vueltas).toBe(5)
  })

  it('flashcards: gana el nivel más alto', () => {
    const local:  Progreso = { ...base, flashcards: { 'f1': { nivel: 2, intervalo: 4, proximoRepaso: '2026-05-10' } } }
    const remoto: Progreso = { ...base, flashcards: { 'f1': { nivel: 4, intervalo: 8, proximoRepaso: '2026-05-20' } } }
    expect(mergeProgreso(local, remoto).flashcards['f1'].nivel).toBe(4)
  })

  it('racha: gana el valor más alto', () => {
    const local:  Progreso = { ...base, racha: { dias: 5,  ultimoEstudio: '2026-05-02' } }
    const remoto: Progreso = { ...base, racha: { dias: 10, ultimoEstudio: '2026-05-02' } }
    expect(mergeProgreso(local, remoto).racha.dias).toBe(10)
  })

  it('historialExamenes: une sin duplicados', () => {
    const exam1 = { id: '2026-05-01T10:00:00.000Z', fecha: '2026-05-01', modo: 'completo' as const, aciertos: 30, errores: 10, enBlanco: 10, nota: 5.6, aprobado: true, tiempoSegundos: 3200, preguntasIds: [], respuestasUsuario: {}, resultadosPorTema: {} }
    const exam2 = { id: '2026-05-02T10:00:00.000Z', fecha: '2026-05-02', modo: 'mini' as const, aciertos: 15, errores: 5, enBlanco: 5, nota: 6.0, aprobado: true, tiempoSegundos: 1500, preguntasIds: [], respuestasUsuario: {}, resultadosPorTema: {} }
    const local:  Progreso = { ...base, historialExamenes: [exam1] }
    const remoto: Progreso = { ...base, historialExamenes: [exam1, exam2] }
    expect(mergeProgreso(local, remoto).historialExamenes.length).toBe(2)
  })

  it('rendimientoPorTema: suma aciertos y errores', () => {
    const local:  Progreso = { ...base, rendimientoPorTema: { '5': { aciertos: 3, errores: 2, total: 5 } } }
    const remoto: Progreso = { ...base, rendimientoPorTema: { '5': { aciertos: 4, errores: 1, total: 5 } } }
    expect(mergeProgreso(local, remoto).rendimientoPorTema['5']).toEqual({ aciertos: 7, errores: 3, total: 10 })
  })
})
