import { writeFileSync, existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { OPOSICIONES_PUBLICAS } from './public-oposiciones-config.mjs'
const __dir = dirname(fileURLToPath(import.meta.url))

const BASE_URL = 'https://opodam.netlify.app'

// Solo incluir oposiciones cuya página estática exista realmente (gen-public-pages.mjs
// omite las que aún no tienen JSON de temario, ej. aux-judicial).
const oposicionesConPagina = OPOSICIONES_PUBLICAS.filter(op =>
  existsSync(join(__dir, `../public/oposiciones/${op.slug}/index.html`))
)

// Rutas públicas reales (sin sesión), según src/App.tsx + páginas estáticas por oposición (Fase 3).
const RUTAS_PUBLICAS = [
  { path: '/', changefreq: 'weekly', priority: '1.0' },
  { path: '/equivalencias', changefreq: 'monthly', priority: '0.6' },
  { path: '/terminos', changefreq: 'yearly', priority: '0.2' },
  { path: '/privacidad', changefreq: 'yearly', priority: '0.2' },
  { path: '/reembolsos', changefreq: 'yearly', priority: '0.2' },
  ...oposicionesConPagina.map(op => ({ path: `/oposiciones/${op.slug}/`, changefreq: 'monthly', priority: '0.8' })),
]

const hoy = new Date().toISOString().slice(0, 10)

const urls = RUTAS_PUBLICAS.map(r => `  <url>
    <loc>${BASE_URL}${r.path}</loc>
    <lastmod>${hoy}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>`).join('\n')

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`

const destino = join(__dir, '../public/sitemap.xml')
writeFileSync(destino, xml, 'utf8')
console.log(`sitemap.xml generado con ${RUTAS_PUBLICAS.length} rutas -> ${destino}`)
