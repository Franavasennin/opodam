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
  // Ordenar por fragilidad: nivel más bajo primero (lo menos consolidado) y, a
  // igual nivel, la más vencida antes. Así el repaso ataca primero lo más frágil.
  const porFragilidad = [...pendientesHoy].sort((a, b) => {
    const ea = estadosFlashcards[a], eb = estadosFlashcards[b]
    return (ea.nivel - eb.nivel) || (ea.proximoRepaso < eb.proximoRepaso ? -1 : 1)
  })
  // Flashcards de temas débiles primero (manteniendo el orden de fragilidad)
  const deTemasDebiles = porFragilidad.filter(id =>
    temasDebiles.some(temaId => id.startsWith(`t${String(temaId).padStart(2, '0')}`))
  )
  const resto = porFragilidad.filter(id => !deTemasDebiles.includes(id))
  // Cola elástica: entre MIN y MAX según el backlog real, en vez de cortar
  // siempre a 10 (con mucho backlog, cortar fijo degrada el repaso espaciado).
  const MIN_SESION = 10, MAX_SESION = 30
  const limite = Math.min(MAX_SESION, Math.max(MIN_SESION, porFragilidad.length))
  const flashcardIds = [...deTemasDebiles, ...resto].slice(0, limite)
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
