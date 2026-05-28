// Limitador de peticiones por IP usando Netlify Blobs (sin servicio externo).
// Ventana deslizante simple por IP+clave. Si Blobs falla, NO bloquea (fail-open).

function ipDe(event) {
  const h = (event && event.headers) || {}
  return (h['x-nf-client-connection-ip']
    || (h['x-forwarded-for'] || '').split(',')[0]
    || h['client-ip']
    || 'anon').trim()
}

async function comprobarLimite(event, opts) {
  const { clave = 'groq', max = 20, ventanaSeg = 60 } = opts || {}
  try {
    const { getStore } = await import('@netlify/blobs')
    const store = getStore('ratelimit')
    const ip = ipDe(event)
    const key = `${clave}:${ip}`
    const ahora = Date.now()
    const prev = await store.get(key, { type: 'json' }).catch(() => null)
    let count = 0, inicio = ahora
    if (prev && (ahora - prev.inicio) < ventanaSeg * 1000) { count = prev.count; inicio = prev.inicio }
    count++
    await store.setJSON(key, { count, inicio })
    const resetSeg = Math.max(1, Math.ceil((inicio + ventanaSeg * 1000 - ahora) / 1000))
    return { permitido: count <= max, restante: Math.max(0, max - count), resetSeg }
  } catch {
    return { permitido: true, restante: -1, resetSeg: 0 }
  }
}

module.exports = { comprobarLimite, ipDe }
