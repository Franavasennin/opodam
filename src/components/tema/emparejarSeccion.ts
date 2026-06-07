// Empareja la etiqueta de un nodo del mapa mental con la sección de teoría
// más parecida. Mejor esfuerzo: si nada coincide razonablemente, devuelve 0
// (principio de la teoría) para que la navegación nunca falle de forma fea.

interface SeccionMin { titulo?: string; contenido?: string }

const STOP = new Set('de la el los las y o u e a en un una del al que se su sus por con para como mas más sin sobre entre lo le les'.split(' '))

function normalizar(s: string): string {
  return (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9ñ\s]/g, ' ').replace(/\s+/g, ' ').trim()
}

function tokens(s: string): string[] {
  return normalizar(s).split(' ').filter(w => w.length > 3 && !STOP.has(w))
}

/**
 * @returns índice de la sección que mejor casa con `label`, o 0 si ninguna
 *          supera el umbral mínimo (o si no hay secciones).
 */
export function emparejarSeccion(label: string, secciones: SeccionMin[]): number {
  if (!secciones.length) return 0
  const labTokens = tokens(label)
  if (!labTokens.length) return 0
  const labNorm = normalizar(label)

  let mejor = -1
  let mejorScore = 0
  secciones.forEach((sec, i) => {
    const titTokens = tokens(sec.titulo ?? '')
    const tituloNorm = normalizar(sec.titulo ?? '')
    const contenidoNorm = normalizar(sec.contenido ?? '')

    let score = 0
    // Solape de palabras con el título (peso alto).
    for (const t of labTokens) if (titTokens.includes(t)) score += 2
    // La etiqueta entera aparece en el título.
    if (tituloNorm.includes(labNorm)) score += 3
    // La etiqueta entera aparece en el contenido.
    if (contenidoNorm.includes(labNorm)) score += 2

    if (score > mejorScore) { mejorScore = score; mejor = i }
  })

  // Umbral: al menos una palabra significativa en común (score >= 2).
  return mejorScore >= 2 ? mejor : 0
}
