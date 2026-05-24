// netlify/functions/tutor-chat.cjs
// Tutor IA: responde dudas del alumno ancladas al contenido del tema.
// Proxy a Groq Cloud. Reutiliza la variable de entorno GROQ_API_KEY.

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const MODEL = 'llama-3.3-70b-versatile'
const MEMORIA_MENSAJES = 10
const MAX_CONTEXTO_CHARS = 90000 // recorte de seguridad (cabe de sobra en 128k tokens)

function normalizarFlashcard(c) {
  return { front: c.anverso != null ? c.anverso : (c.pregunta || ''),
           back:  c.reverso != null ? c.reverso : (c.respuesta || '') }
}

function normalizarPregunta(p) {
  const idx = p.respuestaCorrecta != null ? p.respuestaCorrecta : (p.correcta != null ? p.correcta : 0)
  const opciones = Array.isArray(p.opciones) ? p.opciones : []
  return { enunciado: p.enunciado || '', correctaTexto: opciones[idx] || '' }
}

function buildSystemPrompt(contexto) {
  const c = contexto || {}
  const titulo = c.titulo || 'este tema'
  const secciones = Array.isArray(c.secciones) ? c.secciones : []
  const flashcards = Array.isArray(c.flashcards) ? c.flashcards.map(normalizarFlashcard) : []
  const preguntas = Array.isArray(c.preguntas) ? c.preguntas.map(normalizarPregunta) : []

  const teoria = secciones.map(s => `### ${s.titulo}\n${s.contenido}`).join('\n\n')
  const fcs = flashcards.map(f => `- P: ${f.front}\n  R: ${f.back}`).join('\n')
  const tests = preguntas.map(q => `- ${q.enunciado}\n  Correcta: ${q.correctaTexto}`).join('\n')

  let bloque = `## CONTENIDO DEL TEMA\n\n### Teoría\n${teoria}\n\n### Flashcards\n${fcs}\n\n### Preguntas tipo test\n${tests}`
  if (bloque.length > MAX_CONTEXTO_CHARS) bloque = bloque.slice(0, MAX_CONTEXTO_CHARS)

  return `Eres TUTOR, un profesor experto que resuelve dudas sobre el tema "${titulo}" de una oposición en España.

Responde basándote EN EL CONTENIDO DEL TEMA que aparece más abajo. Cuando la respuesta esté en el temario, cita la sección de la que proviene. Sé claro, didáctico y conciso. Responde siempre en español.

Si la duda NO está cubierta por el contenido del tema, puedes responder con tu conocimiento general, pero AVISANDO claramente al principio con esta frase exacta: "⚠️ Esto no aparece en el temario oficial de este tema:". Nunca inventes artículos, fechas ni datos como si fueran del temario.

${bloque}`
}

const MAX_MENSAJES = 40
const MAX_CONTENIDO_CHARS = 8000

// Si ALLOWED_ORIGINS está definida (lista separada por comas), solo se permite ese
// origen; si no, se mantiene '*' para no romper despliegues sin configurar.
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

// Valida que messages sea un array de turnos { role, content } razonables.
// Devuelve string con el error, o null si es válido.
function validarMensajes(messages) {
  if (!Array.isArray(messages) || messages.length === 0) return 'Falta el array de mensajes'
  if (messages.length > MAX_MENSAJES) return 'Demasiados mensajes'
  for (const m of messages) {
    if (!m || typeof m !== 'object') return 'Mensaje inválido'
    if (m.role !== 'user' && m.role !== 'assistant') return 'Rol de mensaje inválido'
    if (typeof m.content !== 'string') return 'Contenido de mensaje inválido'
    if (m.content.length > MAX_CONTENIDO_CHARS) return 'Mensaje demasiado largo'
  }
  return null
}

exports.handler = async function (event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders(event), body: '' }
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: corsHeaders(event), body: JSON.stringify({ error: 'Method Not Allowed' }) }
  }
  if (!process.env.GROQ_API_KEY) {
    return { statusCode: 500, headers: corsHeaders(event), body: JSON.stringify({ error: 'GROQ_API_KEY no configurada en el servidor' }) }
  }

  let payload
  try {
    payload = JSON.parse(event.body || '{}')
  } catch {
    return { statusCode: 400, headers: corsHeaders(event), body: JSON.stringify({ error: 'JSON invalido' }) }
  }

  const { messages, contexto } = payload
  const errMsgs = validarMensajes(messages)
  if (errMsgs) {
    return { statusCode: 400, headers: corsHeaders(event), body: JSON.stringify({ error: errMsgs }) }
  }

  if (typeof fetch !== 'function') {
    return { statusCode: 500, headers: corsHeaders(event), body: JSON.stringify({ error: 'Runtime sin fetch global (Node < 18)' }) }
  }

  const recientes = messages.slice(-MEMORIA_MENSAJES)
  const systemPrompt = buildSystemPrompt(contexto)
  const groqBody = {
    model: MODEL,
    messages: [{ role: 'system', content: systemPrompt }, ...recientes],
    temperature: 0.4,
    max_tokens: 1024,
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
    const content = (data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || ''
    return { statusCode: 200, headers: corsHeaders(event), body: JSON.stringify({ content }) }
  } catch (err) {
    const msg = err && err.name === 'AbortError'
      ? 'Tiempo de espera agotado contactando con Groq'
      : String(err && err.message ? err.message : err)
    return { statusCode: 502, headers: corsHeaders(event), body: JSON.stringify({ error: 'Error contactando con Groq', detail: msg }) }
  } finally {
    clearTimeout(timeout)
  }
}

// Exportado para tests
exports.buildSystemPrompt = buildSystemPrompt
exports.normalizarFlashcard = normalizarFlashcard
exports.normalizarPregunta = normalizarPregunta
