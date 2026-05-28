// Convierte el texto plano de una sección de teoría en bloques legibles.
// Dos modos:
//  - LEGAL: textos de leyes (ARTÍCULO / TÍTULO / CAPÍTULO). Separa por artículos.
//  - APUNTES: resúmenes/temas (epígrafes numerados, subtítulos, listas). Estructura por líneas.

export interface BloqueTeoria {
  tipo: 'estructura' | 'subtitulo' | 'articulo' | 'biblio' | 'lista' | 'parrafo'
  etiqueta?: string
  texto?: string
  items?: string[]
}

const RE_ESTRUCTURA = /^(T[IÍ]TULO|CAP[IÍ]TULO|SECCI[OÓ]N|DISPOSICI[OÓ]N)\b/i
const RE_ARTICULO = /^(ART[IÍ]CULO|Art[ií]culo)\s+(\d+)\s*\.?\s*/
const RE_CORTE_LEGAL = /(?=(?:ART[IÍ]CULO|Art[ií]culo)\s+\d+|T[IÍ]TULO\s+(?:PRELIMINAR|[IVXLCDM]+|\d+)|CAP[IÍ]TULO\s+(?:PRIMERO|SEGUNDO|TERCERO|CUARTO|QUINTO|[IVXLCDM]+|\d+)|SECCI[OÓ]N\s+(?:[IVXLCDM]+|\d+)|DISPOSICI[OÓ]N\s+(?:ADICIONAL|TRANSITORIA|DEROGATORIA|FINAL)|BIBLIOGRAF[IÍ]A)/g

const RE_LISTA = /^(\s*[-•·*▪◦➔]|\s*[a-zñ]\)|\s*\d+\)|\s*[IVXLCDM]+\))\s+/i
const RE_NUM_HEAD = /^(\d+(?:\.\d+)*)\.?\s+(.+)$/

function normalizar(raw: string): string {
  return (raw ?? '')
    .replace(/\f/g, '\n')
    .replace(/ﬁ/g, 'fi').replace(/ﬂ/g, 'fl').replace(/ﬀ/g, 'ff')
    .replace(/ﬃ/g, 'ffi').replace(/ﬄ/g, 'ffl')
    .replace(/ /g, ' ')
    .replace(/[ \t]+/g, ' ')
    .trim()
}

function contar(re: RegExp, txt: string): number { const m = txt.match(re); return m ? m.length : 0 }

// ─────────────────────────── MODO LEGAL ───────────────────────────
function parsearLegal(limpio: string): BloqueTeoria[] {
  const partes = limpio.split(RE_CORTE_LEGAL).map(p => p.trim()).filter(Boolean)
  return partes.map((parte): BloqueTeoria => {
    const art = parte.match(RE_ARTICULO)
    if (art) return { tipo: 'articulo', etiqueta: `Artículo ${art[2]}`, texto: parte.slice(art[0].length).trim() }
    if (/^BIBLIOGRAF[IÍ]A/i.test(parte)) return { tipo: 'biblio', texto: parte.replace(/^BIBLIOGRAF[IÍ]A\s*[•:.\-]?\s*/i, '').trim() }
    if (RE_ESTRUCTURA.test(parte) && parte.length <= 110) return { tipo: 'estructura', texto: parte }
    return { tipo: 'parrafo', texto: parte }
  })
}

// ────────────────────────── MODO APUNTES ──────────────────────────
function esCaps(t: string): boolean {
  const letras = t.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/g, '')
  return letras.length >= 4 && t === t.toUpperCase() && /[A-ZÁÉÍÓÚÑ]/.test(t)
}

function parsearApuntes(limpio: string): BloqueTeoria[] {
  const lineas = limpio.split('\n').map(l => l.trim())
  const bloques: BloqueTeoria[] = []
  let parrafo: string[] = []
  let lista: string[] = []
  const flushP = () => { if (parrafo.length) { bloques.push({ tipo: 'parrafo', texto: parrafo.join(' ') }); parrafo = [] } }
  const flushL = () => { if (lista.length) { bloques.push({ tipo: 'lista', items: lista.slice() }); lista = [] } }
  const flush = () => { flushP(); flushL() }

  let prev: string | null = null
  for (const l of lineas) {
    if (!l) continue
    if (l === prev) continue // líneas duplicadas consecutivas (cabeceras repetidas)
    prev = l

    // Lista
    const ml = l.match(RE_LISTA)
    if (ml) { flushP(); lista.push(l.replace(RE_LISTA, '').trim()); continue }

    // Epígrafe numerado: "1.", "1.1", "2.GESTIÓN…"
    const mn = l.match(RE_NUM_HEAD)
    if (mn && mn[2].length <= 80 && !/[.;]\s/.test(mn[2])) {
      flush()
      const depth = (mn[1].match(/\./g) || []).length // 0 → "1", 1 → "1.1"
      const texto = mn[2].replace(/[.:]+$/, '').trim()
      bloques.push({ tipo: depth >= 1 ? 'subtitulo' : 'estructura', texto })
      continue
    }

    // Subtítulo en MAYÚSCULAS o terminado en ":"
    if ((esCaps(l) && l.length <= 70) || (/[:：]$/.test(l) && l.length <= 60 && !/[.;]\s/.test(l))) {
      flush()
      bloques.push({ tipo: 'subtitulo', texto: l.replace(/[:：]+$/, '').trim() })
      continue
    }

    // Estructura legal suelta
    if (RE_ESTRUCTURA.test(l) && l.length <= 90) { flush(); bloques.push({ tipo: 'estructura', texto: l }); continue }

    // Texto normal
    flushL()
    parrafo.push(l)
  }
  flush()
  return bloques.filter(b => (b.texto && b.texto.length) || (b.items && b.items.length))
}

export function parsearTeoria(raw: string): BloqueTeoria[] {
  const limpio = normalizar(raw)
  if (!limpio) return []

  const legalMarkers = contar(/\bART[IÍ]CULO\s+\d+/g, limpio) + contar(/\bT[IÍ]TULO\s+(?:PRELIMINAR|[IVXLCDM]+|\d+)/g, limpio)
  if (legalMarkers >= 4) return parsearLegal(limpio)

  const bloques = parsearApuntes(limpio)
  const conEstructura = bloques.some(b => b.tipo === 'estructura' || b.tipo === 'subtitulo' || b.tipo === 'lista')
  if (!conEstructura) {
    if (legalMarkers >= 1) return parsearLegal(limpio)
    return bloques.length ? bloques : [{ tipo: 'parrafo', texto: limpio }]
  }
  return bloques
}
