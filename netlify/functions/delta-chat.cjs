// netlify/functions/delta-chat.js
// Proxy a la API de Groq Cloud para el agente DELTA (oposiciones físicas).
// Requiere la variable de entorno GROQ_API_KEY en Netlify.

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const MODEL = 'llama-3.3-70b-versatile'
const MEMORIA_MENSAJES = 20

const BAREMOS = {
  guardia_civil: {
    pruebas: ['Course navette (paliers)', 'Flexiones de brazos (1 min)', 'Abdominales (1 min)', 'Salto horizontal sin impulso', 'Velocidad 50m lisos'],
    minimos: { hombre: 'Navette ≥8.3 | Flexiones ≥16 | Abs ≥22 | Salto ≥170cm | 50m ≤8.5s', mujer: 'Navette ≥6.1 | Flexiones ≥7 | Abs ≥18 | Salto ≥130cm | 50m ≤10.0s' },
  },
  policia_nacional: {
    pruebas: ['Course navette (paliers)', 'Flexiones de brazos (1 min)', 'Abdominales (1 min)', 'Salto vertical (Abalakov)', 'Natación 50m estilo libre'],
    minimos: { hombre: 'Navette ≥7.8 | Flexiones ≥14 | Abs ≥20 | Salto ≥36cm | Natación ≤60s', mujer: 'Navette ≥5.7 | Flexiones ≥6 | Abs ≥16 | Salto ≥26cm | Natación ≤70s' },
  },
  policia_local: {
    pruebas: ['Course navette o 1000m', 'Flexiones de brazos', 'Abdominales (1 min)', 'Salto vertical o horizontal', 'Natación 25-50m (algunos municipios)'],
    minimos: { hombre: 'Variable según municipio — Navette ≈7.0 | Flexiones ≈14 | Abs ≈20', mujer: 'Variable según municipio — Navette ≈5.0 | Flexiones ≈6 | Abs ≈16' },
  },
  cgpc: {
    pruebas: ['Course navette', 'Flexiones de brazos (1 min)', 'Abdominales (1 min)', 'Salto horizontal', 'Velocidad 50m'],
    minimos: { hombre: 'Navette ≥7.5 | Flexiones ≥15 | Abs ≥20 | Salto ≥160cm | 50m ≤8.7s', mujer: 'Navette ≥5.5 | Flexiones ≥7 | Abs ≥17 | Salto ≥125cm | 50m ≤10.2s' },
  },
  fuerzas_armadas: {
    pruebas: ['Course navette o 1000m', 'Flexiones de brazos (2 min)', 'Abdominales (2 min)', 'Salto vertical', 'Velocidad 60m'],
    minimos: { hombre: 'Navette ≥8.1 | Flexiones ≥22 | Abs ≥25 | 60m ≤9.5s', mujer: 'Navette ≥5.8 | Flexiones ≥8 | Abs ≥20 | 60m ≤11.5s' },
  },
  bomberos: {
    pruebas: ['Carrera 1000m o 2000m', 'Flexiones de brazos', 'Abdominales', 'Trepa de cuerda 6m', 'Salto horizontal'],
    minimos: { hombre: 'Variable según ayuntamiento — Trepa cuerda sin piernas obligatoria en muchos casos', mujer: 'Variable según convocatoria' },
  },
}

const NOMBRES_CUERPO = {
  guardia_civil: 'Guardia Civil',
  policia_nacional: 'Policía Nacional',
  policia_local: 'Policía Local',
  cgpc: 'CGPC — Cuerpo General de la Policía Canaria',
  fuerzas_armadas: 'Fuerzas Armadas',
  bomberos: 'Bomberos',
}

function detectarCuerpo(profile) {
  if (profile && profile.cuerpo && BAREMOS[profile.cuerpo]) return profile.cuerpo
  const raw = ((profile && profile.goal) || '').toLowerCase() + ' ' + ((profile && profile.extra_context) || '').toLowerCase()
  if (raw.includes('policia local') || raw.includes('policía local')) return 'policia_local'
  if (raw.includes('cgpc') || raw.includes('policia canaria') || raw.includes('policía canaria')) return 'cgpc'
  if (raw.includes('policia nacional') || raw.includes('policía nacional') || raw.includes('cnp')) return 'policia_nacional'
  if (raw.includes('fuerzas armadas') || raw.includes('ejercito') || raw.includes('ejército') || raw.includes('militar')) return 'fuerzas_armadas'
  if (raw.includes('bombero')) return 'bomberos'
  return 'guardia_civil'
}

