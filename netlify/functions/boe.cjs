// netlify/functions/boe.cjs
// Consulta la API de datos abiertos del BOE, detecta convocatorias recientes
// y extrae automáticamente la fecha del examen del documento HTML del BOE.
// Devuelve { soportado, convocatoria: { titulo, url, fecha, fechaExamen } | null }

const DIAS = 35
const LOTE = 10

const CUERPOS = {
  'guardia-civil':       { keywords: ['guardia civil'], verbos: ['convoca', 'pruebas selectivas', 'ingreso', 'proceso selectivo'] },
  'aux-judicial':        { keywords: ['auxilio judicial', 'auxiliar judicial'], verbos: ['convoca', 'pruebas selectivas', 'proceso selectivo'] },
  'tramitacion-judicial':{ keywords: ['tramitación procesal', 'tramitacion procesal'], verbos: ['convoca', 'pruebas selectivas', 'proceso selectivo'] },
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

// Convierte una URL de PDF del BOE a la URL HTML equivalente.
// https://www.boe.es/boe/dias/2025/06/01/pdfs/BOE-A-2025-XXXXX.pdf
// → https://www.boe.es/diario_boe/txt.php?id=BOE-A-2025-XXXXX
function pdfAHtml(url) {
  const m = /BOE-[A-Z]-\d{4}-\d+/.exec(url)
  if (!m) return null
  return `https://www.boe.es/diario_boe/txt.php?id=${m[0]}`
}

// Extrae la fecha ISO del examen del texto HTML del documento BOE.
// Busca frases como "tendrá lugar el 15 de junio de 2026" cerca de palabras clave.
function extraerFechaExamen(html) {
  if (!html) return null
  const texto = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')

  // Patrón "15 de junio de 2025" (±500 chars después de palabras clave de examen)
  const CLAVE = /(?:celebrar[aá]|tendr[aá] lugar|realiza[rá]|prueba|examen|oposici[oó]n)/gi
  const RE_FECHA_LARGA = /(\d{1,2})\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\s+de\s+(\d{4})/gi

  // Extraemos todos los candidatos con su posición
  const candidatos = []

  let m
  RE_FECHA_LARGA.lastIndex = 0
  while ((m = RE_FECHA_LARGA.exec(texto)) !== null) {
    const dia = parseInt(m[1], 10)
    const mes = MESES[m[2].toLowerCase()]
    const anio = parseInt(m[3], 10)
    if (!mes || anio < new Date().getFullYear()) continue
    candidatos.push({ pos: m.index, dia, mes, anio })
  }

  if (!candidatos.length) return null

  // Buscar la fecha que aparece más cerca de una palabra clave de examen
  CLAVE.lastIndex = 0
  const posClaves = []
  while ((m = CLAVE.exec(texto)) !== null) posClaves.push(m.index)

  if (!posClaves.length) {
    // Sin palabras clave: devolver la primera fecha futura
    const hoy = new Date()
    const futuras = candidatos.filter(c => new Date(c.anio, c.mes - 1, c.dia) > hoy)
    if (!futuras.length) return null
    const { dia, mes, anio } = futuras[0]
    return `${anio}-${String(mes).padStart(2,'0')}-${String(dia).padStart(2,'0')}`
  }

  // Scoring: penaliza distancia al keyword más cercano
  let mejor = null, mejorScore = Infinity
  for (const c of candidatos) {
    const dist = Math.min(...posClaves.map(p => Math.abs(p - c.pos)))
    if (dist < mejorScore) { mejorScore = dist; mejor = c }
  }

  if (!mejor || mejorScore > 800) return null
  const { dia, mes, anio } = mejor
  return `${anio}-${String(mes).padStart(2,'0')}-${String(dia).padStart(2,'0')}`
}

async function obtenerFechaExamen(urlPdf) {
  const urlHtml = pdfAHtml(urlPdf)
  if (!urlHtml) return null
  const ctrl = new AbortController()
  const to = setTimeout(() => ctrl.abort(), 5000)
  try {
    const r = await fetch(urlHtml, { signal: ctrl.signal })
    if (!r.ok) return null
    return extraerFechaExamen(await r.text())
  } catch { return null } finally { clearTimeout(to) }
}

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
  if (!cfg) return { statusCode: 200, headers: corsHeaders(), body: JSON.stringify({ soportado: false, convocatoria: null }) }
  if (typeof fetch !== 'function') return { statusCode: 200, headers: corsHeaders(), body: JSON.stringify({ soportado: true, convocatoria: null, error: 'sin fetch' }) }

  const fechas = fechasRecientes(DIAS)
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
        mejor = { titulo: it.titulo, url: it.url, fecha: `${f.slice(6,8)}/${f.slice(4,6)}/${f.slice(0,4)}`, fechaExamen: null }
        break
      }
    }
  }

  // Extraer fecha del examen del documento HTML del BOE.
  if (mejor && mejor.url) {
    mejor.fechaExamen = await obtenerFechaExamen(mejor.url)
  }

  return { statusCode: 200, headers: corsHeaders(), body: JSON.stringify({ soportado: true, convocatoria: mejor }) }
}
