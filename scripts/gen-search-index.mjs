// Genera índices de búsqueda por oposición para el tutor global (RAG híbrido).
// Salida:
//   public/search/<slug>.json          = { slug, chunks:[{t,ti,c}] }      (texto, BM25)
//   public/search/<slug>.vectors.json  = { vectors:[base64 int8 (384)] }  (semántico, mismo orden)
// Uso: node scripts/gen-search-index.mjs
import fs from 'node:fs'
import path from 'node:path'
import { pipeline } from '@xenova/transformers'

const SLUGS = ['cgpc', 'policia-local', 'aux-enfermeria', 'guardia-civil', 'aux-judicial', 'tramitacion-judicial']
const TOPICS = 'src/data/topics'
const OUT = 'public/search'
const CHUNK = 600
const MAX_CHUNKS_TEMA = 45
const MODELO = 'Xenova/multilingual-e5-small'
const FORZAR = process.argv.includes('--force')

fs.mkdirSync(OUT, { recursive: true })

function trocear(texto) {
  const limpio = (texto || '').replace(/\r/g, '').trim()
  if (!limpio) return []
  const lineas = limpio.split('\n').map(l => l.trim()).filter(Boolean)
  const chunks = []
  let buf = ''
  for (const l of lineas) {
    if (buf && (buf + ' ' + l).length > CHUNK) { chunks.push(buf.trim()); buf = l }
    else buf += (buf ? ' ' : '') + l
    while (buf.length > CHUNK * 1.6) { chunks.push(buf.slice(0, CHUNK).trim()); buf = buf.slice(CHUNK) }
  }
  if (buf.trim()) chunks.push(buf.trim())
  return chunks.filter(esUtil)
}

function esUtil(c) {
  if (c.length < 40) return false
  const barras = (c.match(/\|/g) || []).length
  if (barras >= 6) return false
  const letras = (c.match(/[a-záéíóúñ]/gi) || []).length
  return letras / c.length > 0.55
}

function cuantizar(vec) {
  const bytes = Buffer.alloc(vec.length)
  for (let i = 0; i < vec.length; i++) {
    let q = Math.round(vec[i] * 127)
    if (q > 127) q = 127
    if (q < -127) q = -127
    bytes[i] = q & 0xff
  }
  return bytes.toString('base64')
}

// El modelo se carga bajo demanda. Antes se creaba en el top level, así que
// cada `npm run dev` descargaba y cargaba el extractor aunque no hubiera nada
// que recalcular: era lo que hacía eterno el arranque.
let extractor = null
async function embed(texto) {
  extractor ??= await pipeline('feature-extraction', MODELO)
  const out = await extractor('passage: ' + texto, { pooling: 'mean', normalize: true })
  return Array.from(out.data)
}

/**
 * ¿Están los índices de este slug al día?
 * Lo están si existen los dos ficheros de salida y ningún tema-NN.json se ha
 * tocado después. En un checkout limpio (CI/Netlify) no existen, así que
 * siempre se regeneran; `--force` lo fuerza en local.
 */
function estaAlDia(slug, dir, files) {
  if (FORZAR) return false
  const salidas = [path.join(OUT, `${slug}.json`), path.join(OUT, `${slug}.vectors.json`)]
  if (!salidas.every(p => fs.existsSync(p))) return false
  const salidaMasAntigua = Math.min(...salidas.map(p => fs.statSync(p).mtimeMs))
  const fuenteMasReciente = Math.max(...files.map(f => fs.statSync(path.join(dir, f)).mtimeMs))
  return salidaMasAntigua >= fuenteMasReciente
}

let total = 0
for (const slug of SLUGS) {
  const dir = path.join(TOPICS, slug)
  if (!fs.existsSync(dir)) { console.log('SKIP (sin dir):', slug); continue }
  const files = fs.readdirSync(dir).filter(f => /^tema-\d+\.json$/.test(f)).sort()
  if (files.length && estaAlDia(slug, dir, files)) {
    const cacheados = JSON.parse(fs.readFileSync(path.join(OUT, `${slug}.json`), 'utf8')).chunks.length
    console.log(`AL DÍA ${slug}: ${cacheados} fragmentos (usa --force para regenerar)`)
    total += cacheados
    continue
  }
  const chunks = []
  for (const f of files) {
    const tema = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'))
    const texto = (tema.secciones || []).map(s => s.contenido || '').join('\n')
    const trozos = trocear(texto).slice(0, MAX_CHUNKS_TEMA)
    for (const c of trozos) chunks.push({ t: tema.id, ti: tema.titulo, c })
  }
  const vectors = []
  for (const ch of chunks) vectors.push(cuantizar(await embed(ch.c)))

  const idxPath = path.join(OUT, `${slug}.json`)
  const vecPath = path.join(OUT, `${slug}.vectors.json`)
  fs.writeFileSync(idxPath, JSON.stringify({ slug, chunks }), 'utf8')
  fs.writeFileSync(vecPath, JSON.stringify({ vectors }), 'utf8')
  const kbIdx = (fs.statSync(idxPath).size / 1024).toFixed(0)
  const kbVec = (fs.statSync(vecPath).size / 1024).toFixed(0)
  console.log(`OK ${slug}: ${chunks.length} fragmentos | índice ${kbIdx} KB | vectores ${kbVec} KB`)
  total += chunks.length
}
console.log('\ntotal fragmentos:', total)
