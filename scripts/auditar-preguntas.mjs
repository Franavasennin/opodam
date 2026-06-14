// Auditoría de calidad de preguntas tipo test (solo lectura).
// Detecta dos clases de problema en los tema-*.json:
//   [CONTRADICCION] la opción marcada como correcta se contradice con su explicación
//                   (p.ej. opción "Fomenta X" + explicación "no fomenta X").
//   [INDICE?]       la explicación coincide afirmativamente con OTRA opción distinta
//                   de la marcada (posible respuestaCorrecta mal apuntada).
// No detecta errores "consistentes pero falsos" (opción y explicación de acuerdo
// en un hecho médicamente incorrecto): eso requiere revisión humana de dominio.
//
// Uso:  node scripts/auditar-preguntas.mjs
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = 'src/data/topics'

function quitarAcentos(s) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '')
}
function norm(s) {
  return quitarAcentos(String(s || '').toLowerCase()).replace(/\s+/g, ' ').trim()
}
function sinPrefijo(opcion) {
  return String(opcion || '').replace(/^[a-z]\)\s*/i, '').trim()
}
// Palabras vacías que no aportan a la comparación.
const STOP = new Set(['el','la','los','las','un','una','de','del','al','a','en','y','o','sobre','que','se','su','sus','con','para','por','es','lo'])
function contenido(frase) {
  return norm(sinPrefijo(frase)).split(' ').filter(w => w.length > 2 && !STOP.has(w))
}
// ¿El texto niega esta palabra? ("no/nunca/tampoco" + la palabra dentro de 0-2 tokens)
function niegaPalabra(texto, p) {
  const re = new RegExp(`\\b(no|nunca|tampoco)\\b(?:\\s+\\w+){0,2}\\s+\\b${p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`)
  return re.test(norm(texto))
}
// ¿La explicación CONTRADICE la frase? Solo cuenta si la explicación niega una
// palabra que la frase AFIRMA. Si la frase ya contiene esa misma negación
// ("no contamina", "no retroactividad"…), es acuerdo, no contradicción.
function explicacionContradice(expl, frase) {
  const palabras = contenido(frase)
  if (!palabras.length) return false
  // "no solo X sino Y" no es negación de X/Y, sino énfasis aditivo.
  const e = norm(expl).replace(/\bno solo\b/g, ' ')
  for (const p of palabras) {
    if (niegaPalabra(e, p) && !niegaPalabra(frase, p)) return true
  }
  return false
}
// Una pregunta ya negativa ("¿Qué está prohibido?", "NO se puede…") invierte la
// polaridad: la explicación negará la opción correcta. La detección de
// contradicción no es fiable ahí, así que se omite.
function preguntaNegativa(enunciado) {
  return /\b(no|nunca|jamas|prohibid\w*|salvo|excepto|incorrect\w*|fals\w*)\b/.test(norm(enunciado))
}
// ¿La explicación afirma esta frase? (al menos la mitad de sus palabras de contenido aparecen y NO la contradice)
function explicacionAfirma(expl, frase) {
  const e = norm(expl)
  const palabras = contenido(frase)
  if (!palabras.length) return false
  const presentes = palabras.filter(p => e.includes(p))
  if (presentes.length < Math.ceil(palabras.length / 2)) return false
  return !explicacionContradice(expl, frase)
}

const cuerpos = readdirSync(ROOT, { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name)
let totalPreg = 0, totalContra = 0, totalIndice = 0
const informe = []

for (const cuerpo of cuerpos) {
  const dir = join(ROOT, cuerpo)
  const ficheros = readdirSync(dir).filter(f => /^tema-\d+\.json$/.test(f)).sort()
  for (const f of ficheros) {
    let tema
    try { tema = JSON.parse(readFileSync(join(dir, f), 'utf8')) } catch (e) { informe.push(`!! ${cuerpo}/${f}: JSON invalido (${e.message})`); continue }
    const preguntas = Array.isArray(tema.preguntas) ? tema.preguntas : []
    for (const p of preguntas) {
      totalPreg++
      const ops = Array.isArray(p.opciones) ? p.opciones : []
      // Misma resolución que la app: getPreguntaCorrecta = respuestaCorrecta ?? correcta ?? 0
      const idx = typeof p.respuestaCorrecta === 'number' ? p.respuestaCorrecta
                : typeof p.correcta === 'number' ? p.correcta
                : 0
      const expl = p.explicacion || ''
      if (idx < 0 || idx >= ops.length) {
        informe.push(`[INDICE-FUERA-RANGO] ${cuerpo}/${f} ${p.id}: respuestaCorrecta=${idx}, n opciones=${ops.length}`)
        continue
      }
      const marcada = ops[idx]
      if (expl && !preguntaNegativa(p.enunciado) && explicacionContradice(expl, marcada)) {
        totalContra++
        informe.push(`[CONTRADICCION] ${cuerpo}/${f} ${p.id}\n   P: ${p.enunciado}\n   marcada(${idx}): ${marcada}\n   explicacion: ${expl}`)
        continue
      }
      if (expl && !explicacionAfirma(expl, marcada)) {
        const otra = ops.findIndex((o, i) => i !== idx && explicacionAfirma(expl, o))
        if (otra >= 0) {
          totalIndice++
          informe.push(`[INDICE?] ${cuerpo}/${f} ${p.id}\n   P: ${p.enunciado}\n   marcada(${idx}): ${marcada}\n   encaja con(${otra}): ${ops[otra]}\n   explicacion: ${expl}`)
        }
      }
    }
  }
}

console.log(informe.join('\n'))
console.log(`\n===== RESUMEN =====`)
console.log(`preguntas analizadas: ${totalPreg}`)
console.log(`[CONTRADICCION] (opcion marcada negada por su explicacion): ${totalContra}`)
console.log(`[INDICE?] (explicacion encaja con otra opcion): ${totalIndice}`)
