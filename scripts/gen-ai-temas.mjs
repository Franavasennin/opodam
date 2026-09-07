// Genera preguntas tipo test y flashcards para cualquier oposición (slug) con Mistral, desde la teoría.
// Lee MISTRAL_API_KEY de .env.local. Resumible. Uso:
//   node scripts/gen-ai-temas.mjs <slug> [desde] [hasta] [--force]
//     [--count=N] [--batch=M] [--flashcards=K]
//
// Las preguntas se piden en lotes de --batch (por defecto 8), acumulando y
// deduplicando por enunciado normalizado, hasta llegar a --count (por
// defecto 8, igual que antes). No se pide todo en una sola llamada: pedir
// 32 preguntas de golpe a un modelo pequeño hace que la validación rechace
// el lote ENTERO si una sola pregunta sale mal formada, y en la práctica el
// modelo repite o parafrasea al agotar hechos distintos del temario. Mismo
// problema (y misma solución) que documentó la producción de Security+.
import fs from 'node:fs'
import path from 'node:path'

const MISTRAL_URL = 'https://api.mistral.ai/v1/chat/completions'
// Configurable: la cuenta puede tener cupo 0 en un modelo y sobrado en otro
// (comprobar con una llamada a /v1/chat/completions — headers x-ratelimit-*).
const MODEL = process.env.MISTRAL_MODEL || 'mistral-small-latest'

const args = process.argv.slice(2)
const slug = args.find(a => !/^\d+$/.test(a) && !a.startsWith('--'))
if (!slug) {
  console.error('Falta slug. Uso: node scripts/gen-ai-temas.mjs <slug> [desde] [hasta] [--force] [--count=N] [--batch=M] [--flashcards=K]')
  process.exit(1)
}
const OUT = `src/data/topics/${slug}`
const force = args.includes('--force')
const nums = args.filter(a => /^\d+$/.test(a)).map(Number)

function leerFlag(nombre, porDefecto) {
  const m = args.find(a => a.startsWith(`--${nombre}=`))
  return m ? Number(m.split('=')[1]) : porDefecto
}
const COUNT = leerFlag('count', 8)
const BATCH = Math.min(leerFlag('batch', 8), COUNT)
const FLASHCARDS = leerFlag('flashcards', 8)
const MAX_ESTANCADO = 3 // lotes seguidos sin aportar nada -> se aborta esa tanda

