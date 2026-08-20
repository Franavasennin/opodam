// scripts/sp-gen-preguntas.mjs
// LOOP C: genera exactamente 100 preguntas tipo test para un tema de security-plus,
// en 10 batches de 10, pasando los enunciados previos en cada prompt para evitar duplicados.
// Resumible: si el tema ya tiene N preguntas (N < 100, múltiplo de 10), continúa desde ahí.
// Uso: node scripts/sp-gen-preguntas.mjs <temaId> [--force]
import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dir = dirname(fileURLToPath(import.meta.url))
const MISTRAL_URL = 'https://api.mistral.ai/v1/chat/completions'
const MODEL = 'mistral-small-latest'

const temaId = Number(process.argv[2])
const force = process.argv.includes('--force')
if (!temaId) { console.error('Uso: node scripts/sp-gen-preguntas.mjs <temaId> [--force]'); process.exit(1) }

function leerEnv() {
  try {
    for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
      const m = line.match(/^\s*MISTRAL_API_KEY\s*=\s*(.+?)\s*$/)
      if (m) return m[1].replace(/^["']|["']$/g, '')
    }
  } catch { /* */ }
  return process.env.MISTRAL_API_KEY
}
const KEY = leerEnv()
if (!KEY) { console.error('No hay MISTRAL_API_KEY en .env.local'); process.exit(1) }

const rutaTema = join(__dir, `../src/data/topics/security-plus/tema-${String(temaId).padStart(2, '0')}.json`)
const tema = JSON.parse(readFileSync(rutaTema, 'utf8'))
const teoria = tema.secciones?.[0]?.contenido
if (!teoria || teoria.length < 200) { console.error(`tema-${temaId}: no tiene teoría generada (ejecuta sp-gen-teoria.mjs primero)`); process.exit(1) }

if (force) tema.preguntas = []
if (tema.preguntas.length >= 100) { console.log(`tema-${temaId}: ya tiene ${tema.preguntas.length} preguntas`); process.exit(0) }
if (tema.preguntas.length % 10 !== 0) { console.error(`tema-${temaId}: ${tema.preguntas.length} preguntas no es múltiplo de 10, revisa manualmente`); process.exit(1) }

function extraerJSON(t) {
  t = (t || '').trim().replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim()
  const i = t.indexOf('{'), j = t.lastIndexOf('}')
  if (i < 0 || j < 0) return null
  try { return JSON.parse(t.slice(i, j + 1)) } catch { return null }
}
const sinDup = o => new Set(o.map(x => (x || '').toString().trim().toLowerCase())).size === o.length
const validP = it => Array.isArray(it) && it.length === 10 && it.every(q =>
  q && typeof q.enunciado === 'string' && q.enunciado.trim().length >= 15 &&
  Array.isArray(q.opciones) && q.opciones.length === 4 && q.opciones.every(x => (x || '').toString().trim()) && sinDup(q.opciones) &&
  typeof q.respuestaCorrecta === 'number' && q.respuestaCorrecta >= 0 && q.respuestaCorrecta <= 3 &&
  typeof q.explicacion === 'string' && q.explicacion.trim().length >= 20)

function normalizar(s) {
  return String(s ?? '').toLowerCase().trim()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ').replace(/[¿?¡!.,]/g, '')
}

function prompt(titulo, teoria, previos, numDificiles) {
  const listaPrevios = previos.length
    ? `\n\nPreguntas YA GENERADAS para este tema (NO repitas, ni parafrasees, ni reformules ninguna de estas con otras palabras — deben cubrir un subtema o ángulo que NINGUNA de ellas cubre):\n${previos.map((e, i) => `${i + 1}. ${e}`).join('\n')}`
    : ''
  return `Eres preparador para el examen CompTIA Security+ SY0-701. A partir EXCLUSIVAMENTE del siguiente temario en español, tema "${titulo}", genera 10 preguntas tipo test NUEVAS y distintas entre sí.
Devuelve SOLO JSON: { "preguntas": [{ "enunciado": "...", "opciones": ["a","b","c","d"], "respuestaCorrecta": 0, "explicacion": "..." }] }
Reglas: exactamente 10 preguntas, 4 opciones cada una (una correcta, índice 0-3), explicación de 1-2 frases citando el concepto del temario. ${numDificiles} de las 10 deben ser de dificultad alta (escenarios aplicados, distractores plausibles); el resto de dificultad normal (conceptos directos). Usa SOLO información del temario. No inventes datos que no estén ahí. Español.
Varía el FORMATO de pregunta dentro del batch: definición directa, comparación entre dos conceptos, "¿cuál de los siguientes NO es...?", escenario aplicado, identificar el concepto a partir de un ejemplo, etc. No repitas el mismo patrón de enunciado dos veces en este batch.${listaPrevios}
TEMARIO:
${teoria}`
}

function promptReemplazo(titulo, teoria, previos, dificil) {
  return `Eres preparador para el examen CompTIA Security+ SY0-701. A partir EXCLUSIVAMENTE del siguiente temario en español, tema "${titulo}", genera EXACTAMENTE 1 pregunta tipo test NUEVA, de dificultad ${dificil ? 'alta (escenario aplicado)' : 'normal (concepto directo)'}.
Devuelve SOLO JSON: { "preguntas": [{ "enunciado": "...", "opciones": ["a","b","c","d"], "respuestaCorrecta": 0, "explicacion": "..." }] }
Debe tener 4 opciones (una correcta, índice 0-3) y explicación de 1-2 frases. Usa SOLO información del temario. Español.
Esta pregunta debe ser sobre un subtema o ángulo que NINGUNA de las siguientes preguntas ya generadas cubre — no la repitas ni la parafrasees:\n${previos.map((e, i) => `${i + 1}. ${e}`).join('\n')}
TEMARIO:
${teoria}`
}

// Para prompts muy largos (temas con >40 preguntas previas), usa una muestra representativa
// en vez de la lista completa: las 20 más recientes + una muestra distribuida de las antiguas.
function muestraPrevios(previos, max = 40) {
  if (previos.length <= max) return previos
  const recientes = previos.slice(-20)
  const resto = previos.slice(0, -20)
  const paso = Math.ceil(resto.length / (max - 20))
  const muestraResto = resto.filter((_, i) => i % paso === 0)
  return [...muestraResto, ...recientes]
}

async function generarReemplazo(titulo, teoria, previosCompletos, dificil) {
  const previos = muestraPrevios(previosCompletos)
  for (let i = 1; i <= 8; i++) {
    const body = { model: MODEL, messages: [{ role: 'user', content: promptReemplazo(titulo, teoria, previos, dificil) }], temperature: Math.min(0.5 + i * 0.08, 1), max_tokens: 700, response_format: { type: 'json_object' } }
    const ctrl = new AbortController(); const to = setTimeout(() => ctrl.abort(), 60000)
    try {
      const r = await fetch(MISTRAL_URL, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${KEY}` }, body: JSON.stringify(body), signal: ctrl.signal })
      clearTimeout(to)
      if (r.status === 429) { await new Promise(s => setTimeout(s, 6000 * i)); continue }
      if (!r.ok) continue
      const d = await r.json(); const p = extraerJSON(d?.choices?.[0]?.message?.content)
      const q = p?.preguntas?.[0]
      if (q && typeof q.enunciado === 'string' && q.enunciado.trim().length >= 15 &&
        Array.isArray(q.opciones) && q.opciones.length === 4 && q.opciones.every(x => (x || '').toString().trim()) && sinDup(q.opciones) &&
        typeof q.respuestaCorrecta === 'number' && q.respuestaCorrecta >= 0 && q.respuestaCorrecta <= 3 &&
        typeof q.explicacion === 'string' && q.explicacion.trim().length >= 20 &&
        !previosCompletos.some(e => normalizar(e) === normalizar(q.enunciado))) {
        return q
      }
    } catch (e) { clearTimeout(to) }
    await new Promise(s => setTimeout(s, 1500))
  }
  return null
}

async function generarBatch(titulo, teoria, previos, numDificiles) {
  const body = { model: MODEL, messages: [{ role: 'user', content: prompt(titulo, teoria, previos, numDificiles) }], temperature: 0.4, max_tokens: 2600, response_format: { type: 'json_object' } }
  for (let i = 1; i <= 3; i++) {
    const ctrl = new AbortController(); const to = setTimeout(() => ctrl.abort(), 90000)
    try {
      const r = await fetch(MISTRAL_URL, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${KEY}` }, body: JSON.stringify(body), signal: ctrl.signal })
      clearTimeout(to)
      if (r.status === 429) { const w = 8000 * i; console.log(`    429, espero ${w}ms…`); await new Promise(s => setTimeout(s, w)); continue }
      if (!r.ok) { console.error('    Mistral', r.status, (await r.text()).slice(0, 200)); continue }
      const d = await r.json(); const p = extraerJSON(d?.choices?.[0]?.message?.content)
      if (p && validP(p.preguntas)) return p.preguntas
      console.log('    respuesta no válida, reintento…')
    } catch (e) { clearTimeout(to); console.error('    error', String(e.message || e)) }
    await new Promise(s => setTimeout(s, 2000))
  }
  return null
}

