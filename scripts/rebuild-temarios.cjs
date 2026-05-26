// scripts/rebuild-temarios.cjs
// Reconstruye la teoría (secciones) y el título de cada tema a partir del texto
// FUENTE proporcionado por el usuario (E:\opodam\txt), sin usar contenido del BOE/IA.
// Preserva id, bloque, esquemas, mapaMental, flashcards y preguntas existentes.
//
// Uso:
//   node scripts/rebuild-temarios.cjs cgpc
//   node scripts/rebuild-temarios.cjs policia-local

const fs = require('fs')
const path = require('path')

const SRC_DIR = process.env.OPODAM_SRC || 'E:/opodam/txt'
const ROOT = path.resolve(__dirname, '..')

// Limpia el texto crudo extraído del PDF (una sola línea, BOM, tabs, espacios dobles).
function limpiar(raw) {
  return raw
    .replace(/^﻿/, '')
    .replace(/\r/g, ' ')
    .replace(/\n/g, ' ')
    .replace(/\t/g, ' ')
    .replace(/ACADEMIA@APOLOCAN\.COM/gi, ' ')
    .replace(/Documento protegido por Copyright\s*\d{0,4}\s*/gi, ' ')
    .replace(/[®©]/g, ' ')
    .replace(/ /g, ' ')
    .replace(/ {2,}/g, ' ')
    .trim()
}

// Extrae el título del encabezado "... TEMA NN GENERAL/ESPECIFICA <título> BIBLIOGRAFÍA".
function extraerTitulo(texto, fallback) {
  const m = texto.match(/TEMA\s+\d+\s+(?:GENERAL|ESPEC[IÍ]FICA)\s+(.*?)\s+BIBLIOGRAF[IÍ]A/i)
  if (m && m[1] && m[1].trim().length > 5) return m[1].trim()
  return fallback
}

// Trocea el cuerpo en secciones legibles (~3000 chars) cortando en límite de frase.
function trocear(body) {
  const MAX = 3000
  const secciones = []
  let resto = body
  let n = 1
  while (resto.length > 0) {
    let corte = resto.length
    if (resto.length > MAX) {
      const ventana = resto.slice(0, MAX + 600)
      const idx = ventana.lastIndexOf('. ')
      corte = idx > MAX * 0.5 ? idx + 1 : MAX
    }
    const trozo = resto.slice(0, corte).trim()
    resto = resto.slice(corte).trim()
    if (!trozo) continue
    secciones.push({ titulo: tituloDeSeccion(trozo, n), contenido: trozo })
    n++
  }
  return secciones
}

function tituloDeSeccion(trozo, n) {
  const m = trozo.match(/\b(T[IÍ]TULO [IVXLCDM]+|CAP[IÍ]TULO [IVXLCDM]+|ART[IÍ]CULO\s+\d+\s*(?:bis|ter)?|LEY ORG[ÁA]NICA[^.]{0,60}|REAL DECRETO[^.]{0,40}|DISPOSICI[OÓ]N\s+\w+)/i)
  if (m) return `${n}. ${m[1].replace(/\s+/g, ' ').trim()}`
  const inicio = trozo.split(/[.;]/)[0].slice(0, 70).trim()
  return `${n}. ${inicio}${inicio.length >= 70 ? '…' : ''}`
}

// Recorta el título de una sección para usarlo como etiqueta de nodo/diagrama.
function etiqueta(s, max = 40) {
  const txt = (s || '').replace(/^\d+\.\s*/, '').replace(/[\n\r]+/g, ' ').trim()
  return txt.length > max ? txt.slice(0, max - 1) + '…' : txt
}

// Mapa mental Formato C (texto/nivel + desde/hasta): raíz = tema, hijos = secciones.
function construirMapa(tema) {
  const nodos = [{ id: 'root', texto: etiqueta(tema.titulo, 50), nivel: 0, x: 0, y: 0 }]
  const aristas = []
  tema.secciones.forEach((s, i) => {
    const id = `s${i + 1}`
    nodos.push({ id, texto: etiqueta(s.titulo, 40), nivel: 1, x: 0, y: 0 })
    aristas.push({ desde: 'root', hasta: id })
  })
  return { nodos, aristas }
}

