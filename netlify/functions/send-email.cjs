// netlify/functions/send-email.cjs
// Envía emails transaccionales y de marketing via SendGrid.
// Uso: POST { tipo, to, data }
//
// Tipos soportados:
//   'bienvenida'       — nuevo usuario registrado
//   'pago-confirmado'  — suscripción Stripe activada
//   'racha-rota'       — usuario sin actividad > N días
//   'convocatoria'     — nueva convocatoria detectada en BOE/BOC
//
// Variables de entorno requeridas:
//   SENDGRID_API_KEY
//   SENDGRID_FROM     (ej. noreply@opodam.es)

const sgMail = require('@sendgrid/mail')
const crypto = require('crypto')
const { comprobarLimite } = require('./_ratelimit.cjs')

const API_KEY = process.env.SENDGRID_API_KEY
const FROM    = process.env.SENDGRID_FROM || 'noreply@opodam.es'
const APP_URL = process.env.URL || 'https://opodam.netlify.app'
const SEND_EMAIL_SECRET = process.env.SEND_EMAIL_SECRET

// Compara el secreto en tiempo constante. Sin secreto configurado → denegar (fail-closed).
function secretoValido(event) {
  if (!SEND_EMAIL_SECRET) return false
  const provided = event.headers['x-send-email-secret'] || event.headers['X-Send-Email-Secret'] || ''
  const a = Buffer.from(String(provided))
  const b = Buffer.from(String(SEND_EMAIL_SECRET))
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(a, b)
}

function corsHeaders() {
  const allowed = (process.env.ALLOWED_ORIGINS || APP_URL).split(',').map(s => s.trim())
  return {
    'Access-Control-Allow-Origin': allowed[0] ?? '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
  }
}

// ── Templates ─────────────────────────────────────────────────────

function templateBienvenida({ nombre, oposicion }) {
  return {
    subject: `¡Bienvenido a OpoDAM, ${nombre || 'opositor'}!`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:auto;padding:32px 24px">
        <h2 style="color:#B45309">¡Hola${nombre ? `, ${nombre}` : ''}! 👋</h2>
        <p>Ya tienes acceso a tu preparación de <strong>${oposicion || 'oposiciones'}</strong> en OpoDAM.</p>
        <p>Tienes disponible:</p>
        <ul>
          <li>📚 Temario estructurado</li>
          <li>📝 Tests y simulacros</li>
          <li>🃏 Flashcards de repaso</li>
          <li>🧠 Tutor IA con todo el temario</li>
        </ul>
        <a href="${APP_URL}/mis-oposiciones"
          style="display:inline-block;margin-top:16px;padding:12px 28px;background:#B45309;color:#fff;border-radius:10px;text-decoration:none;font-weight:600">
          Ir a estudiar →
        </a>
        <p style="margin-top:32px;font-size:12px;color:#999">OpoDAM · Canarias</p>
      </div>
    `,
  }
}

function templatePagoConfirmado({ oposicion, importe }) {
  return {
    subject: `Suscripción activada — ${oposicion || 'OpoDAM'}`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:auto;padding:32px 24px">
        <h2 style="color:#B45309">✅ Suscripción activa</h2>
        <p>Tu acceso a <strong>${oposicion || 'OpoDAM'}</strong> ha sido activado correctamente.</p>
        ${importe ? `<p>Importe: <strong>${importe}</strong>/mes</p>` : ''}
        <a href="${APP_URL}/mis-oposiciones"
          style="display:inline-block;margin-top:16px;padding:12px 28px;background:#B45309;color:#fff;border-radius:10px;text-decoration:none;font-weight:600">
          Empezar a estudiar →
        </a>
        <p style="margin-top:32px;font-size:12px;color:#999">Puedes cancelar en cualquier momento desde tu perfil.</p>
      </div>
    `,
  }
}

