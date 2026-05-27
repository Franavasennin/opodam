// scripts/generate-supuestos.cjs
// Genera supuestos prácticos (caso + preguntas) desde el temario de la oposición.
// Uso: node scripts/generate-supuestos.cjs <cgpc|policia-local> [nSupuestos]

const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const MODEL = 'llama-3.1-8b-instant'

function leerKey() {
  if (process.env.GROQ_API_KEY) return process.env.GROQ_API_KEY
  return fs.readFileSync(path.join(ROOT, '.env.local'), 'utf8').match(/GROQ_API_KEY\s*=\s*(.+)/)[1].trim()
}
const KEY = leerKey()
const sleep = ms => new Promise(r => setTimeout(r, ms))
function extraerJSON(t) { const s = (t || '').trim(); const i = s.indexOf('{'); const j = s.lastIndexOf('}'); if (i < 0 || j < 0) return null; try { return JSON.parse(s.slice(i, j + 1)) } catch { return null } }

function contextoTemario(slug) {
  const dir = path.join(ROOT, 'src', 'data', 'topics', slug)
  const files = fs.readdirSync(dir).filter(f => /^tema-\d+\.json$/.test(f))
  const elegidos = files.sort(() => Math.random() - 0.5).slice(0, 3)
  let txt = ''
  for (const f of elegidos) {
    const t = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8').replace(/^﻿/, ''))
    txt += (t.secciones || []).map(s => s.contenido).join(' ') + ' '
  }
  return txt.slice(0, 6000)
}

async function llamar(prompt, maxTokens) {
  const body = { model: MODEL, messages: [{ role: 'user', content: prompt }], temperature: 0.5, max_tokens: maxTokens, response_format: { type: 'json_object' } }
  for (let i = 0; i < 4; i++) {
    const r = await fetch(GROQ_URL, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${KEY}` }, body: JSON.stringify(body) })
    if (r.status === 429) { await sleep(15000); continue }
    if (!r.ok) { await sleep(2000); continue }
    const j = await r.json()
    const d = extraerJSON(j.choices?.[0]?.message?.content)
    if (d) return d
    await sleep(1500)
  }
  return null
}

function valida(q) {
  return q && typeof q.enunciado === 'string' && Array.isArray(q.opciones) && q.opciones.length >= 2 &&
    typeof q.respuestaCorrecta === 'number' && q.respuestaCorrecta >= 0 && q.respuestaCorrecta < q.opciones.length
}

async function generarSupuesto(slug, n) {
  const ctx = contextoTemario(slug)
  const base = await llamar(`Genera un supuesto práctico de oposición (cuerpo ${slug}) basado en el TEMARIO. Devuelve SOLO JSON {"titulo":"..","caso":"..","preguntas":[{"enunciado":"..","opciones":["a","b","c","d"],"respuestaCorrecta":0,"explicacion":".."}]} con 13 preguntas. Solo info del temario. Español. TEMARIO: ${ctx}`, 4000)
  if (!base || !base.caso || !Array.isArray(base.preguntas)) return null
  const extra = await llamar(`Para este CASO de oposición (${slug}): "${base.caso}". Genera 12 preguntas MÁS tipo test (distintas). SOLO JSON {"preguntas":[{"enunciado":"..","opciones":["a","b","c","d"],"respuestaCorrecta":0,"explicacion":".."}]}. Español.`, 4000)
  const todas = [...base.preguntas, ...((extra && extra.preguntas) || [])].filter(valida)
  if (!todas.length) return null
  const prefijo = slug === 'cgpc' ? 'sup-cgpc' : 'sup-pl'
  return {
    id: `${prefijo}-${String(n).padStart(2, '0')}`,
    titulo: base.titulo || `Supuesto ${n}`,
    caso: base.caso,
    preguntas: todas.map((q, i) => ({ id: `${prefijo}-${String(n).padStart(2, '0')}-p${String(i + 1).padStart(2, '0')}`, enunciado: q.enunciado, opciones: q.opciones, respuestaCorrecta: q.respuestaCorrecta, explicacion: q.explicacion || '' })),
  }
}

async function run(slug, total) {
  const dir = path.join(ROOT, 'src', 'data', 'supuestos', slug)
  fs.mkdirSync(dir, { recursive: true })
  const metas = []
  for (let n = 1; n <= total; n++) {
    const s = await generarSupuesto(slug, n)
    if (!s) { console.log(slug, 'supuesto', n, 'FALLO'); continue }
    fs.writeFileSync(path.join(dir, `supuesto-${String(n).padStart(2, '0')}.json`), JSON.stringify(s, null, 2) + '\n', 'utf8')
    metas.push({ id: s.id, titulo: s.titulo })
    console.log(slug, s.id, s.preguntas.length, 'preguntas')
    await sleep(7000)
  }
  const idxPath = path.join(dir, 'index.ts')
  if (fs.existsSync(idxPath) && metas.length) {
    let src = fs.readFileSync(idxPath, 'utf8')
    const arr = 'export const SUPUESTOS_META = [\n' + metas.map(m => `  { id: ${JSON.stringify(m.id)}, titulo: ${JSON.stringify(m.titulo)} },`).join('\n') + '\n] as const;'
    src = src.replace(/export const SUPUESTOS_META = \[[\s\S]*?\] as const;/, arr)
    fs.writeFileSync(idxPath, src, 'utf8')
    console.log(slug, 'index.ts SUPUESTOS_META regenerado:', metas.length)
  }
}

run(process.argv[2], Number(process.argv[3]) || 3)
