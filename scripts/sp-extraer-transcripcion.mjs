// scripts/sp-extraer-transcripcion.mjs
// LOOP A: descarga los subtítulos EN de todos los vídeos de un tema de security-plus
// (yt-dlp) y los concatena en un único .txt limpio.
// Uso: node scripts/sp-extraer-transcripcion.mjs <temaId> [--force]
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, rmSync } from 'fs'
import { execSync } from 'child_process'
import { join } from 'path'

const temaId = Number(process.argv[2])
const force = process.argv.includes('--force')
if (!temaId) { console.error('Uso: node scripts/sp-extraer-transcripcion.mjs <temaId> [--force]'); process.exit(1) }

const temasMeta = JSON.parse(readFileSync('scripts/security-plus-temas.json', 'utf8')).temas
const meta = temasMeta.find(t => t.id === temaId)
if (!meta) { console.error(`Tema ${temaId} no existe en security-plus-temas.json`); process.exit(1) }

const OUT_DIR = 'scripts/transcripciones'
mkdirSync(OUT_DIR, { recursive: true })
const rutaSalida = join(OUT_DIR, `tema-${String(temaId).padStart(2, '0')}.txt`)

if (existsSync(rutaSalida) && !force) {
  console.log(`tema-${temaId}: transcripción ya existe, salto (usa --force para re-extraer)`)
  process.exit(0)
}

function limpiarLinea(l) { return l.replace(/<[^>]+>/g, '').trim() }

function limpiarVtt(raw) {
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
  return salidaLineas.join(' ').replace(/\s+/g, ' ').trim()
}

const tmpDir = join(OUT_DIR, `._tmp-tema-${temaId}`)
mkdirSync(tmpDir, { recursive: true })

const partes = []
for (const v of meta.videos) {
  process.stdout.write(`  [tema-${temaId}] ${v.titulo} (${v.youtubeId})… `)
  try {
    execSync(
      `py -m yt_dlp --write-sub --write-auto-sub --sub-lang en --skip-download --sub-format vtt -o "${v.youtubeId}.%(ext)s" "https://www.youtube.com/watch?v=${v.youtubeId}"`,
      { cwd: tmpDir, stdio: 'pipe' }
    )
  } catch (e) {
    console.log('FALLO yt-dlp')
    console.error(String(e.stderr || e.message || e).slice(0, 300))
    continue
  }
  const archivos = readdirSync(tmpDir).filter(f => f.startsWith(v.youtubeId) && f.endsWith('.vtt'))
  if (!archivos.length) { console.log('sin subtítulos'); continue }
  const raw = readFileSync(join(tmpDir, archivos[0]), 'utf8')
  const texto = limpiarVtt(raw)
  console.log(`${texto.length} caracteres`)
  partes.push(`[[${v.titulo}]]\n${texto}`)
}

rmSync(tmpDir, { recursive: true, force: true })

if (!partes.length) { console.error(`tema-${temaId}: no se pudo extraer ningún vídeo`); process.exit(1) }

const completo = partes.join('\n\n')
writeFileSync(rutaSalida, completo, 'utf8')
console.log(`tema-${temaId}: ${partes.length}/${meta.videos.length} vídeos, ${completo.length} caracteres -> ${rutaSalida}`)
