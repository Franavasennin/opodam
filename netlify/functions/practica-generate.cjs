// netlify/functions/practica-generate.cjs
// Genera ítems de práctica (psicotécnicos o supuestos) bajo demanda con Mistral.
// Efímero: no persiste. Reutiliza MISTRAL_API_KEY.

const MISTRAL_URL = 'https://api.mistral.ai/v1/chat/completions'
const MODEL = 'mistral-small-latest'

function resolverOrigen(event) {
  const env = (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean)
  // Fail-closed: sin ALLOWED_ORIGINS, caer a una lista conocida (dev + prod Netlify), nunca '*'.
  const permitidas = env.length ? env : ['http://localhost:3000', 'http://localhost:8888', 'https://opodam.netlify.app']
  const origin = (event && event.headers && (event.headers.origin || event.headers.Origin)) || ''
  return permitidas.includes(origin) ? origin : permitidas[0]
}
function corsHeaders(event) {
  return {
    'Access-Control-Allow-Origin': resolverOrigen(event),
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin',
    'Content-Type': 'application/json',
  }
}

const TITULOS_CATEGORIA = {
  'series-numericas': 'series numéricas',
  'razonamiento-verbal': 'razonamiento verbal (sinónimos, antónimos, analogías)',
  'razonamiento-logico': 'razonamiento lógico y abstracto (silogismos, deducción)',
  'ortografia-calculo': 'ortografía y cálculo matemático',
  'razonamiento-mecanico': 'razonamiento mecánico descrito en texto (sin imágenes)',
}

function buildPrompt(payload) {
  const p = payload || {}
  if (p.tipo === 'tutor-test') {
    return `A partir de la DUDA del alumno y el CONTEXTO del temario, genera 4 preguntas tipo test que comprueben si ha entendido.
Devuelve SOLO JSON: { "preguntas": [{ "enunciado": "...", "opciones": ["a","b","c","d"], "respuestaCorrecta": 0, "explicacion": "..." }] }.
4 preguntas, 4 opciones, respuestaCorrecta índice 0-3, explicación breve. Solo información del CONTEXTO. Español.
DUDA: ${(p.duda || '').slice(0, 500)}
CONTEXTO:
${(p.contexto || '').slice(0, 6000)}`
  }
  if (p.tipo === 'tutor-flashcards') {
    return `A partir de la DUDA del alumno y el CONTEXTO del temario, genera 4 flashcards de repaso.
Devuelve SOLO JSON: { "flashcards": [{ "pregunta": "...", "respuesta": "..." }] }.
4 flashcards claras y concisas. Solo información del CONTEXTO. Español.
DUDA: ${(p.duda || '').slice(0, 500)}
CONTEXTO:
${(p.contexto || '').slice(0, 6000)}`
  }
  if (p.tipo === 'supuesto') {
    return `Genera un supuesto práctico de oposición para el cuerpo "${p.slug || 'policía'}", basándote EN EL TEMARIO de abajo.
Devuelve SOLO JSON: { "titulo": "...", "caso": "...", "preguntas": [{ "enunciado": "...", "opciones": ["a","b","c","d"], "respuestaCorrecta": 0, "explicacion": "..." }] }.
El "caso" es un escenario realista. Genera 10 preguntas tipo test (4 opciones, respuestaCorrecta índice 0-3). Solo información del temario. Español.
TEMARIO:
${(p.contexto || '').slice(0, 6000)}`
  }
  const cat = TITULOS_CATEGORIA[p.categoria] || 'aptitud general'
  return `Genera preguntas psicotécnicas de ${cat} para una oposición.
Devuelve SOLO JSON: { "preguntas": [{ "enunciado": "...", "opciones": ["a","b","c","d"], "respuestaCorrecta": 0, "explicacion": "..." }] }.
Genera 8 preguntas con una única opción correcta (respuestaCorrecta índice 0-3) y explicación breve. Español.`
}

function validarItems(items) {
  if (!Array.isArray(items) || items.length === 0) return false
  for (const q of items) {
    if (!q || typeof q.enunciado !== 'string') return false
    if (!Array.isArray(q.opciones) || q.opciones.length < 2) return false
    if (typeof q.respuestaCorrecta !== 'number' || q.respuestaCorrecta < 0 || q.respuestaCorrecta >= q.opciones.length) return false
  }
  return true
}

function extraerJSON(texto) {
  const t = (texto || '').trim().replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim()
  const i = t.indexOf('{'); const j = t.lastIndexOf('}')
  if (i < 0 || j < 0) return null
  try { return JSON.parse(t.slice(i, j + 1)) } catch { return null }
}

