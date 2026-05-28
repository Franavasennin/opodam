// Convierte el texto plano de una sección de teoría (a menudo extraído de un PDF
// como un único bloque sin saltos de línea) en bloques legibles: artículos,
// epígrafes de estructura (TÍTULO/CAPÍTULO/SECCIÓN), bibliografía y párrafos.

export interface BloqueTeoria {
  tipo: 'articulo' | 'estructura' | 'biblio' | 'parrafo'
  etiqueta?: string
  texto: string
}

// Lookahead: corta justo ANTES de cada marcador estructural, conservándolo.
const RE_CORTE = /(?=(?:ART[IÍ]CULO|Art[ií]culo)\s+\d+|T[IÍ]TULO\s+(?:PRELIMINAR|[IVXLCDM]+|\d+)|CAP[IÍ]TULO\s+(?:PRIMERO|SEGUNDO|TERCERO|CUARTO|QUINTO|[IVXLCDM]+|\d+)|SECCI[OÓ]N\s+(?:[IVXLCDM]+|\d+)|DISPOSICI[OÓ]N\s+(?:ADICIONAL|TRANSITORIA|DEROGATORIA|FINAL)|BIBLIOGRAF[IÍ]A)/g

const RE_ARTICULO = /^(ART[IÍ]CULO|Art[ií]culo)\s+(\d+)\s*\.?\s*/
const RE_ESTRUCTURA = /^(T[IÍ]TULO|CAP[IÍ]TULO|SECCI[OÓ]N|DISPOSICI[OÓ]N)\b/i

export function parsearTeoria(raw: string): BloqueTeoria[] {
  const limpio = (raw ?? '')
    .replace(/\f/g, '\n')      // form-feed (salto de página del PDF)
    .replace(/ /g, ' ')   // espacios duros
    .replace(/[ \t]+/g, ' ')   // colapsa espacios
    .trim()

  if (!limpio) return []

  const partes = limpio.split(RE_CORTE).map(p => p.trim()).filter(Boolean)

  // Si no se detectó ninguna estructura, devolvemos el texto como un único párrafo.
  if (partes.length <= 1 && !RE_ARTICULO.test(limpio) && !RE_ESTRUCTURA.test(limpio)) {
    return [{ tipo: 'parrafo', texto: limpio }]
  }

  return partes.map((parte): BloqueTeoria => {
    const art = parte.match(RE_ARTICULO)
    if (art) {
      return { tipo: 'articulo', etiqueta: `Artículo ${art[2]}`, texto: parte.slice(art[0].length).trim() }
    }
    if (/^BIBLIOGRAF[IÍ]A/i.test(parte)) {
      return { tipo: 'biblio', texto: parte.replace(/^BIBLIOGRAF[IÍ]A\s*[•:.-]?\s*/i, '').trim() }
    }
    if (RE_ESTRUCTURA.test(parte) && parte.length <= 110) {
      return { tipo: 'estructura', texto: parte }
    }
    return { tipo: 'parrafo', texto: parte }
  })
}
