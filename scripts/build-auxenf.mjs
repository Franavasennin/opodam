// Convierte los resúmenes de Auxiliar de Enfermería (TCAE) y construye los 24 tema-NN.json.
// Teoría únicamente (flashcards/preguntas se añaden después). Uso: node scripts/build-auxenf.mjs
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const SRC = 'E:/opodam/AuxENF/PASAR MATERIALES ALUMNOS (septiembre 2022)/RESUMENES ACTUALIZADOS'
const MD = '.tmp_md/auxenf'
const OUT = 'src/data/topics/aux-enfermeria'
fs.mkdirSync(MD, { recursive: true })
fs.mkdirSync(OUT, { recursive: true })

const TITULOS = {
  1: 'Derechos y obligaciones. Ley 31/1995 de Prevención de Riesgos Laborales',
  2: 'Funciones del Técnico en Cuidados Auxiliares de Enfermería (TCAE)',
  3: 'Higiene del recién nacido y del adulto',
  4: 'El paciente encamado',
  5: 'La exploración',
  6: 'Constantes vitales',
  7: 'Vigilancia del enfermo',
  8: 'Eliminación',
  9: 'Recogida de muestras y residuos',
  10: 'Alimentación',
  11: 'Medicamentos',
  12: 'Aplicación de frío y calor',
  13: 'Oxigenoterapia',
  14: 'Higiene de centros sanitarios',
  15: 'Desinfección y asepsia',
  16: 'Esterilización',
  17: 'La gestante',
  18: 'Recién nacido y lactante',
  19: 'Traumatismos',
  20: 'Paciente terminal, toxicomanías, salud mental y el anciano',
  21: 'Úlceras por presión (UPP)',
  22: 'Urgencias',
  23: 'Salud laboral',
  24: 'Documentación sanitaria',
}

const NOISE = [
  /^®$/, /APOLOCAN/i, /Documento protegido/i, /^©/, /Copyright/i,
  /^\d{1,4}$/, /^Página\s+\d+/i, /^\d+\s*\/\s*\d+$/,
  /^ESQUEMA[ -]*RESUMEN/i, /^\(Actualizado/i,
]
function limpiar(raw) {
  let lines = raw.replace(/\f/g, '\n').split('\n')
  lines = lines.map(l => l.replace(/ /g, ' ').replace(/[ \t]{2,}/g, ' ').replace(/\s+$/, ''))
    .filter(l => { const t = l.trim(); if (!t) return true; return !NOISE.some(re => re.test(t)) })
  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim()
}

// Convierte cada resumen a md y agrupa por nº de tema
const pdfs = fs.readdirSync(SRC).filter(f => f.toLowerCase().endsWith('.pdf') && !f.startsWith('._'))
const porTema = {}
for (const pdf of pdfs) {
  const m = pdf.match(/TEMA\s+(\d+)(?:\.(\d+))?/i)
  if (!m) { console.log('SKIP', pdf); continue }
  const tema = parseInt(m[1], 10)
  const sub = m[2] ? parseInt(m[2], 10) : 0
  const mdName = `t${String(tema).padStart(2, '0')}_${sub}.md`
  const mdPath = path.join(MD, mdName)
  if (!fs.existsSync(mdPath) || fs.statSync(mdPath).size < 100) {
    execFileSync('py', ['-m', 'markitdown', path.join(SRC, pdf), '-o', mdPath], { stdio: 'ignore' })
  }
  ;(porTema[tema] ??= []).push({ sub, mdPath })
}

let ok = 0
for (let id = 1; id <= 24; id++) {
  const partes = (porTema[id] || []).sort((a, b) => a.sub - b.sub)
  if (!partes.length) { console.error('SIN RESUMEN tema', id); continue }
  const contenido = partes.map(p => limpiar(fs.readFileSync(p.mdPath, 'utf8'))).join('\n\n').trim()
  const tema = {
    id,
    titulo: TITULOS[id],
    bloque: 'general',
    secciones: [{ titulo: '', contenido }],
    esquemas: [],
    mapaMental: { nodos: [], aristas: [] },
    flashcards: [],
    preguntas: [],
  }
  fs.writeFileSync(path.join(OUT, `tema-${String(id).padStart(2, '0')}.json`), JSON.stringify(tema, null, 2) + '\n', 'utf8')
  console.log(`OK tema-${String(id).padStart(2, '0')} (${contenido.length} chars)`)
  ok++
}
console.log('\ntemas creados:', ok)
