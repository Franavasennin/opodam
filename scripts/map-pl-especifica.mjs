// Propone el mapeo especifica-NN.md → id de tema (16..37) de policia-local
// comparando el encabezado del PDF con el título oficial del tema (solape de palabras).
// Uso: node scripts/map-pl-especifica.mjs
import fs from 'node:fs'
import path from 'node:path'

const mdDir = '.tmp_md/policia-local'
const jsonDir = 'src/data/topics/policia-local'

const STOP = new Set('de la el los las y en a su sus del al e o un una para por con que se the of and materia normativa'.split(' '))
const norm = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9ñ ]/g, ' ')
const tokens = s => norm(s).split(/\s+/).filter(w => w.length > 3 && !STOP.has(w))

// Títulos oficiales de los temas específicos (16..37)
const candidatos = []
for (let id = 16; id <= 37; id++) {
  const j = JSON.parse(fs.readFileSync(path.join(jsonDir, `tema-${String(id).padStart(2, '0')}.json`), 'utf8'))
  candidatos.push({ id, titulo: j.titulo, toks: new Set(tokens(j.titulo)) })
}

// Encabezado representativo de cada md: primeras líneas con texto "de tema"
function encabezado(file) {
  const lines = fs.readFileSync(path.join(mdDir, file), 'utf8').split('\n').map(l => l.trim())
  const utiles = lines.filter(l =>
    l.length > 25 && !/^(P[OÓ]LIC[IÍ]A|CANARIA|TEMA|GENERAL|ESPEC[IÍ]FICA|BIBLIOGRAF|®)/i.test(l) && !/APOLOCAN|Copyright/i.test(l)
  )
  return utiles.slice(0, 3).join(' ')
}

const files = fs.readdirSync(mdDir).filter(f => /^especifica-\d+\.md$/.test(f)).sort()
const usados = new Set()
const mapa = {}
const filas = []

for (const file of files) {
  const head = encabezado(file)
  const ht = tokens(head)
  let best = null, bestScore = -1
  for (const c of candidatos) {
    if (usados.has(c.id)) continue
    let score = 0
    for (const w of ht) if (c.toks.has(w)) score++
    if (score > bestScore) { bestScore = score; best = c }
  }
  if (best) { usados.add(best.id); mapa[file.replace('.md', '')] = best.id }
  filas.push({ file, id: best?.id, score: bestScore, head: head.slice(0, 60), titulo: best?.titulo.slice(0, 55) })
}

filas.forEach(f => console.log(`${f.file} -> tema-${String(f.id).padStart(2,'0')} (score ${f.score})\n   md:  ${f.head}\n   app: ${f.titulo}`))
const faltan = candidatos.filter(c => !usados.has(c.id)).map(c => c.id)
console.log('\nIDs sin asignar:', faltan.join(', ') || 'ninguno')
fs.writeFileSync('.tmp_md/pl-map.json', JSON.stringify(mapa, null, 2))
console.log('Mapa escrito en .tmp_md/pl-map.json')
