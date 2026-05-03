import type { Progreso } from '../types'
import { getProgreso, saveProgreso } from './storage'
import { flashcardsPendientesHoy } from './spaced-repetition'

// ── Cálculo de debilidades ──────────────────────────────────
export function calcularDebilidades(
  rendimiento: Progreso['rendimientoPorTema'],
  limite = 5,
): number[] {
  return Object.entries(rendimiento)
    .filter(([, r]) => r.total >= 3)
    .sort(([, a], [, b]) => (a.aciertos / a.total) - (b.aciertos / b.total))
    .slice(0, limite)
    .map(([id]) => Number(id))
}

// ── Total preguntas respondidas ─────────────────────────────
export function totalPreguntasRespondidas(
  rendimiento: Progreso['rendimientoPorTema'],
): number {
  return Object.values(rendimiento).reduce((sum, r) => sum + r.total, 0)
}

// ── Generar sesión diaria ───────────────────────────────────
export function generarSesionDiaria(
  rendimiento: Progreso['rendimientoPorTema'],
  estadosFlashcards: Progreso['flashcards'],
  fecha: string,
): NonNullable<Progreso['sesionDiaria']> {
  const temasDebiles = calcularDebilidades(rendimiento, 3)
  const pendientesHoy = flashcardsPendientesHoy(estadosFlashcards)
  // Flashcards de temas débiles primero
  const deTemasDebiles = pendientesHoy.filter(id =>
    temasDebiles.some(temaId => id.startsWith(`t${String(temaId).padStart(2, '0')}`))
  )
  const resto = pendientesHoy.filter(id => !deTemasDebiles.includes(id))
  const flashcardIds = [...deTemasDebiles, ...resto].slice(0, 10)
  // Guardar temaIds como "tema:N" para cargar dinámicamente en la página
  const preguntaIds = temasDebiles.map(id => `tema:${id}`)
  return { fecha, flashcardIds, preguntaIds, completada: false }
}

// ── Obtener o crear sesión de hoy ───────────────────────────
export function obtenerSesionHoy(): NonNullable<Progreso['sesionDiaria']> {
  const p   = getProgreso()
  const hoy = new Date().toISOString().slice(0, 10)
  if (p.sesionDiaria?.fecha === hoy) return p.sesionDiaria
  const nueva = generarSesionDiaria(p.rendimientoPorTema, p.flashcards, hoy)
  p.sesionDiaria = nueva
  saveProgreso(p)
  return nueva
}

// ── Marcar sesión como completada ───────────────────────────
export function completarSesionDiaria(): void {
  const p   = getProgreso()
  const hoy = new Date().toISOString().slice(0, 10)
  if (!p.sesionDiaria) return
  p.sesionDiaria.completada = true
  if (p.racha.ultimoEstudio !== hoy) {
    const ayer = new Date()
    ayer.setDate(ayer.getDate() - 1)
    const fueAyer = p.racha.ultimoEstudio === ayer.toISOString().slice(0, 10)
    p.racha.dias = fueAyer ? p.racha.dias + 1 : 1
    p.racha.ultimoEstudio = hoy
  }
  saveProgreso(p)
}
