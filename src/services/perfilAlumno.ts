import type { Progreso } from '../types'
import { calcularDebilidades } from './adaptativo'
import { retencionMediaGlobal } from './dominio'
import { tasaFalsosSeguros, totalConfianza } from './calibracion'

// ── P2.2 Tutor consciente del alumno ─────────────────────────
// Construye un bloque compacto con las debilidades del alumno para inyectarlo
// en el system prompt del tutor. Sin BD nueva: todo sale del Progreso (P1.1
// cuaderno, P1.3 retención, P1.5 calibración, rendimiento por tema).

export interface ResumenAlumno {
  temasDebiles: Array<{ id: number; titulo: string; ratio: number }>  // ratio 0–100
  retencionPct: number
  falsosSeguros: number       // % de "seguros" fallados (calibración)
  confianzaMuestras: number   // nº de respuestas con confianza declarada
  cuadernoPendiente: number   // preguntas en el cuaderno de errores sin graduar
}

/** Datos del alumno relevantes para personalizar el tutor (todo derivado). */
export function resumenAlumno(
  progreso: Progreso,
  metas: ReadonlyArray<{ id: number; titulo: string }>,
): ResumenAlumno {
  const titulo = (id: number) => metas.find(m => m.id === id)?.titulo ?? `Tema ${id}`
  const rend = progreso.rendimientoPorTema ?? {}
  const temasDebiles = calcularDebilidades(rend, 5).map(id => {
    const r = rend[String(id)]!
    return { id, titulo: titulo(id), ratio: Math.round((r.aciertos / r.total) * 100) }
  })
  const cal = progreso.calibracion ?? { seguroAcierto: 0, seguroFallo: 0, dudoAcierto: 0, dudoFallo: 0 }
  return {
    temasDebiles,
    retencionPct: retencionMediaGlobal(progreso.temas ?? {}),
    falsosSeguros: tasaFalsosSeguros(cal),
    confianzaMuestras: totalConfianza(cal),
    cuadernoPendiente: Object.keys(progreso.erroresPorPregunta ?? {}).length,
  }
}

/**
 * Bloque de texto para el system prompt del tutor. Devuelve null si no hay
 * señales útiles todavía (alumno sin datos) — así el tutor no recibe ruido.
 */
export function construirPerfilAlumno(
  progreso: Progreso,
  metas: ReadonlyArray<{ id: number; titulo: string }>,
): string | null {
  const r = resumenAlumno(progreso, metas)
  const hayDatos = r.temasDebiles.length > 0 || r.cuadernoPendiente > 0 || r.confianzaMuestras >= 5
  if (!hayDatos) return null

  const lineas: string[] = []
  if (r.temasDebiles.length > 0) {
    const lista = r.temasDebiles.map(t => `T${t.id} «${t.titulo}» (${t.ratio}% aciertos)`).join(', ')
    lineas.push(`- Temas más flojos: ${lista}`)
  }
  if (r.retencionPct > 0) lineas.push(`- Retención media estimada: ${r.retencionPct}%`)
  if (r.confianzaMuestras >= 5) {
    lineas.push(`- Calibración: ${r.falsosSeguros}% de "falsos seguros" (preguntas que creía dominar y falló)`)
  }
  if (r.cuadernoPendiente > 0) {
    lineas.push(`- Cuaderno de errores: ${r.cuadernoPendiente} ${r.cuadernoPendiente === 1 ? 'pregunta pendiente' : 'preguntas pendientes'} de graduar`)
  }

  return [
    '## PERFIL DEL ALUMNO',
    'Personaliza tus respuestas con estos datos: explica POR QUÉ falla y pon ejemplos nuevos en sus puntos débiles. No los recites; úsalos solo cuando sean relevantes.',
    ...lineas,
  ].join('\n')
}
