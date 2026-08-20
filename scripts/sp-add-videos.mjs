// scripts/sp-add-videos.mjs
// Añade el campo `videos` (titulo + youtubeId) a cada tema-NN.json de security-plus,
// tomando la lista de scripts/security-plus-temas.json. Idempotente.
import { readFileSync, writeFileSync, readdirSync } from 'fs'
import { join } from 'path'

const DIR = 'src/data/topics/security-plus'
const temasMeta = JSON.parse(readFileSync('scripts/security-plus-temas.json', 'utf8')).temas

const files = readdirSync(DIR).filter(f => /^tema-\d+\.json$/.test(f))
let ok = 0
for (const f of files) {
  const ruta = join(DIR, f)
  const tema = JSON.parse(readFileSync(ruta, 'utf8'))
  const meta = temasMeta.find(t => t.id === tema.id)
  if (!meta) { console.log(`${f}: sin metadata de vídeos, salto`); continue }
  tema.videos = meta.videos.map(v => ({ titulo: v.titulo, youtubeId: v.youtubeId }))
  writeFileSync(ruta, JSON.stringify(tema, null, 2), 'utf8')
  console.log(`${f}: +${tema.videos.length} vídeo(s)`)
  ok++
}
console.log(`\n${ok}/${files.length} temas actualizados`)
