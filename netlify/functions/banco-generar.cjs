// netlify/functions/banco-generar.cjs
// P2.1 Banco inteligente: genera BORRADORES de preguntas con Mistral y los inserta
// en banco_preguntas con estado='borrador'. NUNCA crea preguntas 'activa': el
// paso borrador -> revisada -> activa es manual/auditado (regla dura). Endpoint
// de administración: requiere el secreto BANCO_GENERAR_SECRET (fail-closed).
//
// Env requeridas: MISTRAL_API_KEY, VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
//                 BANCO_GENERAR_SECRET.

const MISTRAL_URL = 'https://api.mistral.ai/v1/chat/completions'
const MODEL = 'mistral-small-latest'

function resolverOrigen(event) {
  const env = (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean)
  const permitidas = env.length ? env : ['http://localhost:3000', 'http://localhost:8888', 'https://opodam.netlify.app']
  const origin = (event && event.headers && (event.headers.origin || event.headers.Origin)) || ''
  return permitidas.includes(origin) ? origin : permitidas[0]
}
function corsHeaders(event) {
  return {
    'Access-Control-Allow-Origin': resolverOrigen(event),
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-banco-secret',
    'Vary': 'Origin',
    'Content-Type': 'application/json',
  }
}

function buildPrompt(p) {
  return `Genera ${p.n} preguntas tipo test NUEVAS para el tema "${p.titulo}" de una oposición en España, basándote EXCLUSIVAMENTE en el TEMARIO de abajo.
Devuelve SOLO JSON: { "preguntas": [{ "enunciado": "...", "opciones": ["a","b","c","d"], "respuestaCorrecta": 0, "explicacion": "..." }] }.
Reglas: 4 opciones por pregunta; respuestaCorrecta es el índice 0-3 de la opción correcta; explicación breve citando el temario; NO inventes datos que no estén en el temario; español.
TEMARIO:
${(p.contexto || '').slice(0, 7000)}`
}

function extraerJSON(texto) {
  const t = (texto || '').trim().replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim()
  const i = t.indexOf('{'); const j = t.lastIndexOf('}')
  if (i < 0 || j < 0) return null
  try { return JSON.parse(t.slice(i, j + 1)) } catch { return null }
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

async function insertarBorradores(filas) {
  const url = process.env.VITE_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return { ok: false, status: 500, error: 'Supabase no configurado' }
  const r = await fetch(`${url}/rest/v1/banco_preguntas`, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify(filas),
  })
  const text = await r.text()
  return { ok: r.ok, status: r.status, data: text ? JSON.parse(text) : null }
}

const { comprobarLimite } = require('./_ratelimit.cjs')

exports.handler = async function (event) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: corsHeaders(event), body: '' }
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: corsHeaders(event), body: JSON.stringify({ error: 'Method Not Allowed' }) }
  if (!process.env.MISTRAL_API_KEY) return { statusCode: 500, headers: corsHeaders(event), body: JSON.stringify({ error: 'MISTRAL_API_KEY no configurada' }) }

  // Fail-closed: sin secreto configurado, el endpoint queda cerrado.
  const secreto = process.env.BANCO_GENERAR_SECRET
  if (!secreto) return { statusCode: 503, headers: corsHeaders(event), body: JSON.stringify({ error: 'Endpoint deshabilitado (falta BANCO_GENERAR_SECRET)' }) }
  const enviado = (event.headers && (event.headers['x-banco-secret'] || event.headers['X-Banco-Secret'])) || ''
  if (enviado !== secreto) return { statusCode: 401, headers: corsHeaders(event), body: JSON.stringify({ error: 'No autorizado' }) }

  const limite = await comprobarLimite(event, { clave: 'banco-generar', max: 6, ventanaSeg: 60 })
  if (!limite.permitido) return { statusCode: 429, headers: { ...corsHeaders(event), 'Retry-After': String(limite.resetSeg) }, body: JSON.stringify({ error: 'Demasiadas peticiones, espera un momento.' }) }

  let payload
  try { payload = JSON.parse(event.body || '{}') } catch { return { statusCode: 400, headers: corsHeaders(event), body: JSON.stringify({ error: 'JSON invalido' }) } }
  const slug = typeof payload.slug === 'string' ? payload.slug.trim() : ''
  const temaId = Number(payload.temaId)
  const titulo = typeof payload.titulo === 'string' ? payload.titulo.slice(0, 200) : ''
  const n = Math.min(Math.max(Number(payload.n) || 10, 1), 15)
  if (!slug || !Number.isInteger(temaId) || !payload.contexto) {
    return { statusCode: 400, headers: corsHeaders(event), body: JSON.stringify({ error: 'Faltan slug, temaId o contexto' }) }
  }

  const requestBody = {
    model: MODEL,
    messages: [{ role: 'user', content: buildPrompt({ n, titulo, contexto: payload.contexto }) }],
    temperature: 0.5,
    max_tokens: 4000,
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
    const items = parsed && parsed.preguntas
    if (!validarItems(items)) return { statusCode: 502, headers: corsHeaders(event), body: JSON.stringify({ error: 'Respuesta de IA no valida' }) }

    const filas = items.map(q => ({
      oposicion_slug: slug,
      tema_id: temaId,
      enunciado: q.enunciado,
      opciones: q.opciones,
      correcta: q.respuestaCorrecta,
      explicacion: typeof q.explicacion === 'string' ? q.explicacion : null,
      estado: 'borrador',
    }))
    const ins = await insertarBorradores(filas)
    if (!ins.ok) return { statusCode: 502, headers: corsHeaders(event), body: JSON.stringify({ error: 'No se pudieron guardar los borradores', status: ins.status }) }

    return { statusCode: 200, headers: corsHeaders(event), body: JSON.stringify({ creados: filas.length, estado: 'borrador' }) }
  } catch (err) {
    return { statusCode: 500, headers: corsHeaders(event), body: JSON.stringify({ error: err && err.name === 'AbortError' ? 'Timeout de Mistral' : 'Error interno' }) }
  } finally {
    clearTimeout(timeout)
  }
}
