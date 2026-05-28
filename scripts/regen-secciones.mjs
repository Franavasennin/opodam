// Limpia el markdown de MarkItDown y reemplaza secciones[] en los tema-NN.json.
// Uso: node scripts/regen-secciones.mjs <mdDir> <jsonDir> [mapaJson]
//   mapaJson opcional: { "especifica-01": 16, ... } para mapear nombre→temaId.
//   Sin mapa: temaId = número del nombre de archivo.
import fs from 'node:fs'
import path from 'node:path'

const [, , mdDir, jsonDir, mapaPath] = process.argv
const mapa = mapaPath ? JSON.parse(fs.readFileSync(mapaPath, 'utf8')) : null

const NOISE = [
  /^®$/, /APOLOCAN/i, /Documento protegido/i, /^©/, /Copyright/i,
  /^P[OÓ]LIC[IÍ]A$/i, /^CANARIA$/i, /^TEMA\s*\d+$/i, /^(GENERAL|ESPEC[IÍ]FICA)$/i,
  /^\d{1,4}$/,                       // números de página sueltos
  /^Página\s+\d+/i, /^\d+\s*\/\s*\d+$/,
]

function limpiar(raw) {
  let lines = raw.replace(/\f/g, '\n').split('\n')
  lines = lines
    .map(l => l.replace(/ /g, ' ').replace(/[ \t]{2,}/g, ' ').replace(/\s+$/, ''))
    .filter(l => {
      const t = l.trim()
      if (!t) return true
      return !NOISE.some(re => re.test(t))
    })
  let text = lines.join('\n').replace(/\n{3,}/g, '\n\n').trim()
  return text
}

function temaIdDe(file) {
  const base = file.replace(/\.md$/i, '')
  if (mapa && mapa[base] != null) return mapa[base]
  const m = base.match(/(\d+)/)
  return m ? parseInt(m[1], 10) : null
}

const files = fs.readdirSync(mdDir).filter(f => f.toLowerCase().endsWith('.md'))
let ok = 0, fail = 0
for (const file of files) {
  const id = temaIdDe(file)
  if (id == null) { console.log('SKIP (sin id):', file); continue }
  const jsonPath = path.join(jsonDir, `tema-${String(id).padStart(2, '0')}.json`)
  if (!fs.existsSync(jsonPath)) { console.error('NO EXISTE JSON:', jsonPath, '(de', file + ')'); fail++; continue }
  const contenido = limpiar(fs.readFileSync(path.join(mdDir, file), 'utf8'))
  if (contenido.length < 200) { console.error('CONTENIDO MUY CORTO:', file, contenido.length); fail++; continue }
  const tema = JSON.parse(fs.readFileSync(jsonPath, 'utf8'))
  tema.secciones = [{ titulo: '', contenido }]
  fs.writeFileSync(jsonPath, JSON.stringify(tema, null, 2) + '\n', 'utf8')
  console.log(`OK tema-${String(id).padStart(2, '0')}  (${contenido.length} chars)`)
  ok++
}
console.log(`\nregenerados=${ok} fallos=${fail}`)