const { comprobarLimite } = require('./_ratelimit.cjs')

exports.handler = async function (event) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: corsHeaders(event), body: '' }
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: corsHeaders(event), body: JSON.stringify({ error: 'Method Not Allowed' }) }
  if (!process.env.MISTRAL_API_KEY) return { statusCode: 500, headers: corsHeaders(event), body: JSON.stringify({ error: 'MISTRAL_API_KEY no configurada en el servidor' }) }
  const limite = await comprobarLimite(event, { clave: 'practica', max: 12, ventanaSeg: 60 })
  if (!limite.permitido) return { statusCode: 429, headers: { ...corsHeaders(event), 'Retry-After': String(limite.resetSeg) }, body: JSON.stringify({ error: 'Demasiadas peticiones, espera un momento.' }) }
  if (typeof fetch !== 'function') return { statusCode: 500, headers: corsHeaders(event), body: JSON.stringify({ error: 'Runtime sin fetch global (Node < 18)' }) }

  let payload
  try { payload = JSON.parse(event.body || '{}') } catch { return { statusCode: 400, headers: corsHeaders(event), body: JSON.stringify({ error: 'JSON invalido' }) } }
  const TIPOS = ['psicotecnico', 'supuesto', 'tutor-test', 'tutor-flashcards']
  if (!TIPOS.includes(payload.tipo)) {
    return { statusCode: 400, headers: corsHeaders(event), body: JSON.stringify({ error: 'tipo invalido' }) }
  }
  if ((payload.tipo === 'tutor-test' || payload.tipo === 'tutor-flashcards') && !payload.duda) {
    return { statusCode: 400, headers: corsHeaders(event), body: JSON.stringify({ error: 'falta duda' }) }
  }

  const requestBody = {
    model: MODEL,
    messages: [{ role: 'user', content: buildPrompt(payload) }],
    temperature: 0.4,
    max_tokens: 3000,
    response_format: { type: 'json_object' },
  }
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 25000)
  try {
    const r = await fetch(MISTRAL_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.MISTRAL_API_KEY}` },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    })
    if (!r.ok) {
      const text = await r.text()
      return { statusCode: r.status, headers: corsHeaders(event), body: JSON.stringify({ error: 'Mistral error', detail: text }) }
    }
    const data = await r.json()
    const content = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content
    const parsed = extraerJSON(content)
    if (payload.tipo === 'tutor-test') {
      const items = parsed && parsed.preguntas
      if (!validarItems(items)) return { statusCode: 502, headers: corsHeaders(event), body: JSON.stringify({ error: 'Respuesta no valida' }) }
      return { statusCode: 200, headers: corsHeaders(event), body: JSON.stringify({ preguntas: items }) }
    }
    if (payload.tipo === 'tutor-flashcards') {
      const fc = parsed && parsed.flashcards
      const ok = Array.isArray(fc) && fc.length > 0 && fc.every(f => f && typeof f.pregunta === 'string' && typeof f.respuesta === 'string')
      if (!ok) return { statusCode: 502, headers: corsHeaders(event), body: JSON.stringify({ error: 'Respuesta no valida' }) }
      return { statusCode: 200, headers: corsHeaders(event), body: JSON.stringify({ flashcards: fc }) }
    }
    if (payload.tipo === 'supuesto') {
      if (!parsed || typeof parsed.caso !== 'string' || !validarItems(parsed.preguntas)) {
        return { statusCode: 502, headers: corsHeaders(event), body: JSON.stringify({ error: 'Respuesta no valida' }) }
      }
      return { statusCode: 200, headers: corsHeaders(event), body: JSON.stringify({ supuesto: parsed }) }
    }
    const items = parsed && parsed.preguntas
    if (!validarItems(items)) {
      return { statusCode: 502, headers: corsHeaders(event), body: JSON.stringify({ error: 'Respuesta no valida' }) }
    }
    return { statusCode: 200, headers: corsHeaders(event), body: JSON.stringify({ preguntas: items }) }
  } catch (err) {
    const msg = err && err.name === 'AbortError' ? 'Tiempo de espera agotado' : String(err && err.message ? err.message : err)
    return { statusCode: 502, headers: corsHeaders(event), body: JSON.stringify({ error: 'Error contactando con Mistral', detail: msg }) }
  } finally {
    clearTimeout(timeout)
  }
}

exports.buildPrompt = buildPrompt
exports.validarItems = validarItems
