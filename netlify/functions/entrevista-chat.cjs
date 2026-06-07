// netlify/functions/entrevista-chat.cjs
// Entrenador de entrevista personal de oposición (Groq). Turnos + informe final.

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const MODEL = 'llama-3.3-70b-versatile'
const MEMORIA_MENSAJES = 12
const MAX_MENSAJES = 60
const MAX_CONTENIDO_CHARS = 8000

const NOMBRES_CUERPO = {
  'cgpc': 'CGPC — Cuerpo General de la Policía Canaria',
  'policia-local': 'Policía Local',
}

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

function buildSystemPrompt(opts) {
  const o = opts || {}
  const cuerpo = NOMBRES_CUERPO[o.cuerpo] || o.cuerpo || 'la oposición'
  const examen = o.modo === 'examen'
  return `Eres un miembro de un tribunal de oposición a ${cuerpo} y, a la vez, un ENTRENADOR que prepara al candidato para APROBAR la entrevista personal real. Conduces una entrevista por turnos. Responde en español.

${examen
  ? 'MODO EXAMEN: encadena preguntas con feedback mínimo para simular presión real. Reserva el análisis para el informe final.'
  : 'MODO PRÁCTICA: en cada turno (1) da feedback breve y constructivo de la última respuesta —un punto fuerte + 1 mejora concreta—, valorando estructura, contenido y lo que busca el tribunal; en preguntas situacionales evalúa y enseña el método STAR (Situación, Tarea, Acción, Resultado); si la respuesta es floja, incluye una versión modelo mejorada. (2) Formula la siguiente pregunta (una sola).'}

A lo largo de la sesión cubre: motivación, autoconocimiento, valores del servicio público e integridad, gestión de estrés y conflictos, trabajo en equipo, conocimiento del puesto. Repregunta para profundizar cuando proceda. Tono profesional y cercano. Nunca pongas nota numérica. ${examen ? '' : 'Recuerda siempre el método STAR cuando sea relevante.'}

Si el último mensaje del usuario es exactamente "[GENERAR_INFORME]", NO hagas más preguntas: redacta un INFORME DE ENTRENAMIENTO con tres secciones: "Fortalezas", "Áreas a mejorar (priorizadas)" y "Consejos para la entrevista real" (3-4 consejos concretos).`
}

const { comprobarLimite } = require('./_ratelimit.cjs')

exports.handler = async function (event) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: corsHeaders(event), body: '' }
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: corsHeaders(event), body: JSON.stringify({ error: 'Method Not Allowed' }) }
  if (!process.env.GROQ_API_KEY) return { statusCode: 500, headers: corsHeaders(event), body: JSON.stringify({ error: 'GROQ_API_KEY no configurada en el servidor' }) }
  const limite = await comprobarLimite(event, { clave: 'entrevista', max: 20, ventanaSeg: 60 })
  if (!limite.permitido) return { statusCode: 429, headers: { ...corsHeaders(event), 'Retry-After': String(limite.resetSeg) }, body: JSON.stringify({ error: 'Demasiadas peticiones, espera un momento.' }) }
  if (typeof fetch !== 'function') return { statusCode: 500, headers: corsHeaders(event), body: JSON.stringify({ error: 'Runtime sin fetch global (Node < 18)' }) }

  let payload
  try { payload = JSON.parse(event.body || '{}') } catch { return { statusCode: 400, headers: corsHeaders(event), body: JSON.stringify({ error: 'JSON invalido' }) } }
  const { messages, cuerpo, modo } = payload
  const err = validarMensajes(messages)
  if (err) return { statusCode: 400, headers: corsHeaders(event), body: JSON.stringify({ error: err }) }

  const recientes = messages.slice(-MEMORIA_MENSAJES)
  const groqBody = {
    model: MODEL,
    messages: [{ role: 'system', content: buildSystemPrompt({ cuerpo, modo }) }, ...recientes],
    temperature: 0.6,
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
  } catch (e) {
    const msg = e && e.name === 'AbortError' ? 'Tiempo de espera agotado contactando con Groq' : String(e && e.message ? e.message : e)
    return { statusCode: 502, headers: corsHeaders(event), body: JSON.stringify({ error: 'Error contactando con Groq', detail: msg }) }
  } finally {
    clearTimeout(timeout)
  }
}

exports.buildSystemPrompt = buildSystemPrompt
exports.validarMensajes = validarMensajes
