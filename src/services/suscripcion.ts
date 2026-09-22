const DIAS_TRIAL = 7
const MS_DIA = 24 * 60 * 60 * 1000

/**
 * Días enteros restantes de trial (redondeo hacia arriba). Solo para el banner
 * (BannerTrial); el trial ya no participa en el gating, que es por suscripción.
 * @returns número de días (>=0) o null si no hay trial_start.
 */
export function diasRestantes(trialStart: string | null, ahora: Date = new Date()): number | null {
  if (!trialStart) return null
  const fin = new Date(trialStart).getTime() + DIAS_TRIAL * MS_DIA
  const restanteMs = fin - ahora.getTime()
  if (restanteMs <= 0) return 0
  return Math.ceil(restanteMs / MS_DIA)
}
