// src/services/seleccionTest.ts
// Selección de un subconjunto de preguntas para un test, con dificultad y variación.
// El banco de cada tema es mayor que el test (p. ej. 50 preguntas), y cada test
// saca `cantidad` al azar → no salen siempre las mismas.
import type { Pregunta } from '../types'

export type ModoDificultad = 'normal' | 'dificil'

/** Nº de preguntas que se muestran en un test de tema. */
export const PREGUNTAS_POR_TEST = 30

/** En modo difícil: proporción de preguntas trampa (resto: normales duras). */
const PROPORCION_TRAMPA = 0.6

function barajar<T>(a: T[]): T[] {
  const r = [...a]
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[r[i], r[j]] = [r[j], r[i]]
  }
  return r
}

const esTrampa = (p: Pregunta): boolean => p.dificultad === 'dificil'

/**
 * Devuelve hasta `cantidad` preguntas del `pool`, variando en cada llamada.
 * - 'normal': solo preguntas normales (rellena con trampa si no hay suficientes).
 * - 'dificil': ~60% trampa + 40% normales; si falta en una categoría, rellena con la otra.
 * Nunca devuelve más de `cantidad` ni más de las disponibles en el pool.
 */
export function seleccionarPreguntasTest(
  pool: Pregunta[],
  modo: ModoDificultad,
  cantidad: number = PREGUNTAS_POR_TEST,
): Pregunta[] {
  const trampa = barajar(pool.filter(esTrampa))
  const normales = barajar(pool.filter(p => !esTrampa(p)))

  let sel: Pregunta[]
  if (modo === 'normal') {
    sel = normales.slice(0, cantidad)
  } else {
    const nTrampa = Math.round(cantidad * PROPORCION_TRAMPA)
    sel = [...trampa.slice(0, nTrampa), ...normales.slice(0, cantidad - nTrampa)]
  }

  // Relleno si una categoría se quedó corta (banco pequeño o sesgado).
  if (sel.length < cantidad) {
    const usados = new Set(sel.map(p => p.id))
    const resto = [...trampa, ...normales].filter(p => !usados.has(p.id))
    sel = [...sel, ...resto.slice(0, cantidad - sel.length)]
  }

  return barajar(sel)
}
