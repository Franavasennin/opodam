// scripts/sp-gen-teoria.mjs
// LOOP B: genera la teoría en español (secciones + esquema mermaid + flashcards)
// de un tema de security-plus a partir de su(s) transcripción(es) en inglés.
// Uso: node scripts/sp-gen-teoria.mjs <temaId> <ruta_transcripcion.txt> [--force]
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dir = dirname(fileURLToPath(import.meta.url))
const MISTRAL_URL = 'https://api.mistral.ai/v1/chat/completions'
const MODEL = 'mistral-small-latest'

const [temaIdArg, rutaTranscripcion] = process.argv.slice(2).filter(a => a !== '--force')
const force = process.argv.includes('--force')
const temaId = Number(temaIdArg)
if (!temaId || !rutaTranscripcion) {
  console.error('Uso: node scripts/sp-gen-teoria.mjs <temaId> <ruta_transcripcion.txt> [--force]')
  process.exit(1)
}

function leerEnv() {
  try {
    for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
      const m = line.match(/^\s*MISTRAL_API_KEY\s*=\s*(.+?)\s*$/)
      if (m) return m[1].replace(/^["']|["']$/g, '')
    }
  } catch { /* */ }
  return process.env.MISTRAL_API_KEY
}
const KEY = leerEnv()
if (!KEY) { console.error('No hay MISTRAL_API_KEY en .env.local'); process.exit(1) }

const temasMeta = JSON.parse(readFileSync('scripts/security-plus-temas.json', 'utf8')).temas
const meta = temasMeta.find(t => t.id === temaId)
if (!meta) { console.error(`Tema ${temaId} no existe en security-plus-temas.json`); process.exit(1) }

const rutaTema = join(__dir, `../src/data/topics/security-plus/tema-${String(temaId).padStart(2, '0')}.json`)
if (existsSync(rutaTema) && !force) {
  const actual = JSON.parse(readFileSync(rutaTema, 'utf8'))
  if (actual.secciones?.[0]?.contenido?.length > 100 && !actual.secciones[0].contenido.includes('[DUMMY')) {
    console.log(`tema-${temaId}: ya tiene teoría, salto (usa --force para regenerar)`)
    process.exit(0)
  }
}

const transcripcion = readFileSync(rutaTranscripcion, 'utf8')

function extraerJSON(t) {
  t = (t || '').trim().replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim()
  const i = t.indexOf('{'), j = t.lastIndexOf('}')
  if (i < 0 || j < 0) return null
  try { return JSON.parse(t.slice(i, j + 1)) } catch { return null }
}

function prompt(titulo, subepigrafe, transcripcion) {
  return `Eres un experto en ciberseguridad preparando material de estudio en ESPAÑOL para el examen CompTIA Security+ SY0-701, tema "${subepigrafe} ${titulo}".

A partir EXCLUSIVAMENTE de la siguiente transcripción en inglés (vídeo de Professor Messer), genera contenido de estudio.

REGLAS DE ESTILO (muy importantes):
- Redacción en español natural y claro.
- Los términos técnicos clave se mantienen en INGLÉS, con su traducción entre paréntesis SOLO la primera vez que aparecen. Ejemplo: "Un ataque de phishing (suplantación de identidad por correo) busca...". Las siguientes veces, usa solo el término en inglés.
- Las siglas NUNCA se traducen (RBAC, MFA, DLP, SIEM, etc.).
- No inventes información que no esté en la transcripción. No omitas conceptos ni ejemplos relevantes que sí estén.
- TEXTO PLANO, PROHIBIDO usar sintaxis Markdown: nada de **negrita**, *cursiva*, # encabezados, ni tablas con "|". El renderizador de la app NO interpreta Markdown, lo mostraría literal.
- Para un subtítulo de sección, usa una línea corta EN MAYÚSCULAS SIN PUNTUACIÓN FINAL (ej.: "TIPOS DE ACTORES DE AMENAZA") en su propia línea, seguida de salto de párrafo. Aplica esto también a sub-subtítulos: si dentro de una sección enumeras varias categorías o conceptos con nombre propio (ej. cada tipo de actor de amenaza, cada fase de un proceso), pon el NOMBRE de cada uno en su propia línea EN MAYÚSCULAS antes del párrafo que lo explica — no lo dejes pegado al texto.
- Para listas, usa líneas que empiecen por "- " (guión y espacio), una por ítem.
- Separa cada párrafo y cada subtítulo con una línea en blanco (\\n\\n).

Devuelve SOLO JSON con esta forma exacta:
{
  "contenido": "texto largo en español (mínimo 800 palabras si la transcripción da para ello), texto plano sin markdown, con saltos de párrafo \\n\\n entre bloques temáticos y subtítulos en MAYÚSCULAS en su propia línea",
  "esquema_mermaid": "código mermaid empezando por 'graph TD', con el concepto principal y sus subconceptos como nodos cortos en español (máx 12 nodos)",
  "flashcards": [{ "pregunta": "...", "respuesta": "..." }]
}
Genera entre 8 y 12 flashcards que cubran los conceptos clave del tema, en español (con términos técnicos en inglés donde aplique).

TRANSCRIPCIÓN:
${transcripcion}`
}

async function generar() {
  const body = {
    model: MODEL,
    messages: [{ role: 'user', content: prompt(meta.titulo, meta.subepigrafe, transcripcion) }],
    temperature: 0.3,
    max_tokens: 8000,
    response_format: { type: 'json_object' },
  }
  for (let i = 1; i <= 4; i++) {
    const ctrl = new AbortController()
    const to = setTimeout(() => ctrl.abort(), 120000)
    try {
      const r = await fetch(MISTRAL_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${KEY}` },
        body: JSON.stringify(body),
        signal: ctrl.signal,
      })
      clearTimeout(to)
      if (r.status === 429) { const w = 8000 * i; console.log(`  429, espero ${w}ms…`); await new Promise(s => setTimeout(s, w)); continue }
      if (!r.ok) { console.error('  Mistral', r.status, (await r.text()).slice(0, 200)); return null }
      const d = await r.json()
      const contenidoBruto = d?.choices?.[0]?.message?.content ?? ''
      const finish = d?.choices?.[0]?.finish_reason
      const p = extraerJSON(contenidoBruto)
      if (p && typeof p.contenido === 'string' && p.contenido.length > 200 && typeof p.esquema_mermaid === 'string' && Array.isArray(p.flashcards)) {
        return p
      }
      console.log(`  respuesta no válida (finish_reason=${finish}, ${contenidoBruto.length} chars), reintento…`)
    } catch (e) {
      clearTimeout(to)
      console.error('  error', String(e.message || e))
    }
    await new Promise(s => setTimeout(s, 2000))
  }
  return null
}

const res = await generar()
if (!res) {
  console.error(`tema-${temaId}: FALLO generando teoría`)
  process.exit(1)
}

let mermaid = res.esquema_mermaid.trim()
if (!/^graph\s/.test(mermaid) && !/^flowchart\s/.test(mermaid)) {
  mermaid = `graph TD\n${mermaid}`
}

let preguntasPrevias = []
if (existsSync(rutaTema)) {
  const previo = JSON.parse(readFileSync(rutaTema, 'utf8'))
  const eraDummy = (previo.secciones?.[0]?.contenido ?? '').includes('[DUMMY')
  if (!eraDummy) preguntasPrevias = previo.preguntas ?? []
}

const tema = {
  id: temaId,
  titulo: `${meta.subepigrafe} · ${meta.titulo}`,
  bloque: 'general',
  secciones: [{ titulo: '', contenido: res.contenido }],
  esquemas: [{ tipo: 'mermaid', titulo: 'Esquema del tema', codigo: mermaid }],
  mapaMental: { nodos: [], aristas: [] },
  flashcards: res.flashcards.map((f, i) => ({ id: `fc${temaId}-${String(i + 1).padStart(2, '0')}`, pregunta: f.pregunta, respuesta: f.respuesta })),
  preguntas: preguntasPrevias,
}

writeFileSync(rutaTema, JSON.stringify(tema, null, 2), 'utf8')
console.log(`tema-${temaId}: teoría generada (${res.contenido.length} caracteres, ${tema.flashcards.length} flashcards) -> ${rutaTema}`)