// Un esquema mermaid graph TD desde el título y las secciones (etiquetas saneadas).
function mermaidSafe(s) {
  return (s || '').replace(/^\d+\.\s*/, '').replace(/["[\]{}()|<>]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 40)
}
function construirEsquemas(tema) {
  const root = mermaidSafe(tema.titulo) || 'Tema'
  let codigo = 'graph TD\n  A["' + root + '"]'
  tema.secciones.slice(0, 12).forEach((s, i) => {
    const label = mermaidSafe(s.titulo) || `Apartado ${i + 1}`
    codigo += `\n  A --> N${i + 1}["${label}"]`
  })
  return [{ tipo: 'mermaid', titulo: 'Esquema general del tema', codigo }]
}

function archivoFuenteCGPC(id) {
  const nn = String(id).padStart(2, '0')
  const candidatos = id <= 23
    ? [`CGPC-GENERAL-TEMA-${nn}.txt`, `CGPC-GENERAL-TEMA-${nn}-1.txt`]
    : [`CGPC-ESPECIFICA-TEMA-${nn}.txt`, `CGPC-ESPECIFICA-TEMA-${nn}-1.txt`]
  for (const c of candidatos) {
    const p = path.join(SRC_DIR, c)
    if (fs.existsSync(p)) return p
  }
  return null
}

// Mapeo PLocal: el proyecto numera 1-37 (15 general + 22 específico), pero las
// fuentes son PL-GENERAL-TEMA-01..15 y PL-ESPECIFICA-TEMA-01..23 SALTANDO la 08.
const PL_ESPECIFICA_NUMS = [1, 2, 3, 4, 5, 6, 7, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23]
function archivoFuentePLocal(id, bloque) {
  let nombre
  if (bloque === 'general') {
    nombre = `PL-GENERAL-TEMA-${String(id).padStart(2, '0')}.txt`
  } else {
    const idxEsp = id - 16 // id 16 -> primer específico
    const num = PL_ESPECIFICA_NUMS[idxEsp]
    if (num == null) return null
    nombre = `PL-ESPECIFICA-TEMA-${String(num).padStart(2, '0')}.txt`
  }
  const p = path.join(SRC_DIR, nombre)
  return fs.existsSync(p) ? p : null
}

function reconstruir(slug) {
  const dir = path.join(ROOT, 'src', 'data', 'topics', slug)
  const files = fs.readdirSync(dir).filter(f => /^tema-\d+\.json$/.test(f)).sort()
  let ok = 0
  const sinFuente = []
  for (const f of files) {
    const jsonPath = path.join(dir, f)
    const tema = JSON.parse(fs.readFileSync(jsonPath, 'utf8').replace(/^﻿/, ''))
    const fuente = slug === 'cgpc'
      ? archivoFuenteCGPC(tema.id)
      : archivoFuentePLocal(tema.id, tema.bloque)
    if (!fuente) { sinFuente.push(tema.id); continue }
    const texto = limpiar(fs.readFileSync(fuente, 'utf8'))
    tema.titulo = extraerTitulo(texto, tema.titulo)
    const idxBib = texto.search(/BIBLIOGRAF[IÍ]A/i)
    const body = idxBib >= 0 ? texto.slice(idxBib) : texto
    tema.secciones = trocear(body)
    // Mapa mental y esquema deterministas, siempre consistentes con la teoría.
    tema.mapaMental = construirMapa(tema)
    tema.esquemas = construirEsquemas(tema)
    fs.writeFileSync(jsonPath, JSON.stringify(tema, null, 2) + '\n', 'utf8')
    ok++
  }
  console.log(`[${slug}] reconstruidos: ${ok}/${files.length}`)
  if (sinFuente.length) console.log(`[${slug}] SIN fuente (revisar): ${sinFuente.join(', ')}`)
  regenerarIndice(slug, dir, files)
}

// Regenera el array TEMAS_META de <slug>/index.ts con los títulos reales de la fuente,
// manteniendo el orden por id y el resto del archivo intacto.
function regenerarIndice(slug, dir, files) {
  const metas = files.map(f => {
    const t = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8').replace(/^﻿/, ''))
    return { id: t.id, titulo: t.titulo, bloque: t.bloque }
  }).sort((a, b) => a.id - b.id)

  const lineas = metas.map(m =>
    `  { id: ${m.id}, titulo: ${JSON.stringify(m.titulo)}, bloque: ${JSON.stringify(m.bloque)} },`
  ).join('\n')
  const nuevoArray = `export const TEMAS_META = [\n${lineas}\n] as const;`

  const indexPath = path.join(dir, 'index.ts')
  let src = fs.readFileSync(indexPath, 'utf8')
  src = src.replace(/export const TEMAS_META = \[[\s\S]*?\] as const;/, nuevoArray)
  fs.writeFileSync(indexPath, src, 'utf8')
  console.log(`[${slug}] index.ts TEMAS_META regenerado (${metas.length} temas)`)
}

const slug = process.argv[2]
if (!slug) { console.error('Uso: node scripts/rebuild-temarios.cjs <cgpc|policia-local>'); process.exit(1) }
reconstruir(slug)
