// scripts/audit-aws-security.mjs
// GATE automático para aws-security: 16 temas (uno por task statement oficial
// SCS-C03), volumen de preguntas ponderado por peso de dominio (10-32/tema,
// gen-ai-temas.mjs --count, sin campo `dificultad`). Distinto de
// audit-security-plus.mjs, que exige 100 preguntas fijas y distribución
// 80/20 — ese criterio no aplica a este pipeline.
// Uso: node scripts/audit-aws-security.mjs [tema]   (sin arg: audita los 16)
import { readFileSync, existsSync } from 'fs'
import { execSync } from 'child_process'

const TOTAL_TEMAS = 16
const MIN_PREGUNTAS = 5   // el generador pide 10-32 según tema; por debajo de 5 el tema es inservible
const MIN_FLASHCARDS = 5
// Casi-duplicado: mismo par que usa gen-ai-temas.mjs para rechazar en
// generación. Se repite aquí porque el generador solo compara contra lo ya
// acumulado en su propia tanda — si el gate se relanza sobre ficheros que se
// tocaron a mano, esta es la única red de seguridad.
const UMBRAL_SIMILITUD = 0.55
const STOPWORDS = new Set(['que', 'como', 'para', 'esta', 'este', 'estos', 'estas', 'segun', 'desde', 'entre', 'cual', 'cuales', 'permite', 'permiten', 'servicio', 'aws', 'amazon', 'datos', 'sobre', 'cuando', 'donde', 'pero', 'sido', 'sera', 'tiene', 'tienen'])
function tokens(s) {
  const n = String(s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9\s]/g, ' ')
  return new Set(n.split(/\s+/).filter(w => w.length >= 4 && !STOPWORDS.has(w)))
}
function jaccard(a, b) {
  const ta = tokens(a), tb = tokens(b)
  if (!ta.size || !tb.size) return 0
  let inter = 0
  for (const w of ta) if (tb.has(w)) inter++
  return inter / (ta.size + tb.size - inter)
}

const PLACEHOLDERS = [
  'ver fundamento', 'según la teoría', 'ver explicación', 'consulta el temario',
  'es la respuesta correcta según el contenido', 'sin explicación disponible',
]
const RE_NA = /(^|[\s(])n\/a([\s).,;:]|$)/

function normalizar(s) {
  return String(s ?? '').toLowerCase().trim()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ').replace(/[¿?¡!.,]/g, '')
}

const argTema = process.argv[2] ? Number(process.argv[2]) : null
const temas = argTema ? [argTema] : Array.from({ length: TOTAL_TEMAS }, (_, i) => i + 1)

let totalErrores = 0
const enunciadosGlobales = new Map()

