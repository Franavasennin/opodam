// scripts/sp-vtt-a-texto.mjs
// Limpia un .vtt de YouTube (timestamps por palabra + líneas duplicadas por
// solapamiento) a texto plano legible. Uso: node scripts/sp-vtt-a-texto.mjs <entrada.vtt> <salida.txt>
import { readFileSync, writeFileSync } from 'fs'

const [entrada, salida] = process.argv.slice(2)
if (!entrada || !salida) {
  console.error('Uso: node scripts/sp-vtt-a-texto.mjs <entrada.vtt> <salida.txt>')
  process.exit(1)
}

const raw = readFileSync(entrada, 'utf8')

function limpiarLinea(l) {
  return l.replace(/<[^>]+>/g, '').trim()
}

const lineas = raw.split('\n')
const vistas = new Set()
const salidaLineas = []

for (const linea of lineas) {
  const l = linea.trim()
  if (!l) continue
  if (l === 'WEBVTT') continue
  if (l.startsWith('Kind:') || l.startsWith('Language:')) continue
  if (/^\d{2}:\d{2}:\d{2}\.\d{3}\s*-->/.test(l)) continue
  if (/^align:|^position:/.test(l)) continue

  const limpia = limpiarLinea(l)
  if (!limpia) continue
  const clave = limpia.toLowerCase()
  if (vistas.has(clave)) continue
  vistas.add(clave)
  salidaLineas.push(limpia)
}

const texto = salidaLineas.join(' ').replace(/\s+/g, ' ').trim()

writeFileSync(salida, texto, 'utf8')
console.log(`${entrada} -> ${salida} (${texto.length} caracteres)`)
