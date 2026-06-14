// Cuaderno de errores: registra preguntas falladas del temario y las "gradúa"
// (las saca del cuaderno) cuando se aciertan GRADUACION veces seguidas.
import type { Confianza, Progreso } from '../types'
import { getProgreso, saveProgreso } from './storage'

export const GRADUACION = 2 // aciertos seguidos para salir del cuaderno

function hoy(): string { return new Date().toISOString().slice(0, 10) }

function aplicar(p: Progreso, preguntaId: string, temaId: number, acierto: boolean, confianza?: Confianza): void {
  const cuaderno = p.erroresPorPregunta ?? (p.erroresPorPregunta = {})
  const actual = cuaderno[preguntaId]
  if (!acierto) {
    cuaderno[preguntaId] = {
      temaId,
      fallos: (actual?.fallos ?? 0) + 1,
      aciertosSeguidos: 0,
      ultimoFallo: hoy(),
      confianza,                    // P1.5: 'seguro' marca un falso seguro
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
export function registrarRespuesta(preguntaId: string, temaId: number, acierto: boolean, confianza?: Confianza): void {
  const p = getProgreso()
  aplicar(p, preguntaId, temaId, acierto, confianza)
  saveProgreso(p)
}

/** Registra un test/examen entero en una sola escritura. Las en blanco se omiten. */
export function registrarLote(items: Array<{ id: string; temaId: number; acierto: boolean; confianza?: Confianza }>): void {
  if (!items.length) return
  const p = getProgreso()
  for (const it of items) aplicar(p, it.id, it.temaId, it.acierto, it.confianza)
  saveProgreso(p)
}

/**
 * Preguntas pendientes en el cuaderno, las más frágiles primero.
 * P1.5: un "falso seguro" (confianza='seguro' al fallar) va antes que todo —
 * es la laguna más peligrosa. Luego, por nº de fallos y antigüedad.
 */
export function preguntasEnCuaderno(p: Progreso = getProgreso()): Array<{ id: string; temaId: number }> {
  const cuaderno = p.erroresPorPregunta ?? {}
  const esFalsoSeguro = (e: { confianza?: Confianza }) => (e.confianza === 'seguro' ? 1 : 0)
  return Object.entries(cuaderno)
    .sort(([, a], [, b]) =>
      (esFalsoSeguro(b) - esFalsoSeguro(a)) ||
      (b.fallos - a.fallos) ||
      (a.ultimoFallo < b.ultimoFallo ? -1 : 1))
    .map(([id, e]) => ({ id, temaId: e.temaId }))
}

/** Nº de preguntas pendientes en el cuaderno. */
export function contarErrores(p: Progreso = getProgreso()): number {
  return Object.keys(p.erroresPorPregunta ?? {}).length
}
