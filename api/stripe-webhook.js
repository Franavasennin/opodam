// Función Vercel que reutiliza el handler de Netlify (compatibilidad multiplataforma).
// IMPORTANTE: body debe llegar RAW (sin parsear) para que Stripe verifique la firma.
import mod from '../netlify/functions/stripe-webhook.cjs'

export const config = { api: { bodyParser: false } }

export default async function handler(req, res) {
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  const rawBody = Buffer.concat(chunks).toString()

  const event = {
    httpMethod: req.method,
    headers: req.headers || {},
    queryStringParameters: req.query || {},
    body: rawBody,
    isBase64Encoded: false,
  }
  const r = await mod.handler(event)
  for (const [k, v] of Object.entries(r.headers || {})) res.setHeader(k, v)
  res.status(r.statusCode || 200).send(r.body ?? '')
}
