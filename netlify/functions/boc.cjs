// netlify/functions/boc.cjs
// Consulta el buscador del BOC (Boletín Oficial de Canarias) y detecta
// convocatorias recientes para los cuerpos canarios (CGPC, Policía Local, SCS…).
// Devuelve { soportado, convocatoria: { titulo, url, fecha } | null }

const CUERPOS = {
  'cgpc': {
    terminos: ['policía canaria', 'policia canaria', 'CGPC'],
    verbos: ['convoca', 'pruebas selectivas', 'proceso selectivo', 'ingreso'],
  },
  'policia-local': {
    terminos: ['policía local', 'policia local'],
    verbos: ['convoca', 'pruebas selectivas', 'proceso selectivo', 'ingreso', 'oposición'],
  },
  'aux-enfermeria': {
    terminos: ['auxiliar de enfermería', 'auxiliar de enfermeria', 'servicio canario de salud'],
    verbos: ['convoca', 'pruebas selectivas', 'proceso selectivo'],
  },
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

function fechaHaceNDias(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}

function hoy() {
  const d = new Date()
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}

function parsearHTML(html, cfg) {
  const resultados = []
  const reEnlace = /<a[^>]+href="(\/boc\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/gi
  let m
  while ((m = reEnlace.exec(html)) !== null) {
    const url = 'https://www.gobiernodecanarias.org' + m[1]
    const titulo = m[2].replace(/<[^>]+>/g, '').trim()
    if (!titulo) continue
    const t = titulo.toLowerCase()
    const matchCuerpo = cfg.terminos.some(k => t.includes(k.toLowerCase()))
    const matchVerbo = cfg.verbos.some(v => t.includes(v.toLowerCase()))
    if (matchCuerpo && matchVerbo) {
      const ctx = html.substring(Math.max(0, m.index - 200), m.index + 400)
      const mf = /(\d{2})[\/\-](\d{2})[\/\-](\d{4})/.exec(ctx)
      const fecha = mf ? `${mf[1]}/${mf[2]}/${mf[3]}` : null
      resultados.push({ titulo, url, fecha })
    }
  }
  return resultados
}

async function buscarEnBOC(termino, cfg) {
  const params = new URLSearchParams({
    busqueda: termino,
    tipo: '',
    grupo: '',
    fechaDesde: fechaHaceNDias(60),
    fechaHasta: hoy(),
  })
  const url = `https://www.gobiernodecanarias.org/boc/boc.nsf/buscador.xsp?${params}`
  const ctrl = new AbortController()
  const to = setTimeout(() => ctrl.abort(), 6000)
  try {
    const r = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; OpoDAM/1.0)', Accept: 'text/html' },
      signal: ctrl.signal,
    })
    if (!r.ok) return []
    return parsearHTML(await r.text(), cfg)
  } catch { return [] } finally { clearTimeout(to) }
}

exports.handler = async function (event) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: corsHeaders(), body: '' }
  const cuerpo = (event.queryStringParameters && event.queryStringParameters.cuerpo) || ''
  const cfg = CUERPOS[cuerpo]
  if (!cfg) return { statusCode: 200, headers: corsHeaders(), body: JSON.stringify({ soportado: false, convocatoria: null }) }
  if (typeof fetch !== 'function') return { statusCode: 200, headers: corsHeaders(), body: JSON.stringify({ soportado: true, convocatoria: null, error: 'sin fetch' }) }

  let resultados = []
  for (const termino of cfg.terminos.slice(0, 2)) {
    const r = await buscarEnBOC(termino, cfg)
    resultados.push(...r)
    if (resultados.length) break
  }
  const mejor = resultados[0] ?? null
  return { statusCode: 200, headers: corsHeaders(), body: JSON.stringify({ soportado: true, convocatoria: mejor }) }
}
