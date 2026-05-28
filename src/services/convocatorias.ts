// Estado de convocatoria por oposición.
// Fuente base: /convocatorias.json (estático, se actualiza sin recompilar).
// Para cuerpos estatales (Guardia Civil) consulta además en vivo el BOE.

export interface Convocatoria {
  estado: 'activa' | 'parada' | 'sin-convocatoria'
  fechaExamen: string | null
  fuente: 'BOE' | 'BOC'
  boletinUrl: string
  tituloBOE?: string
  fechaPublicacion?: string
}

const POR_DEFECTO: Convocatoria = {
  estado: 'sin-convocatoria',
  fechaExamen: null,
  fuente: 'BOC',
  boletinUrl: 'https://www.boe.es/',
}

let cacheJson: Record<string, Convocatoria> | null = null

async function cargarJson(): Promise<Record<string, Convocatoria>> {
  if (cacheJson) return cacheJson
  try {
    const r = await fetch('/convocatorias.json', { cache: 'no-cache' })
    if (r.ok) { cacheJson = await r.json(); return cacheJson! }
  } catch { /* offline */ }
  cacheJson = {}
  return cacheJson
}

export async function obtenerConvocatoria(slug: string): Promise<Convocatoria> {
  const json = await cargarJson()
  const base: Convocatoria = { ...POR_DEFECTO, ...(json[slug] ?? {}) }

  // Comprobación en vivo en el BOE (solo cuerpos estatales).
  if (base.fuente === 'BOE') {
    try {
      const r = await fetch(`/.netlify/functions/boe?cuerpo=${encodeURIComponent(slug)}`)
      if (r.ok) {
        const data = await r.json()
        if (data && data.convocatoria) {
          base.estado = 'activa'
          base.tituloBOE = data.convocatoria.titulo
          base.fechaPublicacion = data.convocatoria.fecha
          base.boletinUrl = data.convocatoria.url || base.boletinUrl
        }
      }
    } catch { /* sin función / offline: usa el JSON base */ }
  }

  return base
}
