// Recuperación híbrida (BM25 + semántica) sobre el índice de cada oposición.
// BM25 es el suelo garantizado (solo descarga el índice de texto). Lo semántico
// (vectores + modelo) carga perezosamente y, si falla, hay fallback silencioso a BM25.

interface ChunkRaw { t: number; ti: string; c: string }
interface IndiceCargado {
  chunks: ChunkRaw[]
  tokens: string[][]
  df: Map<string, number>
  avgdl: number
  N: number
}

export interface ResultadoBusqueda { temaId: number; titulo: string; texto: string; score: number }
export interface Puntuado { i: number; score: number }

export const PESO_LEXICO = 0.5
export const PESO_SEMANTICO = 0.5

const STOP = new Set('de la el los las y o u e a en un una unos unas del al que se su sus por con para como mas más sin sobre entre ya no ni lo le les nos os mi tu si son ser es está están este esta estos estas cuando donde cual cuales segun según cada todo toda todos todas the of and'.split(' '))

function tokenizar(s: string): string[] {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9ñ\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOP.has(w))
}

/** base64 de int8 → Float32 dividido por 127 (de-cuantización). */
export function decodificarVector(b64: string): Float32Array {
  const bin = atob(b64)
  const out = new Float32Array(bin.length)
  for (let i = 0; i < bin.length; i++) {
    let byte = bin.charCodeAt(i)
    if (byte > 127) byte -= 256
    out[i] = byte / 127
  }
  return out
}

/** Normaliza min-max cada lista a [0,1] y combina por índice. */
export function fusionar(lex: Puntuado[], sem: Puntuado[], pl = PESO_LEXICO, ps = PESO_SEMANTICO): Puntuado[] {
  const norm = (lista: Puntuado[]) => {
    if (!lista.length) return new Map<number, number>()
    const vals = lista.map(x => x.score)
    const min = Math.min(...vals), max = Math.max(...vals)
    const rango = max - min || 1
    return new Map(lista.map(x => [x.i, (x.score - min) / rango]))
  }
  const ml = norm(lex), ms = norm(sem)
  const ids = new Set<number>([...ml.keys(), ...ms.keys()])
  const out: Puntuado[] = []
  for (const i of ids) out.push({ i, score: pl * (ml.get(i) ?? 0) + ps * (ms.get(i) ?? 0) })
  out.sort((a, b) => b.score - a.score)
  return out
}

const cacheIdx = new Map<string, Promise<IndiceCargado | null>>()
function cargarIndice(slug: string): Promise<IndiceCargado | null> {
  if (cacheIdx.has(slug)) return cacheIdx.get(slug)!
  const p = (async (): Promise<IndiceCargado | null> => {
    try {
      const r = await fetch(`/search/${slug}.json`, { cache: 'force-cache' })
      if (!r.ok) return null
      const data = await r.json() as { chunks: ChunkRaw[] }
      const chunks = data.chunks || []
      const tokens = chunks.map(c => tokenizar(c.c))
      const df = new Map<string, number>()
      for (const toks of tokens) for (const t of new Set(toks)) df.set(t, (df.get(t) || 0) + 1)
      const avgdl = tokens.reduce((a, t) => a + t.length, 0) / (tokens.length || 1)
      return { chunks, tokens, df, avgdl, N: chunks.length }
    } catch { return null }
  })()
  cacheIdx.set(slug, p)
  return p
}

// Vectores: fichero aparte, se carga perezosamente (solo cuando hay modelo).
const cacheVec = new Map<string, Promise<Float32Array[] | null>>()
function cargarVectores(slug: string): Promise<Float32Array[] | null> {
  if (cacheVec.has(slug)) return cacheVec.get(slug)!
  const p = (async (): Promise<Float32Array[] | null> => {
    try {
      const r = await fetch(`/search/${slug}.vectors.json`, { cache: 'force-cache' })
      if (!r.ok) return null
      const data = await r.json() as { vectors: string[] }
      return Array.isArray(data.vectors) ? data.vectors.map(decodificarVector) : null
    } catch { return null }
  })()
  cacheVec.set(slug, p)
  return p
}

// Modelo de embeddings: perezoso, no bloqueante, fallback silencioso.
let modeloPromesa: Promise<((t: string) => Promise<Float32Array>) | null> | null = null
function obtenerEmbedder(): Promise<((t: string) => Promise<Float32Array>) | null> {
  if (modeloPromesa) return modeloPromesa
  modeloPromesa = (async () => {
    try {
      const { pipeline } = await import('@xenova/transformers')
      const extractor = await pipeline('feature-extraction', 'Xenova/multilingual-e5-small')
      return async (texto: string) => {
        const out = await extractor('query: ' + texto, { pooling: 'mean', normalize: true })
        return new Float32Array(out.data as Float32Array)
      }
    } catch { return null }
  })()
  return modeloPromesa
}

function bm25(idx: IndiceCargado, consulta: string): Puntuado[] {
  const q = [...new Set(tokenizar(consulta))]
  if (!q.length) return []
  const k1 = 1.5, b = 0.75
  const idf = (t: string) => { const n = idx.df.get(t) || 0; return Math.log(1 + (idx.N - n + 0.5) / (n + 0.5)) }
  const out: Puntuado[] = []
  for (let i = 0; i < idx.N; i++) {
    const toks = idx.tokens[i]; if (!toks.length) continue
    const dl = toks.length; let score = 0
    for (const term of q) {
      let tf = 0; for (const w of toks) if (w === term) tf++
      if (!tf) continue
      score += idf(term) * (tf * (k1 + 1)) / (tf + k1 * (1 - b + b * dl / idx.avgdl))
    }
    if (score > 0) out.push({ i, score })
  }
  return out
}

function coseno(a: Float32Array, b: Float32Array): number {
  let s = 0; const n = Math.min(a.length, b.length)
  for (let i = 0; i < n; i++) s += a[i] * b[i]
  return s
}

export async function buscar(slug: string, consulta: string, k = 6): Promise<ResultadoBusqueda[]> {
  const idx = await cargarIndice(slug)
  if (!idx || !idx.N) return []

  const lex = bm25(idx, consulta)

  let sem: Puntuado[] = []
  const embed = await obtenerEmbedder()
  if (embed) {
    const vectores = await cargarVectores(slug)
    if (vectores && vectores.length === idx.N) {
      try {
        const qv = await embed(consulta)
        sem = vectores.map((v, i) => ({ i, score: coseno(qv, v) }))
      } catch { sem = [] }
    }
  }

  const fusion = sem.length ? fusionar(lex, sem) : lex
  return fusion.slice(0, k).map(({ i }) => {
    const ch = idx.chunks[i]
    return { temaId: ch.t, titulo: ch.ti, texto: ch.c, score: 0 }
  })
}
