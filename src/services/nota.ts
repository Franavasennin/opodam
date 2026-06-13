// Penalización por error y textos de estrategia, por oposición.
// La fórmula de nota vive en examen.ts (calcularNotaExamen); aquí solo se
// resuelve la penalización del cuerpo activo y se generan los textos de la UI.
import { OPOSICIONES } from '../data/oposiciones'

export const PENALIZACION_DEFECTO = 1 / 3

/** Penalización por error (fracción de un acierto) de la oposición indicada. */
export function getPenalizacion(slug: string): number {
  const o = OPOSICIONES.find(x => x.slug === slug)
  return o?.penalizacionPorError ?? PENALIZACION_DEFECTO
}

/** Texto corto que explica cómo penalizan los errores. */
export function describirPenalizacion(pen: number): string {
  if (pen <= 0) return 'Los errores no penalizan.'
  // nº de errores que anulan un acierto = 1/pen (redondeado para lectura)
  const nPorAcierto = Math.round(1 / pen)
  if (Math.abs(1 / pen - nPorAcierto) < 0.01 && nPorAcierto > 1) {
    return `Cada error resta. ${nPorAcierto} errores anulan un acierto.`
  }
  return `Cada error resta ${pen.toFixed(2)} puntos de un acierto.`
}

/** Consejo de estrategia de respuesta según la penalización. */
export function consejoEstrategia(pen: number): string {
  if (pen <= 0) {
    return 'Sin penalización: responde SIEMPRE, aunque dudes. Dejar en blanco solo te perjudica.'
  }
  if (pen >= 0.5) {
    return 'Penalización alta: responde solo cuando puedas descartar al menos la mitad de las opciones. Si dudas del todo, deja en blanco.'
  }
  return 'Penalización moderada: si puedes descartar 1-2 opciones, suele compensar arriesgar; si no tienes ni idea, mejor en blanco.'
}
