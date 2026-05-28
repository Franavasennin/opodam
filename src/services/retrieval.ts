// Recuperación local (BM25) sobre el índice de fragmentos de cada oposición.
// Sin embeddings ni servicios externos: tokeniza, calcula idf y puntúa en el navegador.

interface ChunkRaw { t: number; ti: string; c: string }
interface IndiceCargado {
  chunks: ChunkRaw[]
  tokens: string[][]
  df: Map<string, number>
  avgdl: number
  N: number
}

export interface ResultadoBusqueda {
  temaId: number
  titulo: string
  texto: string
  score: number
}

const STOP = new Set('de la el los las y o u e a en un una unos unas del al que se su sus por con para como mas más sin sobre entre ya no ni lo le les nos os mi tu si son ser es está están este esta estos estas cuando donde cual cuales segun según cada todo toda todos todas the of and'.split(' '))

function tokenizar(s: string): string[] {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9ñ\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOP.has(w))
}

const cache = new Map<string, Promise<IndiceCargado | null>>()

function cargarIndice(slug: string): Promise<IndiceCargado | null> {
  if (cache.has(slug)) return cache.get(slug)!
  const p = (async (): Promise<IndiceCargado | null> => {
    try {
      const r = await fetch(`/search/${slug}.json`, { cache: 'force-cache' })
      if (!r.ok) return null
      const data = await r.json() as { chunks: ChunkRaw[] }
      const chunks = data.chunks || []
      const tokens = chunks.map(c => tokenizar(c.c))
      const df = new Map<string, number>()
      for (const toks of tokens) {
        for (const t of new Set(toks)) df.set(t, (df.get(t) || 0) + 1)
      }
      const avgdl = tokens.reduce((a, t) => a + t.length, 0) / (tokens.length || 1)
      return { chunks, tokens, df, avgdl, N: chunks.length }
    } catch { return null }
  })()
  cache.set(slug, p)
  return p
}

export async function buscar(slug: string, consulta: string, k = 6): Promise<ResultadoBusqueda[]> {
  const idx = await cargarIndice(slug)
  if (!idx || !idx.N) return []
  const q = [...new Set(tokenizar(consulta))]
  if (!q.length) return []

  const k1 = 1.5, b = 0.75
  const idf = (t: string) => {
    const n = idx.df.get(t) || 0
    return Math.log(1 + (idx.N - n + 0.5) / (n + 0.5))
  }

  const puntuados: ResultadoBusqueda[] = []
  for (let i = 0; i < idx.N; i++) {
    const toks = idx.tokens[i]
    if (!toks.length) continue
    const dl = toks.length
    let score = 0
    for (const term of q) {
      let tf = 0
      for (const w of toks) if (w === term) tf++
      if (!tf) continue
      score += idf(term) * (tf * (k1 + 1)) / (tf + k1 * (1 - b + b * dl / idx.avgdl))
    }
    if (score > 0) {
      const ch = idx.chunks[i]
      puntuados.push({ temaId: ch.t, titulo: ch.ti, texto: ch.c, score })
    }
  }
  puntuados.sort((a, b2) => b2.score - a.score)
  return puntuados.slice(0, k)
}
