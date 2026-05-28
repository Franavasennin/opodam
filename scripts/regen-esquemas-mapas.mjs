// Regenera esquemas[] y mapaMental de cada tema a partir de la ESTRUCTURA real
// del temario limpio (raíz = título; ramas = TÍTULOS/CAPÍTULOS/leyes/artículos clave).
// Uso: node scripts/regen-esquemas-mapas.mjs <jsonDir>
import fs from 'node:fs'
import path from 'node:path'

const [, , jsonDir] = process.argv

const RE_ESTRUCTURA = /^(T[IÍ]TULO\s+(?:PRELIMINAR|[IVXLCDM]+|\d+)[^\n]{0,80}|CAP[IÍ]TULO\s+(?:PRIMERO|SEGUNDO|TERCERO|CUARTO|QUINTO|SEXTO|S[EÉ]PTIMO|OCTAVO|[IVXLCDM]+|\d+)[^\n]{0,80}|SECCI[OÓ]N\s+(?:[IVXLCDM]+|\d+)[^\n]{0,80})/i
const RE_LEY = /\b(LEY ORG[ÁA]NICA[^\n.,;]{0,60}|LEY\s+\d+\/\d+[^\n.,;]{0,40}|REAL DECRETO[^\n.,;]{0,50}|DECRETO\s+\d+\/\d+[^\n.,;]{0,30}|CONSTITUCI[OÓ]N ESPA[ÑN]OLA|C[OÓ]DIGO PENAL|ESTATUTO DE AUTONOM[IÍ]A[^\n.,;]{0,30})/ig
const RE_ART = /\bART[IÍ]CULO\s+(\d+)/ig

function recortar(s, n = 58) {
  s = s.replace(/\s+/g, ' ').trim()
  if (s.length <= n) return s
  return s.slice(0, n).replace(/[\s,;:.\-]+\S*$/, '') + '…'
}

function titulosUnicos(arr, cap) {
  const vistos = new Set(), out = []
  for (const x of arr) {
    const k = x.toLowerCase()
    if (vistos.has(k)) continue
    vistos.add(k); out.push(x)
    if (out.length >= cap) break
  }
  return out
}

function ramasDe(contenido) {
  const lineas = contenido.split('\n').map(l => l.trim()).filter(Boolean)

  // 1) Estructura (TÍTULO/CAPÍTULO/SECCIÓN)
  const estructura = []
  for (const l of lineas) {
    const m = l.match(RE_ESTRUCTURA)
    if (m) estructura.push(recortar(m[1]))
  }
  let ramas = titulosUnicos(estructura, 9)
  if (ramas.length >= 3) return ramas

  // 2) Leyes / normas citadas
  const cab = contenido.slice(0, 4000)
  const leyes = []
  let m
  RE_LEY.lastIndex = 0
  while ((m = RE_LEY.exec(cab)) !== null) leyes.push(recortar(m[1], 50))
  ramas = titulosUnicos([...ramas, ...leyes], 7)
  if (ramas.length >= 3) return ramas

  // 3) Artículos clave (primeros distintos)
  const arts = []
  RE_ART.lastIndex = 0
  while ((m = RE_ART.exec(contenido)) !== null) arts.push('Artículo ' + m[1])
  ramas = titulosUnicos([...ramas, ...arts], 8)
  if (ramas.length >= 3) return ramas

  // 4) Epígrafes numerados estilo apuntes: "1. INTRODUCCIÓN", "2. EL CLIMA"…
  const epi = []
  for (const l of lineas) {
    const me = l.match(/^(\d{1,2})\.\s+([A-ZÁÉÍÓÚÑ][^\n]{3,58})$/)
    if (me && !/[.;]\s/.test(me[2])) epi.push(recortar(me[2], 50))
  }
  ramas = titulosUnicos([...ramas, ...epi], 9)
  return ramas
}

function build(tema) {
  const contenido = tema.secciones?.[0]?.contenido ?? ''
  const raiz = recortar(tema.titulo || 'Tema', 60)
  const ramas = ramasDe(contenido)

  // mapaMental (formato C: texto/nivel + aristas desde/hasta → buildLayout calcula radial)
  const nodos = [{ id: 'root', texto: raiz, nivel: 0, x: 0, y: 0 }]
  const aristas = []
  ramas.forEach((r, i) => {
    const id = 's' + (i + 1)
    nodos.push({ id, texto: r, nivel: 1, x: 0, y: 0 })
    aristas.push({ desde: 'root', hasta: id })
  })

  // esquema (mermaid: EsquemasTab parsea las etiquetas [..])
  const lineasMermaid = ['graph TD', `  A["${raiz.replace(/"/g, "'")}"]`]
  ramas.forEach((r, i) => lineasMermaid.push(`  A --> N${i + 1}["${r.replace(/"/g, "'")}"]`))
  const esquemas = [{ tipo: 'mermaid', titulo: 'Esquema general del tema', codigo: lineasMermaid.join('\n') }]

  return { esquemas, mapaMental: { nodos, aristas } }
}

const files = fs.readdirSync(jsonDir).filter(f => /^tema-\d+\.json$/.test(f))
let ok = 0, pocas = 0
for (const file of files) {
  const p = path.join(jsonDir, file)
  const tema = JSON.parse(fs.readFileSync(p, 'utf8'))
  const { esquemas, mapaMental } = build(tema)
  if (mapaMental.nodos.length < 3) { console.warn('POCAS RAMAS:', file, mapaMental.nodos.length - 1); pocas++ }
  tema.esquemas = esquemas
  tema.mapaMental = mapaMental
  fs.writeFileSync(p, JSON.stringify(tema, null, 2) + '\n', 'utf8')
  ok++
}
console.log(`[${jsonDir}] regenerados=${ok} con_pocas_ramas=${pocas}`)