for (const num of temas) {
  const n = String(num).padStart(2, '0')
  const ruta = `src/data/topics/aws-security/tema-${n}.json`
  if (!existsSync(ruta)) { console.log(`tema-${n}: NO EXISTE, salto`); continue }

  let d
  try { d = JSON.parse(readFileSync(ruta, 'utf8')) }
  catch (e) { console.log(`tema-${n}: JSON INVÁLIDO — ${e.message}`); totalErrores++; continue }

  const preguntas = d.preguntas ?? []
  const flashcards = d.flashcards ?? []
  const errores = []

  if (preguntas.length < MIN_PREGUNTAS) errores.push(`preguntas=${preguntas.length}, mínimo ${MIN_PREGUNTAS}`)
  if (flashcards.length < MIN_FLASHCARDS) errores.push(`flashcards=${flashcards.length}, mínimo ${MIN_FLASHCARDS}`)
  if (!d.secciones?.length || !d.secciones.some(s => (s.contenido ?? '').trim().length > 200)) {
    errores.push('teoría (secciones) ausente o demasiado corta')
  }

  const idsTema = new Set()
  for (const p of preguntas) {
    const pref = `[${p.id ?? '?'}]`
    if (!p.id) errores.push(`${pref} sin id`)
    else if (idsTema.has(p.id)) errores.push(`${pref} id duplicado dentro del tema`)
    idsTema.add(p.id)

    if (!p.enunciado || p.enunciado.trim().length < 15) errores.push(`${pref} enunciado vacío o < 15 caracteres`)

    if (!Array.isArray(p.opciones) || p.opciones.length !== 4) {
      errores.push(`${pref} opciones=${Array.isArray(p.opciones) ? p.opciones.length : 'undefined'} (deben ser 4)`)
    } else {
      if (p.opciones.some(o => !o || String(o).trim() === '')) errores.push(`${pref} opción vacía`)
      const normOpc = p.opciones.map(o => normalizar(o))
      if (new Set(normOpc).size !== normOpc.length) errores.push(`${pref} opciones duplicadas entre sí`)
    }

    if (typeof p.respuestaCorrecta !== 'number' || p.respuestaCorrecta < 0 || p.respuestaCorrecta > 3) {
      errores.push(`${pref} respuestaCorrecta=${p.respuestaCorrecta} (debe ser 0-3)`)
    }

    if (!p.explicacion || p.explicacion.trim().length < 20) {
      errores.push(`${pref} explicación vacía o < 20 caracteres`)
    } else if (PLACEHOLDERS.some(ph => normalizar(p.explicacion).includes(ph)) || RE_NA.test(normalizar(p.explicacion))) {
      errores.push(`${pref} explicación parece un placeholder genérico: "${p.explicacion.slice(0, 60)}"`)
    }

    const clave = normalizar(p.enunciado)
    if (clave) {
      if (!enunciadosGlobales.has(clave)) enunciadosGlobales.set(clave, [])
      enunciadosGlobales.get(clave).push({ tema: n, id: p.id })
    }
  }

  for (let i = 0; i < preguntas.length; i++) {
    for (let j = i + 1; j < preguntas.length; j++) {
      const sim = jaccard(preguntas[i].enunciado, preguntas[j].enunciado)
      if (sim >= UMBRAL_SIMILITUD) {
        errores.push(`[${preguntas[i].id}] casi-duplicado de [${preguntas[j].id}] (similitud ${sim.toFixed(2)})`)
      }
    }
  }

  const idsFc = new Set()
  for (const f of flashcards) {
    if (idsFc.has(f.id)) errores.push(`[fc:${f.id}] id de flashcard duplicado`)
    idsFc.add(f.id)
    if (!f.pregunta || !f.respuesta) errores.push(`[fc:${f.id ?? '?'}] pregunta o respuesta vacía`)
  }

  for (const esq of d.esquemas ?? []) {
    if (esq.tipo === 'mermaid' && esq.codigo) {
      if (!/^graph\s/.test(esq.codigo.trim()) && !/^flowchart\s/.test(esq.codigo.trim())) {
        errores.push(`esquema "${esq.titulo}" no empieza por "graph"/"flowchart" — puede no parsear`)
      }
    }
  }

  if (errores.length === 0) {
    console.log(`tema-${n}: OK (${preguntas.length} preguntas, ${flashcards.length} flashcards)`)
  } else {
    console.log(`tema-${n}: ${errores.length} error(es)`)
    errores.slice(0, 20).forEach(e => console.log(`  - ${e}`))
    if (errores.length > 20) console.log(`  ... y ${errores.length - 20} más`)
    totalErrores += errores.length
  }
}

const dupsMismoTema = [...enunciadosGlobales.entries()]
  .map(([clave, ocs]) => ({ clave, ocs }))
  .filter(({ ocs }) => {
    const porTema = new Map()
    for (const o of ocs) porTema.set(o.tema, (porTema.get(o.tema) ?? 0) + 1)
    return [...porTema.values()].some(c => c > 1)
  })

if (dupsMismoTema.length > 0) {
  console.log(`\nDuplicados EXACTOS dentro del mismo tema: ${dupsMismoTema.length}`)
  dupsMismoTema.slice(0, 15).forEach(({ clave, ocs }) =>
    console.log(`  "${clave.slice(0, 60)}" -> ${ocs.map(o => `t${o.tema}:${o.id}`).join(', ')}`))
  totalErrores += dupsMismoTema.length
}

console.log(`\n=== TOTAL ERRORES: ${totalErrores} ===`)

try {
  execSync('npx tsc -b --force', { stdio: 'pipe' })
  console.log('tsc -b --force: OK')
} catch (e) {
  console.log('tsc -b --force: FALLA')
  console.log(e.stdout?.toString().slice(0, 2000) ?? '')
  totalErrores++
}

process.exit(totalErrores > 0 ? 1 : 0)
