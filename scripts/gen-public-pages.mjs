// scripts/gen-public-pages.mjs
// Genera páginas HTML estáticas indexables por oposición (SEO/GEO):
// public/oposiciones/{slug}/index.html — temario + preguntas de muestra + JSON-LD.
// Netlify sirve estos ficheros estáticos por delante del catch-all SPA (netlify.toml),
// así que quedan visibles para crawlers sin ejecutar JS.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { OPOSICIONES_PUBLICAS } from './public-oposiciones-config.mjs'

const __dir = dirname(fileURLToPath(import.meta.url))
const BASE_URL = 'https://opodam.netlify.app'
const N_MUESTRA = 3 // preguntas de muestra por oposición

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

function leerTemas(slug, numTemas) {
  const temas = []
  for (let i = 1; i <= numTemas; i++) {
    const ruta = join(__dir, `../src/data/topics/${slug}/tema-${String(i).padStart(2, '0')}.json`)
    if (!existsSync(ruta)) continue
    try {
      const d = JSON.parse(readFileSync(ruta, 'utf8'))
      temas.push({ id: d.id ?? i, titulo: d.titulo ?? `Tema ${i}`, preguntas: d.preguntas ?? [] })
    } catch { /* fichero incompleto, se omite */ }
  }
  return temas
}

function muestraPreguntas(temas, n) {
  const todas = temas.flatMap(t => t.preguntas ?? [])
  const normales = todas.filter(p => p.dificultad !== 'dificil')
  return (normales.length >= n ? normales : todas).slice(0, n)
}

function buildJsonLd(op, temas, preguntas) {
  const course = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: `Temario y tests: ${op.nombre}`,
    description: `Preparación completa de ${op.nombre} (${op.descripcion}): ${temas.length} temas, tests y simulacros de examen.`,
    provider: { '@type': 'Organization', name: 'OpoDAM', url: BASE_URL },
    url: `${BASE_URL}/oposiciones/${op.slug}/`,
  }
  const faq = preguntas.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: preguntas.map(p => ({
      '@type': 'Question',
      name: p.enunciado,
      acceptedAnswer: {
        '@type': 'Answer',
        text: `${p.opciones?.[p.respuestaCorrecta] ?? ''}. ${p.explicacion ?? ''}`.trim(),
      },
    })),
  } : null
  return [course, faq].filter(Boolean).map(o => JSON.stringify(o)).join('\n')
}

function buildHtml(op, temas, preguntas) {
  const title = `Temario y tests ${op.nombre} · OpoDAM`
  const description = `Prepara ${op.nombre} en Canarias: ${temas.length} temas completos, tests tipo examen y tutor IA. ${op.descripcion}.`
  const url = `${BASE_URL}/oposiciones/${op.slug}/`

  const temarioHtml = temas.map(t => `      <li>${escapeHtml(t.titulo)}</li>`).join('\n')

  const preguntasHtml = preguntas.map((p, idx) => `
    <article style="margin-bottom:28px;padding:20px;border:1px solid #e1ddcf;border-radius:12px;background:#fbfaf5;">
      <p style="font-weight:600;color:#1a1815;margin:0 0 12px;">${idx + 1}. ${escapeHtml(p.enunciado)}</p>
      <ol type="A" style="margin:0 0 12px;padding-left:20px;color:#3a3631;">
        ${(p.opciones ?? []).map((o, i) => `<li${i === p.respuestaCorrecta ? ' style="font-weight:700;color:#b8492f;"' : ''}>${escapeHtml(o)}</li>`).join('\n        ')}
      </ol>
      <p style="font-size:13px;color:#7b756b;margin:0;"><strong>Explicación:</strong> ${escapeHtml(p.explicacion ?? '')}</p>
    </article>`).join('\n')

  const jsonLd = buildJsonLd(op, temas, preguntas)

  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <link rel="canonical" href="${url}" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="OpoDAM" />
  <meta property="og:url" content="${url}" />
  <meta property="og:image" content="${BASE_URL}/og.png" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <script type="application/ld+json">${jsonLd}</script>
  <style>
    body { margin:0; background:#f6f4ed; color:#1a1815; font-family: system-ui, -apple-system, sans-serif; }
    .wrap { max-width: 720px; margin: 0 auto; padding: 40px 24px 80px; }
    a.cta { display:inline-block; background:#1a1815; color:#fbfaf5; text-decoration:none; padding:12px 22px; border-radius:10px; font-weight:700; margin-top:8px; }
    a.back { color:#7b756b; text-decoration:none; font-size:14px; }
    h1 { font-size: 28px; margin-bottom: 8px; }
    h2 { font-size: 18px; margin-top: 40px; }
    ul { padding-left: 20px; line-height: 1.7; }
  </style>
</head>
<body>
  <div class="wrap">
    <p><a class="back" href="${BASE_URL}/">← OpoDAM</a></p>
    <h1>${escapeHtml(op.nombre)}</h1>
    <p>${escapeHtml(description)}</p>
    <a class="cta" href="${BASE_URL}/onboarding/email">Empezar gratis</a>

    <h2>Temario completo (${temas.length} temas)</h2>
    <ul>
${temarioHtml}
    </ul>

    ${preguntas.length > 0 ? `<h2>Preguntas de muestra</h2>\n${preguntasHtml}` : ''}
  </div>
</body>
</html>
`
}

let generadas = 0
const omitidas = []
for (const op of OPOSICIONES_PUBLICAS) {
  const temas = leerTemas(op.slug, op.numTemas)
  if (temas.length === 0) {
    omitidas.push(op.slug)
    console.log(`oposiciones/${op.slug}: omitida (sin JSON de temario todavía)`)
    continue
  }
  const preguntas = muestraPreguntas(temas, N_MUESTRA)
  const html = buildHtml(op, temas, preguntas)

  const dirDestino = join(__dir, `../public/oposiciones/${op.slug}`)
  mkdirSync(dirDestino, { recursive: true })
  writeFileSync(join(dirDestino, 'index.html'), html, 'utf8')
  generadas++
  console.log(`oposiciones/${op.slug}/index.html: ${temas.length} temas, ${preguntas.length} preguntas de muestra`)
}
console.log(`\n${generadas} páginas públicas generadas${omitidas.length ? `, ${omitidas.length} omitidas (${omitidas.join(', ')})` : ''}.`)
