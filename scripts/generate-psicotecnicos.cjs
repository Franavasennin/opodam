// scripts/generate-psicotecnicos.cjs
// Genera el banco de psicotécnicos por categoría con Groq.
// Uso: node scripts/generate-psicotecnicos.cjs [categoria] [n]

const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const MODEL = 'llama-3.1-8b-instant'
const DIR = path.join(ROOT, 'src', 'data', 'psicotecnicos')

const CATS = {
  'series-numericas': 'series numéricas',
  'razonamiento-verbal': 'razonamiento verbal (sinónimos, antónimos, analogías, frases incompletas)',
  'razonamiento-logico': 'razonamiento lógico y abstracto (silogismos, deducción)',
  'ortografia-calculo': 'ortografía y cálculo matemático',
  'razonamiento-mecanico': 'razonamiento mecánico descrito en texto (sin imágenes)',
}

function leerKey() {
  if (process.env.GROQ_API_KEY) return process.env.GROQ_API_KEY
  const env = fs.readFileSync(path.join(ROOT, '.env.local'), 'utf8')
  return env.match(/GROQ_API_KEY\s*=\s*(.+)/)[1].trim()
}
const KEY = leerKey()
const sleep = ms => new Promise(r => setTimeout(r, ms))

function extraerJSON(t) {
  const s = (t || '').trim(); const i = s.indexOf('{'); const j = s.lastIndexOf('}')
  if (i < 0 || j < 0) return null
  try { return JSON.parse(s.slice(i, j + 1)) } catch { return null }
}

async function generar(catId, n) {
  const body = {
    model: MODEL,
    messages: [{ role: 'user', content: `Genera ${n} preguntas psicotécnicas de ${CATS[catId]} para oposición. Devuelve SOLO JSON {"preguntas":[{"enunciado":"..","opciones":["a","b","c","d"],"respuestaCorrecta":0,"explicacion":".."}]}. 4 opciones, respuestaCorrecta índice 0-3. Español.` }],
    temperature: 0.5, max_tokens: 4000, response_format: { type: 'json_object' },
  }
  for (let i = 0; i < 4; i++) {
    const r = await fetch(GROQ_URL, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${KEY}` }, body: JSON.stringify(body) })
    if (r.status === 429) { await sleep(15000); continue }
    if (!r.ok) { await sleep(2000); continue }
    const j = await r.json()
    const d = extraerJSON(j.choices?.[0]?.message?.content)
    if (d && Array.isArray(d.preguntas) && d.preguntas.length) return d.preguntas
    await sleep(1500)
  }
  return null
}

function valida(q) {
  return q && typeof q.enunciado === 'string' && Array.isArray(q.opciones) && q.opciones.length >= 2 &&
    typeof q.respuestaCorrecta === 'number' && q.respuestaCorrecta >= 0 && q.respuestaCorrecta < q.opciones.length
}

async function run(soloCat, n) {
  const cats = soloCat ? [soloCat] : Object.keys(CATS)
  for (const catId of cats) {
    const preguntas = await generar(catId, n)
    if (!preguntas) { console.log(catId, 'FALLO'); continue }
    const items = preguntas.filter(valida).map((q, i) => ({ id: `psico-${catId}-${String(i + 1).padStart(3, '0')}`, categoria: catId, enunciado: q.enunciado, opciones: q.opciones, respuestaCorrecta: q.respuestaCorrecta, explicacion: q.explicacion || '' }))
    if (!items.length) { console.log(catId, 'FALLO (sin items validos)'); continue }
    fs.writeFileSync(path.join(DIR, `${catId}.json`), JSON.stringify(items, null, 2) + '\n', 'utf8')
    console.log(catId, items.length, 'preguntas')
    await sleep(7000)
  }
}

run(process.argv[2] || null, Number(process.argv[3]) || 15)
