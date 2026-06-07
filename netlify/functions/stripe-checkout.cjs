// netlify/functions/stripe-checkout.cjs
// Crea una Stripe Checkout Session para suscripción a una oposición concreta.
//
// Requiere env vars:
//   STRIPE_SECRET_KEY, STRIPE_PRICE_ID,
//   VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY

const { comprobarLimite } = require('./_ratelimit.cjs')

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
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Vary': 'Origin',
    'Content-Type': 'application/json',
  }
}

async function obtenerUsuarioDesdeJWT(authHeader) {
  const url = process.env.VITE_SUPABASE_URL
  if (!url || !authHeader) return null
  const token = authHeader.replace(/^Bearer\s+/i, '')
  if (!token) return null
  const r = await fetch(`${url}/auth/v1/user`, {
    headers: { Authorization: `Bearer ${token}`, apikey: process.env.VITE_SUPABASE_ANON_KEY || '' },
  })
  if (!r.ok) return null
  const data = await r.json()
  return data?.id ? data : null
}

function supabaseAdmin() {
  const url = process.env.VITE_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return {
    async query(table, method, filters, body) {
      let endpoint = `${url}/rest/v1/${table}`
      if (filters) endpoint += `?${filters}`
      const headers = {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        Prefer: method === 'POST' ? 'return=representation' : 'return=minimal',
      }
      if (method === 'UPSERT') {
        headers.Prefer = 'resolution=merge-duplicates,return=representation'
        method = 'POST'
      }
      const r = await fetch(endpoint, { method, headers, body: body ? JSON.stringify(body) : undefined })
      const text = await r.text()
      return { ok: r.ok, status: r.status, data: text ? JSON.parse(text) : null }
    }
  }
}

exports.handler = async function (event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders(event), body: '' }
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: corsHeaders(event), body: JSON.stringify({ error: 'Method Not Allowed' }) }
  }

  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_PRICE_ID) {
    return { statusCode: 500, headers: corsHeaders(event), body: JSON.stringify({ error: 'Stripe no configurado en el servidor' }) }
  }

  const limite = await comprobarLimite(event, { clave: 'stripe-checkout', max: 5, ventanaSeg: 60 })
  if (!limite.permitido) {
    return { statusCode: 429, headers: { ...corsHeaders(event), 'Retry-After': String(limite.resetSeg) }, body: JSON.stringify({ error: 'Demasiadas peticiones, espera un momento.' }) }
  }

  const authHeader = event.headers.authorization || event.headers.Authorization || ''
  const usuario = await obtenerUsuarioDesdeJWT(authHeader)
  if (!usuario) {
    return { statusCode: 401, headers: corsHeaders(event), body: JSON.stringify({ error: 'No autenticado' }) }
  }

  let oposicion_slug = 'cgpc'
  try {
    const body = JSON.parse(event.body || '{}')
    if (body.oposicion_slug) oposicion_slug = String(body.oposicion_slug).slice(0, 60)
  } catch { /* usar slug por defecto */ }

  const origin = event.headers.origin || event.headers.Origin || process.env.ALLOWED_ORIGINS?.split(',')[0] || 'https://opodam.netlify.app'

  // --- Bypass para beta testers ---
  const betaTesters = ['itsdamaaa.19@gmail.com', 'esterlcorreas@gmail.com']
  if (usuario.email && betaTesters.includes(usuario.email.toLowerCase())) {
    try {
      const db = supabaseAdmin()
      if (db) {
        await db.query('oposicion_subscriptions', 'UPSERT', '', {
          user_id: usuario.id,
          oposicion_slug,
          status: 'active',
          current_period_end: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365 * 10).toISOString(),
          updated_at: new Date().toISOString(),
        })
      }
      return {
        statusCode: 200,
        headers: corsHeaders(event),
        body: JSON.stringify({ url: `${origin}/oposicion/${oposicion_slug}?checkout=success` })
      }
    } catch (error) {
      console.error('[stripe-checkout bypass error]', error)
    }
  }

  try {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
    const db = supabaseAdmin()

    // Reusar stripe_customer_id si el usuario ya compró otra oposición
    let stripeCustomerId = null
    if (db) {
      const { ok, data } = await db.query(
        'oposicion_subscriptions', 'GET',
        `user_id=eq.${usuario.id}&stripe_customer_id=not.is.null&limit=1&select=stripe_customer_id`
      )
      if (ok && data && data.length > 0 && data[0].stripe_customer_id) {
        stripeCustomerId = data[0].stripe_customer_id
      }
    }

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: usuario.email || undefined,
        metadata: { supabase_user_id: usuario.id },
      })
      stripeCustomerId = customer.id
    }

    // Permite price_id por oposición (STRIPE_PRICE_ID_CGPC) o precio global
    const priceEnvKey = `STRIPE_PRICE_ID_${oposicion_slug.toUpperCase().replace(/-/g, '_')}`
    const priceId = process.env[priceEnvKey] || process.env.STRIPE_PRICE_ID

    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/oposicion/${oposicion_slug}?checkout=success`,
      cancel_url:  `${origin}/oposicion/${oposicion_slug}?checkout=cancel`,
      metadata: {
        supabase_user_id: usuario.id,
        oposicion_slug,
      },
    })

    return {
      statusCode: 200,
      headers: corsHeaders(event),
      body: JSON.stringify({ url: session.url }),
    }
  } catch (err) {
    console.error('[stripe-checkout] Error:', err)
    return {
      statusCode: 500,
      headers: corsHeaders(event),
      body: JSON.stringify({ error: 'Error creando sesión de pago', detail: String(err?.message || err) }),
    }
  }
}
