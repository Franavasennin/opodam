// netlify/functions/stripe-webhook.cjs
// Recibe webhooks de Stripe y actualiza oposicion_subscriptions en Supabase.
//
// Eventos procesados:
//   - checkout.session.completed       → status='active' para (user_id, oposicion_slug)
//   - customer.subscription.updated    → actualiza status y current_period_end
//   - customer.subscription.deleted    → status='canceled'
//
// Requiere env vars:
//   STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET,
//   VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

function supabaseAdmin() {
  const url = process.env.VITE_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return {
    async upsert(table, body) {
      const r = await fetch(`${url}/rest/v1/${table}`, {
        method: 'POST',
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
          Prefer: 'resolution=merge-duplicates,return=representation',
        },
        body: JSON.stringify(body),
      })
      const text = await r.text()
      return { ok: r.ok, status: r.status, data: text ? JSON.parse(text) : null }
    },
    async selectBy(table, column, value) {
      const r = await fetch(`${url}/rest/v1/${table}?${column}=eq.${encodeURIComponent(value)}&select=*`, {
        headers: { apikey: key, Authorization: `Bearer ${key}` },
      })
      if (!r.ok) return []
      return r.json()
    },
    async update(table, filters, body) {
      const r = await fetch(`${url}/rest/v1/${table}?${filters}`, {
        method: 'PATCH',
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify(body),
      })
      return { ok: r.ok, status: r.status }
    },
  }
}

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('[stripe-webhook] Faltan variables de entorno')
    return { statusCode: 500, body: 'Server misconfigured' }
  }

  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
  const db = supabaseAdmin()
  if (!db) {
    console.error('[stripe-webhook] Supabase no configurado')
    return { statusCode: 500, body: 'Supabase misconfigured' }
  }

  let stripeEvent
  try {
    const sig = event.headers['stripe-signature'] || event.headers['Stripe-Signature']
    stripeEvent = stripe.webhooks.constructEvent(
      event.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET,
    )
  } catch (err) {
    console.error('[stripe-webhook] Firma inválida:', err.message)
    return { statusCode: 400, body: `Webhook signature verification failed: ${err.message}` }
  }

  const now = new Date().toISOString()

  try {
    switch (stripeEvent.type) {

      case 'checkout.session.completed': {
        const session = stripeEvent.data.object
        const customerId = session.customer
        const subscriptionId = session.subscription
        const userId = session.metadata?.supabase_user_id
        const oposicionSlug = session.metadata?.oposicion_slug || 'cgpc'

        if (!userId) {
          console.warn('[stripe-webhook] checkout.session.completed sin supabase_user_id en metadata')
          break
        }

        let periodEnd = null
        if (subscriptionId) {
          try {
            const sub = await stripe.subscriptions.retrieve(subscriptionId)
            periodEnd = sub.current_period_end
              ? new Date(sub.current_period_end * 1000).toISOString()
              : null
          } catch { /* continuar sin period_end */ }
        }

        await db.upsert('oposicion_subscriptions', {
          user_id: userId,
          oposicion_slug: oposicionSlug,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          status: 'active',
          current_period_end: periodEnd,
          updated_at: now,
        })

        console.log(`[stripe-webhook] ✅ Usuario ${userId} activado para ${oposicionSlug}`)

        // Email de confirmación de pago via SendGrid (fire-and-forget)
        if (session.customer_details?.email) {
          const baseUrl = process.env.URL || 'https://opodam.netlify.app'
          fetch(`${baseUrl}/.netlify/functions/send-email`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Send-Email-Secret': process.env.SEND_EMAIL_SECRET || '',
            },
            body: JSON.stringify({
              tipo: 'pago-confirmado',
              to: session.customer_details.email,
              data: { oposicion: oposicionSlug, importe: '19,90 €' },
            }),
          }).catch(e => console.warn('[stripe-webhook] send-email falló:', e?.message))
        }
        break
      }

      case 'customer.subscription.updated': {
        const sub = stripeEvent.data.object
        const customerId = sub.customer

        const rows = await db.selectBy('oposicion_subscriptions', 'stripe_customer_id', customerId)
        if (rows.length === 0) {
          console.warn(`[stripe-webhook] subscription.updated: no se encontró usuario para customer ${customerId}`)
          break
        }

        const status = sub.status === 'active' ? 'active'
          : sub.status === 'past_due' ? 'past_due'
          : sub.status === 'canceled' ? 'canceled'
          : 'inactive'

        const periodEnd = sub.current_period_end
          ? new Date(sub.current_period_end * 1000).toISOString()
          : null

        await db.update(
          'oposicion_subscriptions',
          `stripe_customer_id=eq.${encodeURIComponent(customerId)}&stripe_subscription_id=eq.${encodeURIComponent(sub.id)}`,
          { status, current_period_end: periodEnd, updated_at: now }
        )

        console.log(`[stripe-webhook] Suscripción actualizada: customer=${customerId}, status=${status}`)
        break
      }

      case 'customer.subscription.deleted': {
        const sub = stripeEvent.data.object
        const customerId = sub.customer

        await db.update(
          'oposicion_subscriptions',
          `stripe_customer_id=eq.${encodeURIComponent(customerId)}&stripe_subscription_id=eq.${encodeURIComponent(sub.id)}`,
          { status: 'canceled', stripe_subscription_id: null, current_period_end: null, updated_at: now }
        )

        console.log(`[stripe-webhook] Suscripción cancelada: customer=${customerId}`)
        break
      }

      default:
        console.log(`[stripe-webhook] Evento ignorado: ${stripeEvent.type}`)
    }
  } catch (err) {
    console.error(`[stripe-webhook] Error procesando ${stripeEvent.type}:`, err)
    return { statusCode: 500, body: 'Error processing webhook' }
  }

  return { statusCode: 200, body: JSON.stringify({ received: true }) }
}
