import type { ProgresoTema } from '../types'
import { estadoDominio, dominioTema } from './dominio'

// ── P2.5 Interleaving — modo "Mezcla inteligente" ────────────
// Elige 3 temas de perfiles distintos (débil + en riesgo de olvido + dominado)
// y entrelaza sus preguntas. Mezclar temas es lo que hace el examen real y
// mejora la retención (efecto interleaving). Todo derivado del Progreso.

export interface SeleccionMezcla {
  debil: number | null      // peor acierto entre los estudiados
  riesgo: number | null     // recuerdo decaído (estado 'riesgo')
  dominado: number | null   // bien retenido (estado 'dominado')
  ids: number[]             // hasta 3 ids distintos, en orden débil→riesgo→dominado
}

/**
 * Selecciona hasta 3 temas para la mezcla. Solo considera temas estudiados
 * (vueltas>0). Si una categoría está vacía, se rellena con los estudiados
 * restantes más frágiles para llegar a 3 (o a cuantos haya).
 */
export function elegirTemasMezcla(
  temas: Record<string, ProgresoTema>,
  idsTemas: number[],
  hoy?: string,
): SeleccionMezcla {
  const estudiados = idsTemas.filter(id => (temas[String(id)]?.vueltas ?? 0) > 0)
  const elegidos = new Set<number>()

  const tomar = (cands: number[]): number | null => {
    const libre = cands.find(id => !elegidos.has(id))
    if (libre === undefined) return null
    elegidos.add(libre)
    return libre
  }

  // Débil: menor porcentaje de acierto (empate → menor id).
  const porAcierto = [...estudiados].sort((a, b) =>
    (temas[String(a)]!.porcentajeAciertos - temas[String(b)]!.porcentajeAciertos) || (a - b))
  const debil = tomar(porAcierto)

  // En riesgo de olvido: estado 'riesgo', el más frágil (menor dominio) primero.
  const enRiesgo = estudiados
    .filter(id => estadoDominio(temas[String(id)], hoy) === 'riesgo')
    .sort((a, b) => dominioTema(temas[String(a)], hoy) - dominioTema(temas[String(b)], hoy))
  const riesgo = tomar(enRiesgo)

  // Dominado: estado 'dominado', el de mayor dominio primero.
  const dominados = estudiados
    .filter(id => estadoDominio(temas[String(id)], hoy) === 'dominado')
    .sort((a, b) => dominioTema(temas[String(b)], hoy) - dominioTema(temas[String(a)], hoy))
  const dominado = tomar(dominados)

  // Relleno hasta 3 con los estudiados restantes más frágiles.
  const porFragilidad = [...estudiados].sort((a, b) =>
    dominioTema(temas[String(a)], hoy) - dominioTema(temas[String(b)], hoy))
  while (elegidos.size < Math.min(3, estudiados.length)) {
    if (tomar(porFragilidad) === null) break
  }

  // ids en orden débil→riesgo→dominado→(relleno), sin duplicados ni nulos.
  const orden = [debil, riesgo, dominado].filter((x): x is number => x !== null)
  for (const id of elegidos) if (!orden.includes(id)) orden.push(id)

  return { debil, riesgo, dominado, ids: orden }
}

/**
 * Entrelaza preguntas de varios temas en round-robin (1 de cada tema por ronda)
 * y recorta a `n`. Cada pregunta queda etiquetada con su `temaId` real para
 * registrar el rendimiento en el tema que le corresponde.
 */
export function intercalarPreguntas<T>(
  grupos: Array<{ temaId: number; preguntas: T[] }>,
  n: number,
): Array<T & { temaId: number }> {
  const out: Array<T & { temaId: number }> = []
  const max = Math.max(0, ...grupos.map(g => g.preguntas.length))
  for (let ronda = 0; ronda < max && out.length < n; ronda++) {
    for (const g of grupos) {
      const p = g.preguntas[ronda]
      if (p !== undefined && out.length < n) out.push({ ...p, temaId: g.temaId })
    }
  }
  return out
}