const desdeBatch = tema.preguntas.length / 10
let normalSeq = tema.preguntas.filter(q => q.dificultad === 'normal').length
let dificilSeq = tema.preguntas.filter(q => q.dificultad === 'dificil').length

for (let b = desdeBatch; b < 10; b++) {
  const previos = muestraPrevios(tema.preguntas.map(q => q.enunciado))
  console.log(`[tema-${temaId}] batch ${b + 1}/10 (${tema.preguntas.length} preguntas hasta ahora)…`)
  const nuevas = await generarBatch(tema.titulo, teoria, previos, 2)
  if (!nuevas) { console.error(`[tema-${temaId}] FALLO en batch ${b + 1}, aborto (progreso guardado: ${tema.preguntas.length} preguntas)`); process.exit(1) }

  // primeras 8 = normal, últimas 2 = dificil (el prompt pide 2 difíciles de 10)
  const vistos = new Set(tema.preguntas.map(q => normalizar(q.enunciado)))
  const enunciadosVistos = tema.preguntas.map(q => q.enunciado)
  for (let i = 0; i < nuevas.length; i++) {
    let q = nuevas[i]
    const dificil = i >= 8
    let clave = normalizar(q.enunciado)
    if (vistos.has(clave)) {
      console.log(`    dup detectado, regenerando reemplazo (${dificil ? 'dificil' : 'normal'})…`)
      const reemplazo = await generarReemplazo(tema.titulo, teoria, enunciadosVistos, dificil)
      if (!reemplazo) { console.error(`[tema-${temaId}] no se pudo generar reemplazo único, aborto (progreso guardado: ${tema.preguntas.length} preguntas)`); process.exit(1) }
      q = reemplazo
      clave = normalizar(q.enunciado)
    }
    vistos.add(clave)
    enunciadosVistos.push(q.enunciado)
    if (dificil) { dificilSeq++; q.id = `p${temaId}-D${String(dificilSeq).padStart(2, '0')}` }
    else { normalSeq++; q.id = `p${temaId}-${String(normalSeq).padStart(2, '0')}` }
    q.dificultad = dificil ? 'dificil' : 'normal'
    nuevas[i] = q
  }
  tema.preguntas.push(...nuevas)
  writeFileSync(rutaTema, JSON.stringify(tema, null, 2), 'utf8')
  console.log(`  OK, total=${tema.preguntas.length}`)
  if (b < 9) await new Promise(s => setTimeout(s, 15000))
}

console.log(`[tema-${temaId}] completo: ${tema.preguntas.length} preguntas`)
