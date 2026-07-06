// scripts/fix-schema-pl.mjs
// Corrige preguntas de policia-local generadas con el esquema equivocado
// (pregunta/correcta en vez de enunciado/respuestaCorrecta).
import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
const __dir = dirname(fileURLToPath(import.meta.url))

const TEMAS_AFECTADOS = [21, 22, 25]

for (const num of TEMAS_AFECTADOS) {
  const n = String(num).padStart(2, '0')
  const ruta = join(__dir, `../src/data/topics/policia-local/tema-${n}.json`)
  const d = JSON.parse(readFileSync(ruta, 'utf8'))
  let corregidas = 0
  d.preguntas = d.preguntas.map(p => {
    const q = { ...p }
    if (q.pregunta !== undefined && q.enunciado === undefined) {
      q.enunciado = q.pregunta
      delete q.pregunta
      corregidas++
    }
    if (q.correcta !== undefined && q.respuestaCorrecta === undefined) {
      q.respuestaCorrecta = q.correcta
      delete q.correcta
    }
    if (q.dificultad === undefined) q.dificultad = 'normal'
    return q
  })
  writeFileSync(ruta, JSON.stringify(d, null, 2), 'utf8')
  console.log(`tema-${n}: ${corregidas} preguntas corregidas (esquema pregunta/correcta -> enunciado/respuestaCorrecta)`)
}
