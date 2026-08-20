// scripts/sp-pipeline-completo.mjs
// Orquesta Loop A (transcripción) -> Loop B (teoría) -> Loop C (preguntas) para
// todos los temas de security-plus, saltando lo que ya esté hecho (resumible).
// Uso: node scripts/sp-pipeline-completo.mjs [desde] [hasta]
import { readFileSync, existsSync } from 'fs'
import { execSync } from 'child_process'

const temasMeta = JSON.parse(readFileSync('scripts/security-plus-temas.json', 'utf8')).temas
const desde = Number(process.argv[2]) || 1
const hasta = Number(process.argv[3]) || 30

function run(cmd) {
  console.log(`\n$ ${cmd}`)
  execSync(cmd, { stdio: 'inherit' })
}

let ok = 0, fail = 0
for (let id = desde; id <= hasta; id++) {
  const meta = temasMeta.find(t => t.id === id)
  if (!meta) { console.log(`tema-${id}: no existe en security-plus-temas.json, salto`); continue }
  console.log(`\n========== TEMA ${id}: ${meta.subepigrafe} ${meta.titulo} ==========`)
  try {
    const rutaTrans = `scripts/transcripciones/tema-${String(id).padStart(2, '0')}.txt`
    if (!existsSync(rutaTrans)) run(`node scripts/sp-extraer-transcripcion.mjs ${id}`)
    else console.log(`tema-${id}: transcripción ya existe`)

    run(`node scripts/sp-gen-teoria.mjs ${id} ${rutaTrans}`)
    run(`node scripts/sp-gen-preguntas.mjs ${id}`)

    execSync(`node scripts/audit-security-plus.mjs ${id}`, { stdio: 'inherit' })
    ok++
  } catch (e) {
    console.error(`tema-${id}: FALLO en el pipeline —`, String(e.message || e).slice(0, 300))
    fail++
  }
}
console.log(`\n\n=== PIPELINE COMPLETO: ok=${ok} fallos=${fail} (rango ${desde}-${hasta}) ===`)
