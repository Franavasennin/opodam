// Genera preguntas tipo test y flashcards para cualquier oposición (slug) con Groq, desde la teoría.
// Lee GROQ_API_KEY de .env.local. Resumible. Uso: node scripts/gen-ai-temas.mjs <slug> [desde] [hasta] [--force]
import fs from 'node:fs'
import path from 'node:path'

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const MODEL = 'llama-3.1-8b-instant'

const args = process.argv.slice(2)
const slug = args.find(a => !/^\d+$/.test(a) && a !== '--force')
if (!slug) { console.error('Falta slug. Uso: node scripts/gen-ai-temas.mjs <slug> [desde] [hasta] [--force]'); process.exit(1) }
const OUT = `src/data/topics/${slug}`
const force = args.includes('--force')
const nums = args.filter(a => /^\d+$/.test(a)).map(Number)

function leerEnv() {
  try {
    for (const line of fs.readFileSync('.env.local', 'utf8').split('\n')) {
      const m = line.match(/^\s*GROQ_API_KEY\s*=\s*(.+?)\s*$/)
      if (m) return m[1].replace(/^["']|["']$/g, '')
    }
  } catch { /* */ }
  return process.env.GROQ_API_KEY
}
const KEY = leerEnv()
if (!KEY) { console.error('No hay GROQ_API_KEY en .env.local'); process.exit(1) }

const files = fs.readdirSync(OUT).filter(f => /^tema-\d+\.json$/.test(f)).sort()
const maxId = files.length
const desde = nums[0] || 1
const hasta = nums[1] || maxId

function extraerJSON(t) {
  t = (t || '').trim().replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim()
  const i = t.indexOf('{'), j = t.lastIndexOf('}')
  if (i < 0 || j < 0) return null
  try { return JSON.parse(t.slice(i, j + 1)) } catch { return null }
}
const sinDup = o => new Set(o.map(x => (x || '').toString().trim().toLowerCase())).size === o.length
const validP = it => Array.isArray(it) && it.length > 0 && it.every(q => q && typeof q.enunciado === 'string' && Array.isArray(q.opciones) && q.opciones.length === 4 && q.opciones.every(x => (x || '').toString().trim()) && sinDup(q.opciones) && typeof q.respuestaCorrecta === 'number' && q.respuestaCorrecta >= 0 && q.respuestaCorrecta <= 3)
const validF = it => Array.isArray(it) && it.length > 0 && it.every(f => f && typeof f.pregunta === 'string' && typeof f.respuesta === 'string')

function prompt(titulo, teoria) {
  return `Eres preparador de oposiciones. A partir EXCLUSIVAMENTE del siguiente temario, tema "${titulo}", genera material de estudio.
Devuelve SOLO JSON: { "preguntas": [{ "enunciado": "...", "opciones": ["a","b","c","d"], "respuestaCorrecta": 0, "explicacion": "..." }], "flashcards": [{ "pregunta": "...", "respuesta": "..." }] }
Reglas: 8 preguntas tipo test (4 opciones, UNA correcta índice 0-3, explicación breve) y 8 flashcards (pregunta corta / respuesta concisa). Usa SOLO información del temario. No inventes. Español.
TEMARIO:
${(teoria || '').slice(0, 2600)}`
}

async function generar(titulo, teoria) {
  const body = { model: MODEL, messages: [{ role: 'user', content: prompt(titulo, teoria) }], temperature: 0.3, max_tokens: 2200, response_format: { type: 'json_object' } }
  for (let i = 1; i <= 3; i++) {
    const ctrl = new AbortController(); const to = setTimeout(() => ctrl.abort(), 60000)
    try {
      const r = await fetch(GROQ_URL, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${KEY}` }, body: JSON.stringify(body), signal: ctrl.signal })
      clearTimeout(to)
      if (r.status === 429) { const w = 8000 * i; console.log(`  429, espero ${w}ms…`); await new Promise(s => setTimeout(s, w)); continue }
      if (!r.ok) { console.error('  Groq', r.status, (await r.text()).slice(0, 160)); return null }
      const d = await r.json(); const p = extraerJSON(d?.choices?.[0]?.message?.content)
      if (p && validP(p.preguntas) && validF(p.flashcards)) return p
      console.log('  respuesta no válida, reintento…')
    } catch (e) { clearTimeout(to); console.error('  error', String(e.message || e)) }
    await new Promise(s => setTimeout(s, 2000))
  }
  return null
}

let ok = 0, fail = 0
for (let id = desde; id <= hasta; id++) {
  const p = path.join(OUT, `tema-${String(id).padStart(2, '0')}.json`)
  if (!fs.existsSync(p)) continue
  const tema = JSON.parse(fs.readFileSync(p, 'utf8'))
  if (!force && tema.preguntas?.length > 0) { console.log(`tema-${id}: ya tiene preguntas, salto`); continue }
  process.stdout.write(`[${slug}] tema-${String(id).padStart(2, '0')}… `)
  const res = await generar(tema.titulo, tema.secciones?.[0]?.contenido)
  if (!res) { console.log('FALLO'); fail++; continue }
  const pad = n => String(n + 1).padStart(2, '0')
  tema.preguntas = res.preguntas.slice(0, 8).map((q, i) => ({ id: `p${id}-${pad(i)}`, enunciado: q.enunciado, opciones: q.opciones, respuestaCorrecta: q.respuestaCorrecta, explicacion: q.explicacion || '' }))
  tema.flashcards = res.flashcards.slice(0, 8).map((f, i) => ({ id: `fc${id}-${pad(i)}`, pregunta: f.pregunta, respuesta: f.respuesta }))
  fs.writeFileSync(p, JSON.stringify(tema, null, 2) + '\n', 'utf8')
  console.log(`OK (${tema.preguntas.length}p / ${tema.flashcards.length}fc)`)
  ok++
  await new Promise(s => setTimeout(s, 32000))
}
console.log(`\n[${slug}] hecho=${ok} fallos=${fail}`)
