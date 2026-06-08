// netlify/functions/boe.cjs
// Consulta la API de datos abiertos del BOE y busca, en los últimos N días de la
// Sección II-B (Oposiciones y concursos), una convocatoria del cuerpo solicitado.
// Solo cubre cuerpos estatales (Guardia Civil). Las oposiciones autonómicas (CGPC,
// Policía Local Canaria, Aux. Enfermería del SCS) se publican en el BOC, no aquí.

const DIAS = 35
const LOTE = 10

const CUERPOS = {
  'guardia-civil': { keywords: ['guardia civil'], verbos: ['convoca', 'pruebas selectivas', 'ingreso', 'proceso selectivo'] },
  'aux-judicial': { keywords: ['auxilio judicial', 'auxiliar judicial'], verbos: ['convoca', 'pruebas selectivas', 'proceso selectivo'] },
  'tramitacion-judicial': { keywords: ['tramitación procesal', 'tramitacion procesal'], verbos: ['convoca', 'pruebas selectivas', 'proceso selectivo'] },
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=21600',
  }
}

function fechasRecientes(n) {
  const out = []
  const d = new Date()
  for (let i = 0; i < n; i++) {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    out.push(`${y}${m}${day}`)
    d.setDate(d.getDate() - 1)
  }
  return out
}

// Recolecta items {titulo, url} dentro de un nodo del sumario.
function recolectar(node, out) {
  if (Array.isArray(node)) { for (const n of node) recolectar(n, out); return }
  if (node && typeof node === 'object') {
    const url = (node.url_pdf && node.url_pdf.texto) || node.urlPdf || node.url_html
    if (typeof node.titulo === 'string' && url) out.push({ titulo: node.titulo, url })
    for (const k of Object.keys(node)) recolectar(node[k], out)
  }
}

async function sumario(fecha) {
  const ctrl = new AbortController()
  const to = setTimeout(() => ctrl.abort(), 4000)
  try {
    const r = await fetch(`https://www.boe.es/datosabiertos/api/boe/sumario/${fecha}`, { headers: { Accept: 'application/json' }, signal: ctrl.signal })
    if (!r.ok) return null
    return await r.json()
  } catch { return null } finally { clearTimeout(to) }
}

function seccionII(json) {
  const diario = json && json.data && json.data.sumario && json.data.sumario.diario
  if (!Array.isArray(diario)) return []
  const items = []
  for (const d of diario) {
    const secs = Array.isArray(d.seccion) ? d.seccion : (d.seccion ? [d.seccion] : [])
    for (const s of secs) {
      if (String(s.codigo || '').startsWith('2')) recolectar(s, items)
    }
  }
  return items
}

exports.handler = async function (event) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: corsHeaders(), body: '' }
  const cuerpo = (event.queryStringParameters && event.queryStringParameters.cuerpo) || ''
  const cfg = CUERPOS[cuerpo]
  if (!cfg) {
    return { statusCode: 200, headers: corsHeaders(), body: JSON.stringify({ soportado: false, convocatoria: null }) }
  }
  if (typeof fetch !== 'function') {
    return { statusCode: 200, headers: corsHeaders(), body: JSON.stringify({ soportado: true, convocatoria: null, error: 'sin fetch' }) }
  }

  const fechas = fechasRecientes(DIAS)
  // En lotes para no saturar el BOE (las peticiones masivas en paralelo se descartan).
  const sumarios = []
  for (let i = 0; i < fechas.length; i += LOTE) {
    const lote = fechas.slice(i, i + LOTE)
    const res = await Promise.all(lote.map(async f => ({ f, j: await sumario(f) })))
    sumarios.push(...res)
  }

  let mejor = null
  for (const { f, j } of sumarios) {
    if (!j || mejor) continue
    const items = seccionII(j)
    for (const it of items) {
      const t = it.titulo.toLowerCase()
      const matchCuerpo = cfg.keywords.some(k => t.includes(k))
      const matchVerbo = cfg.verbos.some(v => t.includes(v))
      if (matchCuerpo && matchVerbo) {
        mejor = { titulo: it.titulo, url: it.url, fecha: `${f.slice(6, 8)}/${f.slice(4, 6)}/${f.slice(0, 4)}` }
        break
      }
    }
  }

  return { statusCode: 200, headers: corsHeaders(), body: JSON.stringify({ soportado: true, convocatoria: mejor }) }
}
