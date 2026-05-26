// netlify/functions/practica-generate.cjs
// Genera ítems de práctica (psicotécnicos o supuestos) bajo demanda con Groq.
// Efímero: no persiste. Reutiliza GROQ_API_KEY.

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const MODEL = 'llama-3.1-8b-instant'

function resolverOrigen(event) {
  const permitidas = (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean)
  if (permitidas.length === 0) return '*'
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

exports.handler = async function (event) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: corsHeaders(event), body: '' }
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: corsHeaders(event), body: JSON.stringify({ error: 'Method Not Allowed' }) }
  if (!process.env.GROQ_API_KEY) return { statusCode: 500, headers: corsHeaders(event), body: JSON.stringify({ error: 'GROQ_API_KEY no configurada en el servidor' }) }
  if (typeof fetch !== 'function') return { statusCode: 500, headers: corsHeaders(event), body: JSON.stringify({ error: 'Runtime sin fetch global (Node < 18)' }) }

  let payload
  try { payload = JSON.parse(event.body || '{}') } catch { return { statusCode: 400, headers: corsHeaders(event), body: JSON.stringify({ error: 'JSON invalido' }) } }
  if (payload.tipo !== 'psicotecnico' && payload.tipo !== 'supuesto') {
    return { statusCode: 400, headers: corsHeaders(event), body: JSON.stringify({ error: 'tipo invalido' }) }
  }

  const groqBody = {
    model: MODEL,
    messages: [{ role: 'user', content: buildPrompt(payload) }],
    temperature: 0.4,
    max_tokens: 3000,
    response_format: { type: 'json_object' },
  }
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 25000)
  try {
    const r = await fetch(GROQ_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
      body: JSON.stringify(groqBody),
      signal: controller.signal,
    })
    if (!r.ok) {
      const text = await r.text()
      return { statusCode: r.status, headers: corsHeaders(event), body: JSON.stringify({ error: 'Groq error', detail: text }) }
    }
    const data = await r.json()
    const content = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content
    const parsed = extraerJSON(content)
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
    return { statusCode: 502, headers: corsHeaders(event), body: JSON.stringify({ error: 'Error contactando con Groq', detail: msg }) }
  } finally {
    clearTimeout(timeout)
  }
}

exports.buildPrompt = buildPrompt
exports.validarItems = validarItems
