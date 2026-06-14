import type { EstadoFlashcard } from '../types'
import { getProgreso, saveProgreso } from './storage'
import { type EstadoFSRS, type Grado, estadoInicial, repasar, intervaloDias } from './fsrs'
import { diasEntre } from './dominio'

type Calificacion = 'facil' | 'dudoso' | 'dificil'

// La UI tiene 3 botones; los mapeamos a los grados FSRS (Easy no se usa).
const GRADO: Record<Calificacion, Grado> = { dificil: 1, dudoso: 2, facil: 3 }

/** ¿El estado ya tiene parámetros FSRS? */
function tieneFSRS(e: EstadoFlashcard): boolean {
  return typeof e.stability === 'number' && typeof e.difficulty === 'number'
}

/**
 * Estima un estado FSRS inicial a partir del legado SM-2 {nivel, intervalo}:
 * la estabilidad arranca del intervalo previo y la dificultad baja a mayor nivel.
 */
function migrarAFSRS(e: EstadoFlashcard): EstadoFSRS {
  return {
    stability: Math.max(0.1, e.intervalo || 1),
    difficulty: Math.min(10, Math.max(1, 7 - (e.nivel ?? 0))),
  }
}

// P3.1 — nivel legado derivado de la estabilidad, solo para UI/orden por fragilidad.
function nivelDesdeEstabilidad(s: number): number {
  if (s < 2) return 0
  if (s < 7) return 1
  if (s < 21) return 2
  if (s < 60) return 3
  if (s < 180) return 4
  return 5
}

export function calcularProximoRepaso(
  estado: EstadoFlashcard,
  calificacion: Calificacion,
  hoy: string = new Date().toISOString().slice(0, 10),
): EstadoFlashcard {
  const g = GRADO[calificacion]
  let fsrs: EstadoFSRS
  if (tieneFSRS(estado)) {
    const dias = estado.ultimaRevision ? diasEntre(estado.ultimaRevision, hoy) : 0
    fsrs = repasar({ stability: estado.stability!, difficulty: estado.difficulty! }, g, dias)
  } else if (estado.ultimaRevision || (estado.intervalo ?? 0) > 1 || (estado.nivel ?? 0) > 0) {
    // estado legado con historia ⇒ migrar y aplicar el repaso
    const dias = estado.ultimaRevision ? diasEntre(estado.ultimaRevision, hoy) : 0
    fsrs = repasar(migrarAFSRS(estado), g, dias)
  } else {
    // primera vez ⇒ estado FSRS inicial
    fsrs = estadoInicial(g)
  }
  const intervalo = intervaloDias(fsrs.stability)
  const fecha = new Date(`${hoy}T00:00:00Z`)
  fecha.setUTCDate(fecha.getUTCDate() + intervalo)
  return {
    nivel: nivelDesdeEstabilidad(fsrs.stability),
    intervalo,
    proximoRepaso: fecha.toISOString().slice(0, 10),
    stability: fsrs.stability,
    difficulty: fsrs.difficulty,
    ultimaRevision: hoy,
  }
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
