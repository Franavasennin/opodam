import type { ProgresoTema } from '../types'

// ── P1.3 Dominio y riesgo de olvido por tema ────────────────
// Modela la curva de olvido de forma simplificada y derivable del progreso
// existente (sin BD nueva): el dominio decae con los días desde la última
// revisión, y cada vuelta alarga la vida media del recuerdo.

export type EstadoDominio = 'dominado' | 'riesgo' | 'olvidado' | 'nuevo'

const HOY = () => new Date().toISOString().slice(0, 10)

/** Días enteros entre dos fechas YYYY-MM-DD (nunca negativo). */
export function diasEntre(desde: string, hoy: string = HOY()): number {
  const ms = Date.parse(`${hoy}T00:00:00Z`) - Date.parse(`${desde}T00:00:00Z`)
  return Math.max(0, Math.floor(ms / 86_400_000))
}

/**
 * Factor de retención [0..1]: exp(-días / vidaMedia), con
 * vidaMedia = 7 + 7×vueltas. Sin fecha de revisión ⇒ sin retención (0).
 */
export function factorRetencion(
  ultimaRevision: string | null,
  vueltas: number,
  hoy: string = HOY(),
): number {
  if (!ultimaRevision) return 0
  const dias = diasEntre(ultimaRevision, hoy)
  const vidaMedia = 7 + 7 * Math.max(0, vueltas)
  return Math.exp(-dias / vidaMedia)
}

/** Dominio 0–100 = porcentajeAciertos × factorRetencion. */
export function dominioTema(p: ProgresoTema | undefined, hoy: string = HOY()): number {
  if (!p) return 0
  return Math.round((p.porcentajeAciertos ?? 0) * factorRetencion(p.ultimaRevision, p.vueltas ?? 0, hoy))
}

/** ¿El tema tiene actividad real (algún test o vuelta)? */
function iniciado(p: ProgresoTema | undefined): boolean {
  return !!p && ((p.vueltas ?? 0) > 0 || (p.porcentajeAciertos ?? 0) > 0)
}

/** Estado semáforo: 🟢 dominado ≥75 · 🟡 riesgo 40–75 · 🔴 olvidado <40 · nuevo (sin tocar). */
export function estadoDominio(p: ProgresoTema | undefined, hoy: string = HOY()): EstadoDominio {
  if (!iniciado(p)) return 'nuevo'
  const d = dominioTema(p, hoy)
  if (d >= 75) return 'dominado'
  if (d >= 40) return 'riesgo'
  return 'olvidado'
}

export interface TemaEnRiesgo {
  id: number
  dominio: number
  dias: number          // días desde la última revisión
  estado: EstadoDominio
}

/**
 * Temas ya estudiados cuyo recuerdo ha decaído (riesgo u olvidado),
 * ordenados de menor a mayor dominio (lo más frágil primero).
 */
export function temasEnRiesgo(
  temas: Record<string, ProgresoTema>,
  idsTemas: number[],
  hoy: string = HOY(),
  limite = 5,
): TemaEnRiesgo[] {
  return idsTemas
    .map(id => {
      const p = temas[String(id)]
      return {
        id,
        dominio: dominioTema(p, hoy),
        dias: p?.ultimaRevision ? diasEntre(p.ultimaRevision, hoy) : 0,
        estado: estadoDominio(p, hoy),
      }
    })
    .filter(t => t.estado === 'riesgo' || t.estado === 'olvidado')
    .sort((a, b) => a.dominio - b.dominio)
    .slice(0, limite)
}

/** Retención media global (0–100) sobre los temas iniciados. 0 si no hay ninguno. */
export function retencionMediaGlobal(
  temas: Record<string, ProgresoTema>,
  hoy: string = HOY(),
): number {
  const iniciados = Object.values(temas).filter(iniciado)
  if (iniciados.length === 0) return 0
  const suma = iniciados.reduce((acc, p) => acc + factorRetencion(p.ultimaRevision, p.vueltas ?? 0, hoy), 0)
  return Math.round((suma / iniciados.length) * 100)
}
