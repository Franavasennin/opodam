import type { ExamenResultado, PreguntaExt, Progreso, RendimientoTema } from '../types'
import { getProgreso, saveProgreso } from './storage'

// ── Puntuación (parametrizada por tribunal) ─────────────────
// Fórmula estándar, consciente del total de preguntas y de la penalización
// por error de cada oposición: nota = (aciertos − errores×pen) / total × 10.
// `penalizacion` = fracción de un acierto que resta cada error (1/3 por defecto;
// 0 = sin penalización).
export function calcularNotaExamen(
  aciertos: number,
  errores: number,
  total: number,
  penalizacion = 1 / 3,
): number {
  if (total <= 0) return 0
  const bruta = (aciertos - errores * penalizacion) / total * 10
  return Math.max(0, Math.min(10, Math.round(bruta * 100) / 100))
}

// ── Análisis por tema ────────────────────────────────────────
export function calcularDebilidadesPorExamen(
  preguntas: Array<{ id: string; temaId: number }>,
  respuestasUsuario: Record<string, number | null>,
  correctas: Record<string, number>,
): Record<number, { aciertos: number; errores: number; total: number }> {
  const por: Record<number, { aciertos: number; errores: number; total: number }> = {}
  for (const { id, temaId } of preguntas) {
    if (!por[temaId]) por[temaId] = { aciertos: 0, errores: 0, total: 0 }
    por[temaId].total++
    const resp = respuestasUsuario[id]
    if (resp === null || resp === undefined) continue
    if (resp === correctas[id]) por[temaId].aciertos++
    else por[temaId].errores++
  }
  return por
}

// ── Selección ponderada de preguntas ───────────────────────
function barajar<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5)
}

export function seleccionarPreguntas(
  todas: PreguntaExt[],
  rendimiento: Progreso['rendimientoPorTema'],
  cantidad: number,
): PreguntaExt[] {
  function peso(temaId: number): number {
    const r = rendimiento[String(temaId)]
    if (!r || r.total < 3) return 1
    const tasa = r.aciertos / r.total
    return tasa < 0.5 ? 3 : tasa < 0.7 ? 2 : 1
  }
  const ponderadas: PreguntaExt[] = []
  for (const p of todas) {
    for (let i = 0; i < peso(p.temaId); i++) ponderadas.push(p)
  }
  const vistas = new Set<string>()
  const resultado: PreguntaExt[] = []
  for (const p of barajar(ponderadas)) {
    if (!vistas.has(p.id)) {
      vistas.add(p.id)
      resultado.push(p)
      if (resultado.length === cantidad) break
    }
  }
  return resultado
}

// ── Guardar resultado ───────────────────────────────────────
export function guardarExamen(resultado: ExamenResultado): void {
  const p = getProgreso()
  // P1.6 quick win: cap 10 → 50 para tener evolución histórica real.
  p.historialExamenes = [resultado, ...p.historialExamenes].slice(0, 50)
  for (const [temaIdStr, res] of Object.entries(resultado.resultadosPorTema)) {
    const actual = p.rendimientoPorTema[temaIdStr] ?? { aciertos: 0, errores: 0, total: 0 }
    p.rendimientoPorTema[temaIdStr] = {
      aciertos: actual.aciertos + res.aciertos,
      errores:  actual.errores  + res.errores,
      total:    actual.total    + res.total,
    }
  }
  saveProgreso(p)
}

// ── Actualizar rendimiento desde tests de tema ──────────────
export function actualizarRendimientoTema(
  temaId: number,
  aciertos: number,
  errores: number,
  total: number,
): void {
  const p = getProgreso()
  const actual: RendimientoTema = p.rendimientoPorTema[String(temaId)] ?? { aciertos: 0, errores: 0, total: 0 }
  p.rendimientoPorTema[String(temaId)] = {
    aciertos: actual.aciertos + aciertos,
    errores:  actual.errores  + errores,
    total:    actual.total    + total,
  }
  saveProgreso(p)
}
