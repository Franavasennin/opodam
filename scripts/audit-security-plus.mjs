// scripts/audit-security-plus.mjs
// GATE automático: ningún tema de security-plus pasa a "listo" si esto no da 0 errores.
// Uso: node scripts/audit-security-plus.mjs [tema]   (sin arg: audita los 30)
import { readFileSync, existsSync } from 'fs'
import { execSync } from 'child_process'

const PLACEHOLDERS = [
  'ver fundamento', 'según la teoría', 'ver explicación', 'consulta el temario',
  'es la respuesta correcta según el contenido', 'sin explicación disponible',
]
// 'n/a' se comprueba aparte como palabra suelta: como substring simple daba falsos
// positivos en textos legítimos que contienen "n/a" dentro de otra palabra
// (p.ej. "admin/admin", "detección/análisis").
const RE_NA = /(^|[\s(])n\/a([\s).,;:]|$)/

function normalizar(s) {
  return String(s ?? '').toLowerCase().trim()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ').replace(/[¿?¡!.,]/g, '')
}

const argTema = process.argv[2] ? Number(process.argv[2]) : null
const temas = argTema ? [argTema] : Array.from({ length: 30 }, (_, i) => i + 1)

let totalErrores = 0
const enunciadosGlobales = new Map()

for (const num of temas) {
  const n = String(num).padStart(2, '0')
  const ruta = `src/data/topics/security-plus/tema-${n}.json`
  if (!existsSync(ruta)) {
    console.log(`tema-${n}: NO EXISTE, salto`)
    continue
  }
  let d
  try {
    d = JSON.parse(readFileSync(ruta, 'utf8'))
  } catch (e) {
    console.log(`tema-${n}: JSON INVÁLIDO — ${e.message}`)
    totalErrores++
    continue
  }

  const preguntas = d.preguntas ?? []
  const errores = []

  if (preguntas.length !== 100) {
    errores.push(`total=${preguntas.length}, esperado 100`)
  }

  const idsTema = new Set()
  let normales = 0, dificiles = 0

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

    if (p.dificultad !== 'normal' && p.dificultad !== 'dificil') {
      errores.push(`${pref} dificultad="${p.dificultad}" (debe ser literal 'normal' o 'dificil', sin tilde)`)
    } else {
      if (p.dificultad === 'normal') normales++
      else dificiles++
    }

    const clave = normalizar(p.enunciado)
    if (clave) {
      if (!enunciadosGlobales.has(clave)) enunciadosGlobales.set(clave, [])
      enunciadosGlobales.get(clave).push({ tema: n, id: p.id })
    }
  }

  if (preguntas.length === 100 && Math.abs(normales - 80) > 5) {
    errores.push(`distribución fuera de rango: ${normales} normales / ${dificiles} difíciles (objetivo 80/20 ±5)`)
  }

  for (const esq of d.esquemas ?? []) {
    if (esq.tipo === 'mermaid' && esq.codigo) {
      if (!/^graph\s/.test(esq.codigo.trim()) && !/^flowchart\s/.test(esq.codigo.trim())) {
        errores.push(`esquema "${esq.titulo}" no empieza por "graph"/"flowchart" — puede no parsear`)
      }
    }
  }

  if (errores.length === 0) {
    console.log(`tema-${n}: OK (100 preguntas, ${normales} normales / ${dificiles} difíciles)`)
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
