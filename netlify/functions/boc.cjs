// netlify/functions/boc.cjs
// Consulta el buscador del BOC (Boletín Oficial de Canarias), detecta convocatorias
// recientes para los cuerpos canarios y extrae automáticamente la fecha del examen
// del documento HTML del BOC.
// Devuelve { soportado, convocatoria: { titulo, url, fecha, fechaExamen } | null }

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

const MESES = {
  enero:1, febrero:2, marzo:3, abril:4, mayo:5, junio:6,
  julio:7, agosto:8, septiembre:9, octubre:10, noviembre:11, diciembre:12,
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
  const d = new Date(); d.setDate(d.getDate() - n)
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`
}

function hoy() {
  const d = new Date()
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`
}

// Extrae la fecha ISO del examen del texto HTML del documento.
// Busca frases "15 de junio de 2026" próximas a palabras clave de examen.
function extraerFechaExamen(html) {
  if (!html) return null
  const texto = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')

  const CLAVE = /(?:celebrar[aá]|tendr[aá] lugar|realiza[rá]|prueba|examen|oposici[oó]n)/gi
  const RE_FECHA = /(\d{1,2})\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\s+de\s+(\d{4})/gi

  const candidatos = []
  let m
  RE_FECHA.lastIndex = 0
  while ((m = RE_FECHA.exec(texto)) !== null) {
    const dia = parseInt(m[1], 10)
    const mes = MESES[m[2].toLowerCase()]
    const anio = parseInt(m[3], 10)
    if (!mes || anio < new Date().getFullYear()) continue
    candidatos.push({ pos: m.index, dia, mes, anio })
  }
  if (!candidatos.length) return null

  CLAVE.lastIndex = 0
  const posClaves = []
  while ((m = CLAVE.exec(texto)) !== null) posClaves.push(m.index)

  if (!posClaves.length) {
    const hoyDate = new Date()
    const futuras = candidatos.filter(c => new Date(c.anio, c.mes - 1, c.dia) > hoyDate)
    if (!futuras.length) return null
    const { dia, mes, anio } = futuras[0]
    return `${anio}-${String(mes).padStart(2,'0')}-${String(dia).padStart(2,'0')}`
  }

  let mejor = null, mejorScore = Infinity
  for (const c of candidatos) {
    const dist = Math.min(...posClaves.map(p => Math.abs(p - c.pos)))
    if (dist < mejorScore) { mejorScore = dist; mejor = c }
  }
  if (!mejor || mejorScore > 800) return null
  const { dia, mes, anio } = mejor
  return `${anio}-${String(mes).padStart(2,'0')}-${String(dia).padStart(2,'0')}`
}

async function obtenerFechaExamen(url) {
  if (!url) return null
  const ctrl = new AbortController()
  const to = setTimeout(() => ctrl.abort(), 6000)
  try {
    const r = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; OpoDAM/1.0)', Accept: 'text/html' },
      signal: ctrl.signal,
    })
    if (!r.ok) return null
    return extraerFechaExamen(await r.text())
  } catch { return null } finally { clearTimeout(to) }
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

  const mejor = resultados[0] ? { ...resultados[0], fechaExamen: null } : null

  // Extraer fecha del examen del documento HTML del BOC.
  if (mejor && mejor.url) {
    mejor.fechaExamen = await obtenerFechaExamen(mejor.url)
  }

  return { statusCode: 200, headers: corsHeaders(), body: JSON.stringify({ soportado: true, convocatoria: mejor }) }
}
