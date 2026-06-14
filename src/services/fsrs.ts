// ── P3.1 FSRS-4.5 ───────────────────────────────────────────
// Motor de repetición espaciada FSRS-4.5 (Free Spaced Repetition Scheduler),
// el estándar moderno (Anki). Sustituye al SM-2 simplificado: cada tarjeta
// guarda un estado {stability, difficulty} y el algoritmo calcula el intervalo
// óptimo para una retención objetivo (por defecto 90 %).
//
// Servicio PURO (sin storage ni fechas implícitas): todo entra por parámetros.
// La integración con localStorage vive en `spaced-repetition.ts`.

/** Grados FSRS: 1=Again 2=Hard 3=Good 4=Easy. */
export type Grado = 1 | 2 | 3 | 4

export interface EstadoFSRS {
  stability: number   // S: días hasta que la retención cae a 0,9
  difficulty: number  // D: dificultad intrínseca 1..10
}

/** Parámetros por defecto FSRS-4.5 (17 pesos). */
export const W_DEFAULT: readonly number[] = [
  0.4197, 1.1869, 3.0412, 15.2441, 7.1434, 0.6477, 1.0007, 0.0674,
  1.6597, 0.1712, 1.1178, 2.0225, 0.0904, 0.3025, 2.1214, 0.2498, 2.9466,
]

const DECAY = -0.5
const FACTOR = 19 / 81 // = 0.9^(1/DECAY) − 1
export const RETENCION_OBJETIVO = 0.9

const clampD = (d: number) => Math.min(10, Math.max(1, d))

/** Retrievability: probabilidad de recordar tras `dias` con estabilidad `s`. */
export function retrievability(dias: number, s: number): number {
  return Math.pow(1 + (FACTOR * Math.max(0, dias)) / s, DECAY)
}

/** Intervalo en días para una retención objetivo dada una estabilidad. */
export function intervaloDias(
  s: number,
  retencion: number = RETENCION_OBJETIVO,
): number {
  const i = (s / FACTOR) * (Math.pow(retencion, 1 / DECAY) - 1)
  return Math.max(1, Math.round(i))
}

// ── Estado inicial (primer repaso) ──────────────────────────
function estabilidadInicial(g: Grado, w = W_DEFAULT): number {
  return Math.max(0.1, w[g - 1])
}

function dificultadInicial(g: Grado, w = W_DEFAULT): number {
  return clampD(w[4] - Math.exp(w[5] * (g - 1)) + 1)
}

export function estadoInicial(g: Grado, w = W_DEFAULT): EstadoFSRS {
  return { stability: estabilidadInicial(g, w), difficulty: dificultadInicial(g, w) }
}

// ── Actualización (repasos siguientes) ──────────────────────
function siguienteDificultad(d: number, g: Grado, w = W_DEFAULT): number {
  const d0Easy = w[4] - Math.exp(w[5] * 3) + 1 // D0(Easy) para reversión a la media
  const dPrime = d - w[6] * (g - 3)
  return clampD(w[7] * d0Easy + (1 - w[7]) * dPrime)
}

function estabilidadAcierto(
  d: number, s: number, r: number, g: Grado, w = W_DEFAULT,
): number {
  const penalDuro = g === 2 ? w[15] : 1
  const bonusFacil = g === 4 ? w[16] : 1
  return s * (
    1 + Math.exp(w[8]) * (11 - d) * Math.pow(s, -w[9])
      * (Math.exp(w[10] * (1 - r)) - 1) * penalDuro * bonusFacil
  )
}

function estabilidadOlvido(
  d: number, s: number, r: number, w = W_DEFAULT,
): number {
  return w[11] * Math.pow(d, -w[12]) * (Math.pow(s + 1, w[13]) - 1) * Math.exp(w[14] * (1 - r))
}

/**
 * Aplica un repaso a un estado FSRS. `dias` = días transcurridos desde el
 * último repaso (0 si se repasa el mismo día). Devuelve el nuevo estado.
 */
export function repasar(
  estado: EstadoFSRS,
  g: Grado,
  dias: number,
  w = W_DEFAULT,
): EstadoFSRS {
  const r = retrievability(dias, estado.stability)
  const difficulty = siguienteDificultad(estado.difficulty, g, w)
  const stability = g === 1
    ? estabilidadOlvido(estado.difficulty, estado.stability, r, w)
    : estabilidadAcierto(estado.difficulty, estado.stability, r, g, w)
  return { stability: Math.max(0.1, stability), difficulty }
}
