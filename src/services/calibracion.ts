// P1.5 — Calibración de confianza: detecta los "falsos seguros" (ilusión de
// saber), que son los errores más caros en un examen con penalización.
import type { Calibracion, Confianza } from '../types'
import { getProgreso, saveProgreso } from './storage'

export interface ItemCalibracion {
  acierto: boolean
  confianza?: Confianza
}

export function calibracionInicial(): Calibracion {
  return { seguroAcierto: 0, seguroFallo: 0, dudoAcierto: 0, dudoFallo: 0 }
}

/** Casilla de la matriz a la que cae una respuesta. */
export function claseCalibracion(acierto: boolean, confianza: Confianza): keyof Calibracion {
  if (confianza === 'seguro') return acierto ? 'seguroAcierto' : 'seguroFallo'
  return acierto ? 'dudoAcierto' : 'dudoFallo'
}

/** Suma un lote a la calibración existente (las respuestas sin confianza se ignoran). */
export function acumular(cal: Calibracion, items: ItemCalibracion[]): Calibracion {
  const next = { ...cal }
  for (const it of items) {
    if (!it.confianza) continue
    next[claseCalibracion(it.acierto, it.confianza)]++
  }
  return next
}

/** Total de respuestas con confianza declarada. */
export function totalConfianza(cal: Calibracion): number {
  return cal.seguroAcierto + cal.seguroFallo + cal.dudoAcierto + cal.dudoFallo
}

/** % de "falsos seguros" (seguro+fallo) sobre el total con confianza. 0 si no hay datos. */
export function tasaFalsosSeguros(cal: Calibracion): number {
  const total = totalConfianza(cal)
  return total === 0 ? 0 : Math.round((cal.seguroFallo / total) * 100)
}

/** Persiste un lote en el progreso. */
export function registrarCalibracion(items: ItemCalibracion[]): void {
  if (!items.some(it => it.confianza)) return
  const p = getProgreso()
  p.calibracion = acumular(p.calibracion ?? calibracionInicial(), items)
  saveProgreso(p)
}
