// scripts/generate-quizzes.cjs
// Regenera flashcards y preguntas de cada tema A PARTIR de la teoría (tu material),
// usando Groq. Mantiene el resto del JSON intacto. Tolerante a fallos: si una
// generación falla tras reintento, conserva el contenido existente y lo registra.
//
// Uso: node scripts/generate-quizzes.cjs <cgpc|policia-local> [idDesde] [idHasta]

const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const MODEL = 'llama-3.1-8b-instant' // límites de tasa más altos; suficiente para Q&A desde texto dado
const N_FLASHCARDS = 12
const N_PREGUNTAS = 10
const MAX_TEORIA = 6000

function leerKey() {
  if (process.env.GROQ_API_KEY) return process.env.GROQ_API_KEY
  try {
    const env = fs.readFileSync(path.join(ROOT, '.env.local'), 'utf8')
    const m = env.match(/GROQ_API_KEY\s*=\s*(.+)/)
    return m ? m[1].trim() : null
  } catch { return null }
}

const KEY = leerKey()
if (!KEY) { console.error('Falta GROQ_API_KEY'); process.exit(1) }

const sleep = ms => new Promise(r => setTimeout(r, ms))

function teoriaDe(tema) {
  const txt = (tema.secciones || []).map(s => s.contenido).join('\n\n')
  return txt.length > MAX_TEORIA ? txt.slice(0, MAX_TEORIA) : txt
}

function prompt(tema) {
  return `A partir del siguiente TEMARIO de oposición (tema "${tema.titulo}"), genera material de estudio.

Devuelve EXCLUSIVAMENTE un objeto JSON válido (sin texto antes ni después, sin markdown) con esta forma exacta:
{
  "flashcards": [{ "pregunta": "...", "respuesta": "..." }],
  "preguntas": [{ "enunciado": "...", "opciones": ["a","b","c","d"], "respuestaCorrecta": 0, "explicacion": "..." }]
}
Genera exactamente ${N_FLASHCARDS} flashcards y ${N_PREGUNTAS} preguntas. Cada pregunta con 4 opciones y respuestaCorrecta es el índice 0-3 de la opción correcta.

Reglas:
- Usa SOLO información contenida en el TEMARIO de abajo. No inventes datos que no aparezcan.
- Preguntas tipo test claras, con una única opción correcta y 3 distractores plausibles.
- Español. Conciso.

TEMARIO:
${teoriaDe(tema)}`
}

function extraerJSON(texto) {
  const t = texto.trim().replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim()
  const i = t.indexOf('{')
  const j = t.lastIndexOf('}')
  if (i < 0 || j < 0) return null
  try { return JSON.parse(t.slice(i, j + 1)) } catch { return null }
}

function valido(data) {
  if (!data || !Array.isArray(data.flashcards) || !Array.isArray(data.preguntas)) return false
  if (data.flashcards.length === 0 || data.preguntas.length === 0) return false
  for (const f of data.flashcards) if (typeof f.pregunta !== 'string' || typeof f.respuesta !== 'string') return false
  for (const p of data.preguntas) {
    if (typeof p.enunciado !== 'string' || !Array.isArray(p.opciones) || p.opciones.length < 2) return false
    if (typeof p.respuestaCorrecta !== 'number' || p.respuestaCorrecta < 0 || p.respuestaCorrecta >= p.opciones.length) return false
  }
  return true
}

async function generar(tema) {
  const body = {
    model: MODEL,
    messages: [{ role: 'user', content: prompt(tema) }],
    temperature: 0.3,
    max_tokens: 4000,
    response_format: { type: 'json_object' },
  }
  for (let intento = 1; intento <= 5; intento++) {
    try {
      const r = await fetch(GROQ_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${KEY}` },
        body: JSON.stringify(body),
      })
      if (r.status === 429) {
        const ra = Number(r.headers.get('retry-after')) || 0
        await sleep(ra > 0 ? ra * 1000 + 500 : 15000)
        continue
      }
      if (!r.ok) { await sleep(2000); continue }
      const j = await r.json()
      const content = j.choices?.[0]?.message?.content || ''
      const data = extraerJSON(content)
      if (valido(data)) return data
    } catch { /* reintenta */ }
    await sleep(1500)
  }
  return null
}

async function run(slug, desde, hasta) {
  const dir = path.join(ROOT, 'src', 'data', 'topics', slug)
  const files = fs.readdirSync(dir).filter(f => /^tema-\d+\.json$/.test(f)).sort()
  const fallos = []
  for (const f of files) {
    const p = path.join(dir, f)
    const tema = JSON.parse(fs.readFileSync(p, 'utf8').replace(/^﻿/, ''))
    if (desde && tema.id < desde) continue
    if (hasta && tema.id > hasta) continue
    const data = await generar(tema)
    if (!data) { fallos.push(tema.id); console.log(`[${slug}] tema ${tema.id}: FALLO (conserva existente)`); continue }
    tema.flashcards = data.flashcards.map((c, i) => ({ id: `fc${tema.id}-${String(i + 1).padStart(2, '0')}`, pregunta: c.pregunta, respuesta: c.respuesta }))
    tema.preguntas = data.preguntas.map((q, i) => ({ id: `p${tema.id}-${String(i + 1).padStart(2, '0')}`, enunciado: q.enunciado, opciones: q.opciones, respuestaCorrecta: q.respuestaCorrecta, explicacion: q.explicacion || '' }))
    fs.writeFileSync(p, JSON.stringify(tema, null, 2) + '\n', 'utf8')
    console.log(`[${slug}] tema ${tema.id}: ${tema.flashcards.length} fc / ${tema.preguntas.length} preg`)
    await sleep(7000)
  }
  if (fallos.length) console.log(`[${slug}] FALLOS: ${fallos.join(', ')}`)
  else console.log(`[${slug}] completado sin fallos`)
}

const slug = process.argv[2]
const desde = process.argv[3] ? Number(process.argv[3]) : null
const hasta = process.argv[4] ? Number(process.argv[4]) : null
if (!slug) { console.error('Uso: node scripts/generate-quizzes.cjs <slug> [idDesde] [idHasta]'); process.exit(1) }
run(slug, desde, hasta)
