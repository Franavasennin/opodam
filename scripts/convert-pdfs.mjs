// Convierte PDFs de temarios a markdown con MarkItDown.
// Uso: node scripts/convert-pdfs.mjs <dirOrigen> <modo> <dirDestino>
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const [, , srcDir, modo, destDir] = process.argv
fs.mkdirSync(destDir, { recursive: true })

const files = fs.readdirSync(srcDir).filter(f => f.toLowerCase().endsWith('.pdf'))

function destName(file) {
  // Devuelve algo como 'general-01.md' / 'especifica-24.md'
  const m = file.match(/(GENERAL|ESPECIFICA)-TEMA-(\d+)/i)
  if (!m) return null
  return `${m[1].toLowerCase()}-${m[2].padStart(2, '0')}.md`
}

let ok = 0, skip = 0, fail = 0
for (const file of files) {
  const out = destName(file)
  if (!out) { console.log('SKIP (sin patrón):', file); skip++; continue }
  const outPath = path.join(destDir, out)
  if (fs.existsSync(outPath) && fs.statSync(outPath).size > 100) { skip++; continue }
  try {
    execFileSync('py', ['-m', 'markitdown', path.join(srcDir, file), '-o', outPath], { stdio: 'ignore' })
    console.log('OK', file, '→', out)
    ok++
  } catch (e) {
    console.error('FAIL', file, e.message)
    fail++
  }
}
console.log(`\n[${modo}] convertidos=${ok} saltados=${skip} fallos=${fail}`)