function buildSystemPrompt(profile) {
  const p = profile || {}
  const name = p.name || 'opositor'
  const level = p.level === 'beginner' ? 'principiante' : p.level === 'intermediate' ? 'intermedio' : p.level === 'advanced' ? 'avanzado' : 'no especificado'
  const weekly_days = p.weekly_days || '3-4'
  const equipment = p.equipment === 'full_gym' ? 'gym completo + pista/parque' : p.equipment === 'home' ? 'entrenamiento al aire libre / mínimo equipamiento' : (p.equipment || 'mixto')
  const injuries = p.injuries || ''
  const target_date = p.target_date || ''
  const extra_context = p.extra_context || ''

  const cuerpo = detectarCuerpo(p)
  const baremo = BAREMOS[cuerpo]
  // El objetivo se deriva del cuerpo detectado (el formulario manda `cuerpo`, no `goal`).
  const goal = p.goal || NOMBRES_CUERPO[cuerpo] || 'la oposición elegida'

  return `Eres DELTA, el preparador físico especializado en oposiciones de ${name}.

## Tu identidad y metodología
Eres el preparador de referencia para pruebas físicas de oposiciones en España. Conoces al detalle los baremos, pruebas, tiempos mínimos y criterios de evaluación de todos los cuerpos de seguridad y emergencias: Guardia Civil, Policía Nacional, Policías Locales (incluido el Cuerpo General de la Policía Canaria — CGPC), Fuerzas Armadas, Bomberos y oposiciones autonómicas.

Tu enfoque es 100% orientado a resultados medibles: el objetivo no es "ponerse en forma", es superar un baremo concreto en una fecha concreta. Cada semana de entrenamiento existe para mejorar una marca específica.

IMPORTANTE: El opositor se prepara EXCLUSIVAMENTE para ${goal}. No asumas ni menciones otro cuerpo (por ejemplo, NO hables de Guardia Civil salvo que sea ese su objetivo). Usa siempre los baremos y pruebas de ${goal} que se indican abajo.

## Perfil del opositor
- Nombre: ${name}
- Nivel físico actual: ${level}
- Cuerpo/Oposición objetivo: ${goal}
- Días disponibles por semana: ${weekly_days}
- Equipamiento: ${equipment}
${injuries ? `- Lesiones o limitaciones: ${injuries}` : ''}
${target_date ? `- Fecha del examen físico: ${target_date}` : '- Fecha del examen: pendiente de confirmar'}
${extra_context ? `- Contexto adicional: ${extra_context}` : ''}

## Baremos de referencia — ${cuerpo.replace('_', ' ').toUpperCase()}
Pruebas: ${baremo.pruebas.join(' | ')}
Mínimos hombre: ${baremo.minimos.hombre}
Mínimos mujer: ${baremo.minimos.mujer}

## Cómo te comportas
1. **Orientación al baremo**: Cada entrenamiento tiene un propósito vinculado a una prueba específica. Nunca entrenas por entrenar.
2. **Cuenta atrás real**: Si hay fecha de examen, gestionas el plan como una cuenta atrás. Semanas restantes, fases de preparación, tapering final.
3. **Picos de forma**: Sabes cuándo hay que apretar y cuándo recuperar. El opositor tiene que llegar al día del examen en su mejor momento, no agotado.
4. **Especificidad máxima**: Entrenas exactamente las pruebas del baremo, en las condiciones del baremo.
5. **Honestidad sobre marcas**: Si las marcas actuales no llegan al mínimo en X semanas, lo dices claramente y propones qué hacer.

## Áreas de expertise
Course Navette, flexiones reglamentarias, abdominales reglamentarios, velocidad 50-60m, resistencia (1000m, 2000m), natación 50m, trepa de cuerda, salto horizontal/vertical, periodización para opositor, gestión del nerviosismo pre-examen.

## Modo gym
Cuando el opositor te pida una sesión activa, responde con respuestas cortas y prácticas (≤150 tokens). Cuando pida planificación o explicación, puedes ser más extenso.

## Límites profesionales
No sustituyes a un médico deportivo. Si hay dolor articular, molestias cardíacas o síntomas anómalos, remites al profesional sanitario.

## Tono
Metódico. Orientado a datos y marcas. Empático con la presión que supone una oposición, pero nunca condescendiente. Dices la verdad sobre las marcas aunque sea difícil de escuchar.

Responde siempre en español.`
}

const MAX_MENSAJES = 40
const MAX_CONTENIDO_CHARS = 8000

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

  const { messages, profile } = payload
  const errMsgs = validarMensajes(messages)
  if (errMsgs) {
    return { statusCode: 400, headers: corsHeaders(event), body: JSON.stringify({ error: errMsgs }) }
  }

  const recientes = messages.slice(-MEMORIA_MENSAJES)
  const systemPrompt = buildSystemPrompt(profile)
  const groqBody = {
    model: MODEL,
    messages: [{ role: 'system', content: systemPrompt }, ...recientes],
    temperature: 0.6,
    max_tokens: 1024,
  }

  if (typeof fetch !== 'function') {
    return { statusCode: 500, headers: corsHeaders(event), body: JSON.stringify({ error: 'Runtime sin fetch global (Node < 18)' }) }
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 25000)
  try {
    const r = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
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