function leerEnv() {
  try {
    for (const line of fs.readFileSync('.env.local', 'utf8').split('\n')) {
      const m = line.match(/^\s*MISTRAL_API_KEY\s*=\s*(.+?)\s*$/)
      if (m) return m[1].replace(/^["']|["']$/g, '')
    }
  } catch { /* */ }
  return process.env.MISTRAL_API_KEY
}
const KEY = leerEnv()
if (!KEY) { console.error('No hay MISTRAL_API_KEY en .env.local'); process.exit(1) }

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
const STOPWORDS = new Set(['que','como','para','esta','este','estos','estas','segun','desde','entre','cual','cuales','permite','permiten','servicio','aws','amazon','datos','sobre','cuando','donde','pero','sido','sera','tiene','tienen'])
const normEnun = s => (s || '').toString().trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
const tokens = s => new Set(normEnun(s).replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length >= 4 && !STOPWORDS.has(w)))
function jaccard(a, b) {
  const ta = tokens(a), tb = tokens(b)
  if (!ta.size || !tb.size) return 0
  let inter = 0
  for (const w of ta) if (tb.has(w)) inter++
  return inter / (ta.size + tb.size - inter)
}
// Casi-duplicado: el modelo a veces reformula la misma pregunta con los
// distractores reordenados en vez de generar una nueva (visto en spot-check
// de tema-01: dos preguntas sobre "Security Hub vs Security Lake" con >70%
// de palabras en común). La comparación exacta no lo detecta.
const UMBRAL_SIMILITUD = 0.55
const sinDup = o => new Set(o.map(x => (x || '').toString().trim().toLowerCase())).size === o.length
const validP = it => Array.isArray(it) && it.length > 0 && it.every(q => q && typeof q.enunciado === 'string' && Array.isArray(q.opciones) && q.opciones.length === 4 && q.opciones.every(x => (x || '').toString().trim()) && sinDup(q.opciones) && typeof q.respuestaCorrecta === 'number' && q.respuestaCorrecta >= 0 && q.respuestaCorrecta <= 3)
const validF = it => Array.isArray(it) && it.length > 0 && it.every(f => f && typeof f.pregunta === 'string' && typeof f.respuesta === 'string')

function promptPreguntas(titulo, teoria, n, evitar) {
  const evitarTxt = evitar.length
    ? `\nNO repitas ni parafrasees estos enunciados ya usados:\n${evitar.map(e => `- ${e}`).join('\n')}`
    : ''
  return `Eres preparador de una certificación técnica. A partir EXCLUSIVAMENTE del siguiente temario, tema "${titulo}", genera ${n} preguntas tipo test NUEVAS y distintas entre sí.
Devuelve SOLO JSON: { "preguntas": [{ "enunciado": "...", "opciones": ["a","b","c","d"], "respuestaCorrecta": 0, "explicacion": "..." }] }
Reglas: exactamente ${n} preguntas, 4 opciones cada una, UNA correcta (índice 0-3), explicación breve que cite el servicio o mecanismo correcto. Cada pregunta debe testear un hecho, servicio o distinción DIFERENTE del temario. PROHIBIDO reformular una pregunta ya hecha cambiando el orden de las opciones o el fraseo — si ya se preguntó por "X frente a Y", la siguiente pregunta debe tratar un tema distinto, no la misma comparación con otras palabras. Usa SOLO información del temario. No inventes. Español.${evitarTxt}
TEMARIO:
${teoria || ''}`
}

function promptFlashcards(titulo, teoria, n) {
  return `Eres preparador de una certificación técnica. A partir EXCLUSIVAMENTE del siguiente temario, tema "${titulo}", genera ${n} flashcards.
Devuelve SOLO JSON: { "flashcards": [{ "pregunta": "...", "respuesta": "..." }] }
Reglas: exactamente ${n} flashcards, pregunta corta y respuesta concisa, cada una sobre un servicio o concepto distinto. Usa SOLO información del temario. No inventes. Español.
TEMARIO:
${teoria || ''}`
}

async function llamarMistral(content, maxTokens) {
  const body = { model: MODEL, messages: [{ role: 'user', content }], temperature: 0.3, max_tokens: maxTokens, response_format: { type: 'json_object' } }
  for (let i = 1; i <= 3; i++) {
    const ctrl = new AbortController(); const to = setTimeout(() => ctrl.abort(), 60000)
    try {
      const r = await fetch(MISTRAL_URL, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${KEY}` }, body: JSON.stringify(body), signal: ctrl.signal })
      clearTimeout(to)
      if (r.status === 429) { const w = 8000 * i; console.log(`    429, espero ${w}ms…`); await new Promise(s => setTimeout(s, w)); continue }
      if (!r.ok) { console.error('    Mistral', r.status, (await r.text()).slice(0, 160)); return null }
      const d = await r.json()
      return extraerJSON(d?.choices?.[0]?.message?.content)
    } catch (e) { clearTimeout(to); console.error('    error', String(e.message || e)) }
    await new Promise(s => setTimeout(s, 2000))
  }
  return null
}

async function generarPreguntas(titulo, teoria, objetivo, batch) {
  const acumulado = []
  const vistos = new Set()
  let estancado = 0
  let descartadasPorSimilitud = 0
  while (acumulado.length < objetivo && estancado < MAX_ESTANCADO) {
    const pedir = Math.min(batch, objetivo - acumulado.length)
    const evitar = acumulado.slice(-30).map(p => p.enunciado)
    const p = await llamarMistral(promptPreguntas(titulo, teoria, pedir, evitar), 300 * pedir + 400)
    if (!p || !validP(p.preguntas)) {
      console.log(`    lote inválido (${acumulado.length}/${objetivo} hasta ahora)`)
      estancado++
      continue
    }
    let nuevas = 0
    for (const q of p.preguntas) {
      const clave = normEnun(q.enunciado)
      if (vistos.has(clave)) continue
      // Casi-duplicado: misma pregunta reformulada. Se compara contra TODO
      // lo acumulado, no solo contra la ventana de "evitar" del prompt —
      // el modelo no siempre respeta esa lista.
      const esCasiDup = acumulado.some(a => jaccard(a.enunciado, q.enunciado) >= UMBRAL_SIMILITUD)
      if (esCasiDup) { descartadasPorSimilitud++; continue }
      vistos.add(clave)
      acumulado.push(q)
      nuevas++
    }
    estancado = nuevas > 0 ? 0 : estancado + 1
    console.log(`    lote: +${nuevas} (${acumulado.length}/${objetivo})`)
  }
  if (estancado >= MAX_ESTANCADO) console.log(`    aviso: ${MAX_ESTANCADO} lotes sin aportar, me quedo con ${acumulado.length}`)
  if (descartadasPorSimilitud > 0) console.log(`    descartadas por casi-duplicado: ${descartadasPorSimilitud}`)
  return acumulado
}

let ok = 0, fail = 0
for (let id = desde; id <= hasta; id++) {
  const p = path.join(OUT, `tema-${String(id).padStart(2, '0')}.json`)
  if (!fs.existsSync(p)) continue
  const tema = JSON.parse(fs.readFileSync(p, 'utf8'))
  if (!force && tema.preguntas?.length > 0) { console.log(`tema-${id}: ya tiene preguntas, salto`); continue }
  console.log(`[${slug}] tema-${String(id).padStart(2, '0')} (${tema.titulo}) — objetivo ${COUNT} preguntas / ${FLASHCARDS} flashcards`)

  const preguntas = await generarPreguntas(tema.titulo, tema.secciones?.[0]?.contenido, COUNT, BATCH)
  const fcRes = await llamarMistral(promptFlashcards(tema.titulo, tema.secciones?.[0]?.contenido, FLASHCARDS), 200 * FLASHCARDS + 200)
  const flashcards = (fcRes && validF(fcRes.flashcards)) ? fcRes.flashcards : []

  if (preguntas.length === 0) { console.log('  FALLO (sin preguntas válidas)'); fail++; continue }

  const pad = n => String(n + 1).padStart(2, '0')
  tema.preguntas = preguntas.map((q, i) => ({ id: `p${id}-${pad(i)}`, enunciado: q.enunciado, opciones: q.opciones, respuestaCorrecta: q.respuestaCorrecta, explicacion: q.explicacion || '' }))
  tema.flashcards = flashcards.map((f, i) => ({ id: `fc${id}-${pad(i)}`, pregunta: f.pregunta, respuesta: f.respuesta }))
  fs.writeFileSync(p, JSON.stringify(tema, null, 2) + '\n', 'utf8')
  console.log(`  OK (${tema.preguntas.length}p / ${tema.flashcards.length}fc)`)
  ok++
  await new Promise(s => setTimeout(s, 12000))
}
console.log(`\n[${slug}] hecho=${ok} fallos=${fail}`)
