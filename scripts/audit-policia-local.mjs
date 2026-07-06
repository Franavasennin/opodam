// scripts/audit-policia-local.mjs
// Audita src/data/topics/policia-local/*.json en busca de: preguntas duplicadas
// (por id o por enunciado normalizado, dentro del mismo tema y entre temas),
// y preguntas mal formadas (opciones != 4, respuestaCorrecta fuera de rango, campos vacíos).
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
const __dir = dirname(fileURLToPath(import.meta.url))

function normalizar(s) {
  return String(s ?? '').toLowerCase().trim().replace(/\s+/g, ' ').replace(/[¿?¡!.,]/g, '')
}

let totalPreguntas = 0
const idsGlobales = new Map() // id -> [tema]
const enunciadosGlobales = new Map() // enunciado normalizado -> [{tema, id}]
const malFormadas = []
const idsDuplicadosMismoTema = []

for (let i = 1; i <= 37; i++) {
  const num = String(i).padStart(2, '0')
  const ruta = join(__dir, `../src/data/topics/policia-local/tema-${num}.json`)
  let d
  try {
    d = JSON.parse(readFileSync(ruta, 'utf8'))
  } catch (e) {
    console.log(`tema-${num}: ERROR leyendo/parseando (${e.message})`)
    continue
  }
  const preguntas = d.preguntas ?? []
  totalPreguntas += preguntas.length

  const idsEnEsteTema = new Set()
  for (const p of preguntas) {
    if (idsEnEsteTema.has(p.id)) {
      idsDuplicadosMismoTema.push({ tema: num, id: p.id })
    }
    idsEnEsteTema.add(p.id)

    if (!idsGlobales.has(p.id)) idsGlobales.set(p.id, [])
    idsGlobales.get(p.id).push(num)

    const clave = normalizar(p.enunciado)
    if (clave) {
      if (!enunciadosGlobales.has(clave)) enunciadosGlobales.set(clave, [])
      enunciadosGlobales.get(clave).push({ tema: num, id: p.id })
    }

    const problemas = []
    if (!p.id) problemas.push('sin id')
    if (!p.enunciado || p.enunciado.trim().length < 10) problemas.push('enunciado vacío o muy corto')
    if (!Array.isArray(p.opciones) || p.opciones.length !== 4) problemas.push(`opciones=${p.opciones?.length ?? 'undefined'}`)
    if (Array.isArray(p.opciones) && p.opciones.some(o => !o || String(o).trim() === '')) problemas.push('opción vacía')
    if (typeof p.respuestaCorrecta !== 'number' || p.respuestaCorrecta < 0 || p.respuestaCorrecta > 3) problemas.push(`respuestaCorrecta=${p.respuestaCorrecta}`)
    if (!p.explicacion || p.explicacion.trim().length < 5) problemas.push('sin explicación')
    if (problemas.length) malFormadas.push({ tema: num, id: p.id, problemas })
  }
}

console.log(`Total preguntas revisadas: ${totalPreguntas}\n`)

console.log('--- IDs duplicados dentro del mismo tema ---')
console.log(idsDuplicadosMismoTema.length ? idsDuplicadosMismoTema : 'ninguno')

console.log('\n--- IDs que aparecen en más de un tema ---')
const idsRepetidosEntreTemas = [...idsGlobales.entries()].filter(([, temas]) => temas.length > 1)
console.log(idsRepetidosEntreTemas.length ? idsRepetidosEntreTemas : 'ninguno')

console.log('\n--- Enunciados duplicados (misma pregunta, texto normalizado) ---')
const enunciadosDup = [...enunciadosGlobales.entries()].filter(([, arr]) => arr.length > 1)
console.log(`${enunciadosDup.length} enunciados con duplicado`)
for (const [texto, ocurrencias] of enunciadosDup.slice(0, 60)) {
  console.log(`  "${texto.slice(0, 80)}" -> ${ocurrencias.map(o => `t${o.tema}:${o.id}`).join(', ')}`)
}
if (enunciadosDup.length > 60) console.log(`  ... y ${enunciadosDup.length - 60} más`)

console.log(`\n--- Preguntas mal formadas: ${malFormadas.length} ---`)
for (const m of malFormadas.slice(0, 60)) {
  console.log(`  t${m.tema} ${m.id}: ${m.problemas.join(', ')}`)
}
if (malFormadas.length > 60) console.log(`  ... y ${malFormadas.length - 60} más`)
