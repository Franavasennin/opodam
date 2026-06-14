import type { ProgresoTema } from '../types'

// ── P2.4 Tiempo por tema + detección de relectura pasiva ─────
// Acumula segundos de estudio por tema y cruza tiempo × acierto para detectar
// el error nº1 del opositor: releer mucho sin medir (relectura pasiva). Todo
// derivado del Progreso; sin BD nueva ni IA.

// "Mucho tiempo" y "poco acierto" para disparar la alerta de método.
export const UMBRAL_MINUTOS = 25
export const UMBRAL_ACIERTO = 50

/** Suma `segundos` (≥0) al acumulado del tema y devuelve un mapa NUEVO (no muta). */
export function acumularTiempo(
  tiempoPorTema: Record<string, number>,
  temaId: number,
  segundos: number,
): Record<string, number> {
  if (segundos <= 0) return tiempoPorTema
  const key = String(temaId)
  return { ...tiempoPorTema, [key]: (tiempoPorTema[key] ?? 0) + Math.round(segundos) }
}

/** Minutos enteros acumulados en un tema. */
export function minutosTema(tiempoPorTema: Record<string, number>, temaId: number): number {
  return Math.round((tiempoPorTema[String(temaId)] ?? 0) / 60)
}

export interface PuntoTiempo {
  id: number
  titulo: string
  minutos: number
  aciertos: number   // 0–100 (porcentajeAciertos del tema; 0 si sin test)
  medido: boolean    // el tema tiene al menos una vuelta/test ⇒ el acierto es real
  alerta: boolean    // mucho tiempo + poco acierto medido ⇒ cambiar de método
}

/**
 * Puntos para el scatter "tiempo vs acierto": un punto por tema con tiempo
 * registrado. `alerta` solo se enciende si el acierto está medido (vueltas>0),
 * para no acusar de relectura pasiva a quien aún no ha hecho ningún test.
 */
export function puntosTiempoAcierto(
  temas: Record<string, ProgresoTema>,
  tiempoPorTema: Record<string, number>,
  metas: ReadonlyArray<{ id: number; titulo: string }>,
): PuntoTiempo[] {
  return metas
    .map(m => {
      const minutos = minutosTema(tiempoPorTema, m.id)
      const t = temas[String(m.id)]
      const medido = (t?.vueltas ?? 0) > 0
      const aciertos = t?.porcentajeAciertos ?? 0
      return {
        id: m.id,
        titulo: m.titulo,
        minutos,
        aciertos,
        medido,
        alerta: medido && minutos >= UMBRAL_MINUTOS && aciertos < UMBRAL_ACIERTO,
      }
    })
    .filter(p => p.minutos > 0)
    .sort((a, b) => b.minutos - a.minutos)
}

/** Temas con alerta de relectura pasiva (mucho tiempo, poco acierto). */
export function temasRelecturaPasiva(puntos: PuntoTiempo[]): PuntoTiempo[] {
  return puntos.filter(p => p.alerta)
}
