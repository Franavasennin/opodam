// Audita la calidad de preguntas/flashcards (sin tocar nada). Reporta temas problemáticos.
// Uso: node scripts/audit-ia.mjs
import fs from 'node:fs'
import path from 'node:path'

const SLUGS = ['cgpc', 'policia-local', 'aux-enfermeria', 'guardia-civil']
const TOPICS = 'src/data/topics'
const norm = s => (s || '').toString().trim().toLowerCase().replace(/\s+/g, ' ')

function problemasTema(t) {
  const probs = []
  const pr = t.preguntas || []
  if (pr.length === 0) probs.push('sin preguntas')
  pr.forEach((p, i) => {
    const o = p.opciones || []
    if (o.length !== 4) probs.push(`p${i}:opciones=${o.length}`)
    const setO = new Set(o.map(norm))
    if (setO.size < o.length) probs.push(`p${i}:opciones duplicadas`)
    if (typeof p.respuestaCorrecta !== 'number' || p.respuestaCorrecta < 0 || p.respuestaCorrecta >= o.length) probs.push(`p${i}:respuesta fuera de rango`)
    if (!norm(p.enunciado)) probs.push(`p${i}:enunciado vacío`)
    if (o.some(x => !norm(x))) probs.push(`p${i}:opción vacía`)
  })
  const fc = t.flashcards || []
  if (fc.length === 0) probs.push('sin flashcards')
  fc.forEach((f, i) => {
    if (!norm(f.pregunta) || !norm(f.respuesta)) probs.push(`fc${i}:vacía`)
  })
  return [...new Set(probs)]
}

let totalMal = 0
for (const slug of SLUGS) {
  const dir = path.join(TOPICS, slug)
  if (!fs.existsSync(dir)) continue
  const files = fs.readdirSync(dir).filter(f => /^tema-\d+\.json$/.test(f)).sort()
  const malos = []
  for (const f of files) {
    const t = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'))
    const probs = problemasTema(t)
    if (probs.length) malos.push({ id: t.id, probs })
  }
  console.log(`\n### ${slug}: ${malos.length}/${files.length} temas con avisos`)
  malos.slice(0, 50).forEach(m => console.log(`  T${m.id}: ${m.probs.slice(0, 4).join('; ')}`))
  totalMal += malos.length
}
console.log(`\nTotal temas con avisos: ${totalMal}`)
