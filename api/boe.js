// Función Vercel que reutiliza el handler de Netlify (compatibilidad multiplataforma).
import mod from '../netlify/functions/boe.cjs'

export default async function handler(req, res) {
  const event = {
    httpMethod: req.method,
    headers: req.headers || {},
    queryStringParameters: req.query || {},
    body: req.body == null ? '' : (typeof req.body === 'string' ? req.body : JSON.stringify(req.body)),
  }
  const r = await mod.handler(event)
  for (const [k, v] of Object.entries(r.headers || {})) res.setHeader(k, v)
  res.status(r.statusCode || 200).send(r.body ?? '')
}
