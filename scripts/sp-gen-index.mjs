// scripts/sp-gen-index.mjs
// Genera src/data/topics/security-plus/index.ts a partir de scripts/security-plus-temas.json.
import { readFileSync, writeFileSync } from 'fs'

const d = JSON.parse(readFileSync('scripts/security-plus-temas.json', 'utf8'))

const lineas = d.temas.map(t => {
  const titulo = `${t.subepigrafe} · ${t.titulo}`.replace(/'/g, "\\'")
  return `  { id: ${t.id}, titulo: '${titulo}', bloque: 'general' },`
}).join('\n')

const contenido = `import type { Tema } from '../../../types'

export const TEMAS_META = [
${lineas}
] as const

export type TemaMeta = typeof TEMAS_META[number]
export const TOTAL_TEMAS = TEMAS_META.length // 30

export async function cargarTema(id: number): Promise<Tema> {
  if (id < 1 || id > TOTAL_TEMAS) throw new Error(\`Tema con id \${id} no encontrado\`)
  const fileName = \`tema-\${String(id).padStart(2, '0')}\`
  const modulo = await import(\`./\${fileName}.json\`)
  return modulo.default as Tema
}
`

writeFileSync('src/data/topics/security-plus/index.ts', contenido, 'utf8')
console.log(`index.ts escrito con ${d.temas.length} temas`)