function templateRachaRota({ dias, oposicion }) {
  return {
    subject: `Llevas ${dias || 'varios'} días sin estudiar — ¡vuelve!`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:auto;padding:32px 24px">
        <h2 style="color:#B45309">⏰ La constancia marca la diferencia</h2>
        <p>Llevas <strong>${dias || 'varios'} días</strong> sin abrir ${oposicion ? `tu preparación de <strong>${oposicion}</strong>` : 'OpoDAM'}.</p>
        <p>Solo 20 minutos al día son suficientes para mantener el ritmo. ¿Retomamos?</p>
        <a href="${APP_URL}/mis-oposiciones"
          style="display:inline-block;margin-top:16px;padding:12px 28px;background:#B45309;color:#fff;border-radius:10px;text-decoration:none;font-weight:600">
          Retomar preparación →
        </a>
      </div>
    `,
  }
}

function templateConvocatoria({ cuerpo, tituloBoletín, urlBoletín }) {
  return {
    subject: `📣 Nueva convocatoria — ${cuerpo || 'tu oposición'}`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:auto;padding:32px 24px">
        <h2 style="color:#B45309">📣 Convocatoria detectada</h2>
        <p>Se ha publicado una nueva convocatoria para <strong>${cuerpo || 'tu oposición'}</strong>.</p>
        ${tituloBoletín ? `<p style="font-size:13px;color:#555;font-style:italic">"${tituloBoletín}"</p>` : ''}
        <div style="margin-top:16px;display:flex;gap:12px;flex-wrap:wrap">
          ${urlBoletín ? `<a href="${urlBoletín}" style="padding:10px 20px;background:#1C1410;color:#fff;border-radius:10px;text-decoration:none;font-size:14px">Ver en el boletín ↗</a>` : ''}
          <a href="${APP_URL}/mis-oposiciones" style="padding:10px 20px;background:#B45309;color:#fff;border-radius:10px;text-decoration:none;font-size:14px">Ir a estudiar →</a>
        </div>
      </div>
    `,
  }
}

const TEMPLATES = {
  bienvenida: templateBienvenida,
  'pago-confirmado': templatePagoConfirmado,
  'racha-rota': templateRachaRota,
  convocatoria: templateConvocatoria,
}

// ── Handler ───────────────────────────────────────────────────────

exports.handler = async function (event) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: corsHeaders(), body: '' }
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: corsHeaders(), body: JSON.stringify({ error: 'Method not allowed' }) }

  const limite = await comprobarLimite(event, { clave: 'send-email', max: 5, ventanaSeg: 60 })
  if (!limite.permitido) {
    return { statusCode: 429, headers: { ...corsHeaders(), 'Retry-After': String(limite.resetSeg) }, body: JSON.stringify({ error: 'Demasiadas peticiones' }) }
  }
  if (!secretoValido(event)) {
    return { statusCode: 401, headers: corsHeaders(), body: JSON.stringify({ error: 'No autorizado' }) }
  }

  if (!API_KEY) return { statusCode: 500, headers: corsHeaders(), body: JSON.stringify({ error: 'SENDGRID_API_KEY no configurada' }) }
  sgMail.setApiKey(API_KEY)

  let body
  try { body = JSON.parse(event.body || '{}') } catch { return { statusCode: 400, headers: corsHeaders(), body: JSON.stringify({ error: 'JSON inválido' }) } }

  const { tipo, to, data = {} } = body
  if (!tipo || !to) return { statusCode: 400, headers: corsHeaders(), body: JSON.stringify({ error: 'Faltan campos: tipo, to' }) }
  if (typeof to !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    return { statusCode: 400, headers: corsHeaders(), body: JSON.stringify({ error: 'Destinatario inválido' }) }
  }

  const tmpl = TEMPLATES[tipo]
  if (!tmpl) return { statusCode: 400, headers: corsHeaders(), body: JSON.stringify({ error: `Tipo desconocido: ${tipo}` }) }

  const { subject, html } = tmpl(data)

  try {
    await sgMail.send({ to, from: { email: FROM, name: 'OpoDAM' }, subject, html })
    return { statusCode: 200, headers: corsHeaders(), body: JSON.stringify({ ok: true }) }
  } catch (err) {
    const msg = err?.response?.body?.errors?.[0]?.message ?? err?.message ?? 'Error SendGrid'
    console.error('[send-email] error:', msg)
    return { statusCode: 500, headers: corsHeaders(), body: JSON.stringify({ error: msg }) }
  }
}
