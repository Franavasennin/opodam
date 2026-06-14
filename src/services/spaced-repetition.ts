import type { EstadoFlashcard } from '../types'
import { getProgreso, saveProgreso } from './storage'

type Calificacion = 'facil' | 'dudoso' | 'dificil'

export function calcularProximoRepaso(
  estado: EstadoFlashcard,
  calificacion: Calificacion,
): EstadoFlashcard {
  let { nivel, intervalo } = estado
  if (calificacion === 'dificil') {
    intervalo = 1
    nivel = Math.max(0, nivel - 1)
  } else if (calificacion === 'dudoso') {
    intervalo = Math.max(1, Math.ceil(intervalo * 0.8))
  } else {
    const factor = nivel < 2 ? 1.5 : nivel < 4 ? 2.0 : 2.5
    intervalo = Math.round(intervalo * factor)
    nivel = Math.min(5, nivel + 1)
  }
  const fecha = new Date()
  fecha.setDate(fecha.getDate() + intervalo)
  return { nivel, intervalo, proximoRepaso: fecha.toISOString().slice(0, 10) }
}

export function flashcardsPendientesHoy(
  estados: Record<string, EstadoFlashcard>,
): string[] {
  const hoy = new Date().toISOString().slice(0, 10)
  return Object.entries(estados)
    .filter(([, e]) => e.proximoRepaso <= hoy)
    .map(([id]) => id)
}

/**
 * P1.4 — Ordena ids de flashcard por fragilidad: primero el nivel más bajo
 * (lo menos consolidado) y, a igual nivel, lo más vencido. Así el repaso
 * ataca antes lo que más riesgo tiene de olvidarse. Los ids sin estado van al final.
 */
export function ordenarPorFragilidad(
  ids: string[],
  estados: Record<string, EstadoFlashcard>,
): string[] {
  return [...ids].sort((a, b) => {
    const ea = estados[a], eb = estados[b]
    if (!ea && !eb) return 0
    if (!ea) return 1
    if (!eb) return -1
    return (ea.nivel - eb.nivel) || (ea.proximoRepaso < eb.proximoRepaso ? -1 : ea.proximoRepaso > eb.proximoRepaso ? 1 : 0)
  })
}

export function responderFlashcard(flashcardId: string, calificacion: Calificacion): void {
  const p = getProgreso()
  const actual = p.flashcards[flashcardId] ?? {
    proximoRepaso: new Date().toISOString().slice(0, 10),
    nivel: 0,
    intervalo: 1,
  }
  p.flashcards[flashcardId] = calcularProximoRepaso(actual, calificacion)
  saveProgreso(p)
}

export function inicializarFlashcards(ids: string[]): void {
  const p = getProgreso()
  const hoy = new Date().toISOString().slice(0, 10)
  for (const id of ids) {
    if (!p.flashcards[id]) {
      p.flashcards[id] = { proximoRepaso: hoy, nivel: 0, intervalo: 1 }
    }
  }
  saveProgreso(p)
}
