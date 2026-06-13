// Cuaderno de errores: registra preguntas falladas del temario y las "gradúa"
// (las saca del cuaderno) cuando se aciertan GRADUACION veces seguidas.
import type { Progreso } from '../types'
import { getProgreso, saveProgreso } from './storage'

export const GRADUACION = 2 // aciertos seguidos para salir del cuaderno

function hoy(): string { return new Date().toISOString().slice(0, 10) }

function aplicar(p: Progreso, preguntaId: string, temaId: number, acierto: boolean): void {
  const cuaderno = p.erroresPorPregunta ?? (p.erroresPorPregunta = {})
  const actual = cuaderno[preguntaId]
  if (!acierto) {
    cuaderno[preguntaId] = {
      temaId,
      fallos: (actual?.fallos ?? 0) + 1,
      aciertosSeguidos: 0,
      ultimoFallo: hoy(),
    }
    return
  }
  // Acierto: solo afecta a preguntas que ya estaban en el cuaderno.
  if (!actual) return
  const aciertosSeguidos = actual.aciertosSeguidos + 1
  if (aciertosSeguidos >= GRADUACION) {
    delete cuaderno[preguntaId]           // graduada
  } else {
    cuaderno[preguntaId] = { ...actual, aciertosSeguidos }
  }
}

/** Registra el resultado de una única pregunta. */
export function registrarRespuesta(preguntaId: string, temaId: number, acierto: boolean): void {
  const p = getProgreso()
  aplicar(p, preguntaId, temaId, acierto)
  saveProgreso(p)
}

/** Registra un test/examen entero en una sola escritura. Las en blanco se omiten. */
export function registrarLote(items: Array<{ id: string; temaId: number; acierto: boolean }>): void {
  if (!items.length) return
  const p = getProgreso()
  for (const it of items) aplicar(p, it.id, it.temaId, it.acierto)
  saveProgreso(p)
}

/** Preguntas pendientes en el cuaderno, las más frágiles primero (más fallos, más antiguas). */
export function preguntasEnCuaderno(p: Progreso = getProgreso()): Array<{ id: string; temaId: number }> {
  const cuaderno = p.erroresPorPregunta ?? {}
  return Object.entries(cuaderno)
    .sort(([, a], [, b]) => (b.fallos - a.fallos) || (a.ultimoFallo < b.ultimoFallo ? -1 : 1))
    .map(([id, e]) => ({ id, temaId: e.temaId }))
}

/** Nº de preguntas pendientes en el cuaderno. */
export function contarErrores(p: Progreso = getProgreso()): number {
  return Object.keys(p.erroresPorPregunta ?? {}).length
}
