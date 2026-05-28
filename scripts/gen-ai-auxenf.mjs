// Genera preguntas tipo test y flashcards para Aux Enfermería a partir de la teoría, con Groq.
// Lee GROQ_API_KEY de .env.local. Resumible: salta temas que ya tienen preguntas (usa --force para rehacer).
// Uso: node scripts/gen-ai-auxenf.mjs [idDesde] [idHasta] [--force]
import fs from 'node:fs'
import path from 'node:path'

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const MODEL = 'llama-3.1-8b-instant'
const OUT = 'src/data/topics/aux-enfermeria'

// --- cargar GROQ_API_KEY de .env.local ---
function leerEnv() {
  try {
    const txt = fs.readFileSync('.env.local', 'utf8')
    for (const line of txt.split('\n')) {
      const m = line.match(/^\s*GROQ_API_KEY\s*=\s*(.+?)\s*$/)
      if (m) return m[1].replace(/^["']|["']$/g, '')
    }
  } catch { /* */ }
  return process.env.GROQ_API_KEY
}
const KEY = leerEnv()
if (!KEY) { console.error('No hay GROQ_API_KEY en .env.local'); process.exit(1) }

const args = process.argv.slice(2)
const force = args.includes('--force')
const nums = args.filter(a => /^\d+$/.test(a)).map(Number)
const desde = nums[0] || 1
const hasta = nums[1] || 24

function extraerJSON(texto) {
  const t = (texto || '').trim().replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim()
  const i = t.indexOf('{'), j = t.lastIndexOf('}')
  if (i < 0 || j < 0) return null
  try { return JSON.parse(t.slice(i, j + 1)) } catch { return null }
}
function validarPreguntas(items) {
  if (!Array.isArray(items) || items.length === 0) return false
  return items.every(q => q && typeof q.enunciado === 'string'
    && Array.isArray(q.opciones) && q.opciones.length === 4
    && typeof q.respuestaCorrecta === 'number' && q.respuestaCorrecta >= 0 && q.respuestaCorrecta <= 3)
}
function validarFlashcards(items) {
  return Array.isArray(items) && items.length > 0
    && items.every(f => f && typeof f.pregunta === 'string' && typeof f.respuesta === 'string')
}

function prompt(titulo, teoria) {
  return `Eres preparador de oposiciones. A partir EXCLUSIVAMENTE del siguiente temario de Auxiliar de Enfermería (TCAE), tema "${titulo}", genera material de estudio.
Devuelve SOLO JSON con esta forma exacta:
{
  "preguntas": [{ "enunciado": "...", "opciones": ["a","b","c","d"], "respuestaCorrecta": 0, "explicacion": "..." }],
  "flashcards": [{ "pregunta": "...", "respuesta": "..." }]
}
Reglas:
- Genera 8 preguntas tipo test con 4 opciones y UNA correcta (respuestaCorrecta = índice 0-3), con explicación breve basada en el temario.
- Genera 8 flashcards (pregunta corta / respuesta concisa) de los conceptos clave.
- Usa ÚNICAMENTE información presente en el temario. No inventes datos. Español.
TEMARIO:
${(teoria || '').slice(0, 2600)}`
}

async function generar(titulo, teoria) {
  const body = {
    model: MODEL,
    messages: [{ role: 'user', content: prompt(titulo, teoria) }],
    temperature: 0.3,
    max_tokens: 2200,
    response_format: { type: 'json_object' },
  }
  for (let intento = 1; intento <= 3; intento++) {
    const ctrl = new AbortController()
    const to = setTimeout(() => ctrl.abort(), 60000)
    try {
      const r = await fetch(GROQ_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${KEY}` },
        body: JSON.stringify(body), signal: ctrl.signal,
      })
      clearTimeout(to)
      if (r.status === 429) { const w = 8000 * intento; console.log(`  429, espero ${w}ms…`); await new Promise(s => setTimeout(s, w)); continue }
      if (!r.ok) { console.error('  Groq', r.status, (await r.text()).slice(0, 200)); return null }
      const data = await r.json()
      const parsed = extraerJSON(data?.choices?.[0]?.message?.content)
      if (parsed && validarPreguntas(parsed.preguntas) && validarFlashcards(parsed.flashcards)) return parsed
      console.log('  respuesta no válida, reintento…')
    } catch (e) { clearTimeout(to); console.error('  error', String(e.message || e)) }
    await new Promise(s => setTimeout(s, 2000))
  }
  return null
}

let ok = 0, fail = 0
for (let id = desde; id <= hasta; id++) {
  const p = path.join(OUT, `tema-${String(id).padStart(2, '0')}.json`)
  const tema = JSON.parse(fs.readFileSync(p, 'utf8'))
  if (!force && tema.preguntas?.length > 0) { console.log(`tema-${id}: ya tiene preguntas, salto`); continue }
  process.stdout.write(`tema-${String(id).padStart(2, '0')} (${tema.titulo.slice(0, 30)})… `)
  const res = await generar(tema.titulo, tema.secciones?.[0]?.contenido)
  if (!res) { console.log('FALLO'); fail++; continue }
  const pad = n => String(n + 1).padStart(2, '0')
  tema.preguntas = res.preguntas.slice(0, 8).map((q, i) => ({
    id: `p${id}-${pad(i)}`, enunciado: q.enunciado, opciones: q.opciones,
    respuestaCorrecta: q.respuestaCorrecta, explicacion: q.explicacion || '',
  }))
  tema.flashcards = res.flashcards.slice(0, 8).map((f, i) => ({
    id: `fc${id}-${pad(i)}`, pregunta: f.pregunta, respuesta: f.respuesta,
  }))
  fs.writeFileSync(p, JSON.stringify(tema, null, 2) + '\n', 'utf8')
  console.log(`OK (${tema.preguntas.length}p / ${tema.flashcards.length}fc)`)
  ok++
  await new Promise(s => setTimeout(s, 32000)) // respetar límite 6000 TPM (free tier)
}
console.log(`\nhecho=${ok} fallos=${fail}`)
