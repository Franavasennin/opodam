// Genera un índice de búsqueda (fragmentos de teoría) por oposición para el tutor global (RAG).
// Salida: public/search/<slug>.json = { slug, chunks: [{ t: temaId, ti: titulo, c: texto }] }
// Uso: node scripts/gen-search-index.mjs
import fs from 'node:fs'
import path from 'node:path'

const SLUGS = ['cgpc', 'policia-local', 'aux-enfermeria', 'guardia-civil']
const TOPICS = 'src/data/topics'
const OUT = 'public/search'
const CHUNK = 600           // tamaño objetivo de fragmento (caracteres)
const MAX_CHUNKS_TEMA = 45  // tope por tema para acotar el tamaño del índice

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

// Descarta fragmentos basura (tablas de bibliografía de MarkItDown, índices con muchas barras).
function esUtil(c) {
  if (c.length < 40) return false
  const barras = (c.match(/\|/g) || []).length
  if (barras >= 6) return false
  const letras = (c.match(/[a-záéíóúñ]/gi) || []).length
  return letras / c.length > 0.55
}

let total = 0
for (const slug of SLUGS) {
  const dir = path.join(TOPICS, slug)
  if (!fs.existsSync(dir)) { console.log('SKIP (sin dir):', slug); continue }
  const files = fs.readdirSync(dir).filter(f => /^tema-\d+\.json$/.test(f)).sort()
  const chunks = []
  for (const f of files) {
    const tema = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'))
    const texto = (tema.secciones || []).map(s => s.contenido || '').join('\n')
    const trozos = trocear(texto).slice(0, MAX_CHUNKS_TEMA)
    for (const c of trozos) chunks.push({ t: tema.id, ti: tema.titulo, c })
  }
  const outPath = path.join(OUT, `${slug}.json`)
  fs.writeFileSync(outPath, JSON.stringify({ slug, chunks }), 'utf8')
  const kb = (fs.statSync(outPath).size / 1024).toFixed(0)
  console.log(`OK ${slug}: ${chunks.length} fragmentos, ${kb} KB`)
  total += chunks.length
}
console.log('\ntotal fragmentos:', total)
