import type { ExamenResultado, ProgresoTema } from '../types'
import type { NombreIcono } from '../components/ui/Icon'
import { diasEntre } from './dominio'

// ── P2.3 Dashboard de rendimiento con predicción honesta ─────
// Todo client-side, derivado de datos existentes (historial de exámenes,
// cobertura del temario y retención media de P1.3). Sin BD ni IA.
// Regla de oro del informe pedagógico: mostrar SIEMPRE con banda de
// incertidumbre y como "estimación orientativa" — nunca prometer aprobados.

export type Semaforo = 'verde' | 'ambar' | 'rojo'

export interface Prediccion {
  nota: number           // 0–10, proyección puntual
  banda: number          // ± incertidumbre (0–10)
  base: number           // media de los últimos simulacros usados
  nSimulacros: number    // cuántos simulacros entraron en la media
  coberturaPct: number   // 0–100 (% temario con ≥1 vuelta)
  retencionPct: number   // 0–100 (retención media de P1.3)
  semaforo: Semaforo
  fiable: boolean        // hay datos mínimos para una estimación útil
}

/** % de temas con ≥1 vuelta sobre el total del temario (0–100). */
export function cobertura(temas: Record<string, ProgresoTema>, idsTemas: number[]): number {
  if (idsTemas.length === 0) return 0
  const conVuelta = idsTemas.filter(id => (temas[String(id)]?.vueltas ?? 0) > 0).length
  return Math.round((conVuelta / idsTemas.length) * 100)
}

/** Notas de los exámenes en orden cronológico (antiguo→reciente) para el gráfico. */
export function evolucionNotas(
  historial: ExamenResultado[],
  max = 12,
): Array<{ fecha: string; nota: number; modo: ExamenResultado['modo'] }> {
  // historialExamenes se guarda con el más reciente primero (unshift en examen.ts).
  return [...historial]
    .slice(0, max)
    .reverse()
    .map(e => ({ fecha: e.fecha, nota: e.nota, modo: e.modo }))
}

/** Media simple de un array de números (0 si vacío). */
function media(xs: number[]): number {
  return xs.length === 0 ? 0 : xs.reduce((a, b) => a + b, 0) / xs.length
}

/** Desviación típica poblacional (0 si <2 elementos). */
function desviacion(xs: number[]): number {
  if (xs.length < 2) return 0
  const m = media(xs)
  return Math.sqrt(media(xs.map(x => (x - m) ** 2)))
}

const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x))
const r2 = (x: number) => Math.round(x * 100) / 100

/**
 * Proyección honesta de nota de examen.
 *
 * Modelo (documentado a propósito; v1 transparente):
 *   base = media de las 3 notas de simulacro más recientes.
 *   El examen real cubre TODO el temario, así que la base se descuenta por:
 *     · cobertura → en los temas sin estudiar la nota neta tiende a ~0
 *       (con penalización por error, adivinar no suma). Penalización lineal.
 *     · retención → de lo estudiado solo recuerdas una fracción; modula
 *       entre el 60% y el 100% de la habilidad demostrada (nunca lo pierdes
 *       todo, pero el olvido pesa).
 *   nota = base × coberturaFrac × (0.6 + 0.4×retencionFrac)
 *
 * Banda = desviación de los simulacros usados, ensanchada cuando hay pocos
 * datos (≤2 simulacros) para no aparentar precisión que no tenemos.
 */
export function calcularPrediccion(
  historial: ExamenResultado[],
  coberturaPct: number,
  retencionPct: number,
): Prediccion {
  const recientes = historial.slice(0, 3).map(e => e.nota)
  const nSimulacros = recientes.length
  const base = media(recientes)
  const coberturaFrac = clamp(coberturaPct / 100, 0, 1)
  const retencionFrac = clamp(retencionPct / 100, 0, 1)

  const nota = clamp(base * coberturaFrac * (0.6 + 0.4 * retencionFrac), 0, 10)

  // Incertidumbre: más datos = banda más estrecha.
  const anchoBase = nSimulacros >= 3 ? 0.5 : nSimulacros === 2 ? 1 : 1.8
  const banda = clamp(desviacion(recientes) + anchoBase, 0.5, 2.5)

  const semaforo: Semaforo = nota >= 6 ? 'verde' : nota >= 4.5 ? 'ambar' : 'rojo'
  const fiable = nSimulacros >= 1 && coberturaPct >= 15

  return {
    nota: r2(nota),
    banda: r2(banda),
    base: r2(base),
    nSimulacros,
    coberturaPct,
    retencionPct,
    semaforo,
    fiable,
  }
}

// ── Plan de la semana (3 acciones por reglas, sin IA) ────────

export interface AccionSemana {
  icono: NombreIcono
  texto: string
  ruta?: string          // ruta relativa dentro de /oposicion/:slug si aplica
}

export interface ContextoSemana {
  peorTema: { id: number; titulo: string } | null
  flashcardsPendientes: number
  diasDesdeUltimoSimulacro: number | null   // null = nunca ha hecho uno
  coberturaPct: number
}

/** Hasta 3 acciones priorizadas para la semana, derivadas del estado real. */
export function planSemana(ctx: ContextoSemana): AccionSemana[] {
  const acciones: AccionSemana[] = []

  if (ctx.peorTema) {
    acciones.push({
      icono: 'diana',
      texto: `Refuerza tu tema más flojo: T${ctx.peorTema.id} — ${ctx.peorTema.titulo}`,
      ruta: 'temario',
    })
  } else if (ctx.coberturaPct < 100) {
    acciones.push({ icono: 'temario', texto: 'Empieza un tema nuevo del temario', ruta: 'temario' })
  }

  if (ctx.flashcardsPendientes > 0) {
    acciones.push({
      icono: 'flashcards',
      texto: `Repasa ${ctx.flashcardsPendientes} flashcard${ctx.flashcardsPendientes === 1 ? '' : 's'} pendiente${ctx.flashcardsPendientes === 1 ? '' : 's'}`,
      ruta: 'flashcards',
    })
  }

  if (ctx.diasDesdeUltimoSimulacro === null) {
    acciones.push({ icono: 'tests', texto: 'Haz tu primer simulacro completo', ruta: 'examen' })
  } else if (ctx.diasDesdeUltimoSimulacro >= 7) {
    acciones.push({
      icono: 'tests',
      texto: `Hace ${ctx.diasDesdeUltimoSimulacro} días de tu último simulacro — toca otro`,
      ruta: 'examen',
    })
  }

  return acciones.slice(0, 3)
}

/** Días desde el simulacro más reciente del historial (null si no hay ninguno). */
export function diasDesdeUltimoSimulacro(
  historial: ExamenResultado[],
  hoy?: string,
): number | null {
  if (historial.length === 0) return null
  // El más reciente está primero; por seguridad tomamos la fecha máxima.
  const masReciente = historial.reduce((a, b) => (a.fecha >= b.fecha ? a : b))
  return diasEntre(masReciente.fecha, hoy)
}
