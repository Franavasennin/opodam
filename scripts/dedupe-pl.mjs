// scripts/dedupe-pl.mjs
// Elimina duplicados exactos detectados por audit-policia-local.mjs DENTRO del mismo tema
// (mismo enunciado repetido en el mismo pool de test). Se conserva el primer id de cada par.
import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
const __dir = dirname(fileURLToPath(import.meta.url))

// [tema, idAEliminar]
const A_ELIMINAR = [
  ['07', 'p7-D02'],
  ['15', 'p15-11'],
  ['15', 'p15-12'],
  ['19', 'p19-96'],
  ['24', 'p24-05'],
  ['24', 'p24-06'],
  ['35', 'p35-36'],
  ['35', 'p35-34'],
  ['37', 'p37-10'],
  ['37', 'p37-11'],
]

const porTema = new Map()
for (const [tema, id] of A_ELIMINAR) {
  if (!porTema.has(tema)) porTema.set(tema, [])
  porTema.get(tema).push(id)
}

for (const [tema, ids] of porTema) {
  const ruta = join(__dir, `../src/data/topics/policia-local/tema-${tema}.json`)
  const d = JSON.parse(readFileSync(ruta, 'utf8'))
  const antes = d.preguntas.length
  d.preguntas = d.preguntas.filter(p => !ids.includes(p.id))
  writeFileSync(ruta, JSON.stringify(d, null, 2), 'utf8')
  console.log(`tema-${tema}: ${antes} -> ${d.preguntas.length} (eliminadas: ${ids.join(', ')})`)
}
