import type { ProgresoTema } from '../types'
import { factorRetencion, diasEntre } from './dominio'

// ── P3.4 Repaso pre-examen automático ───────────────────────
// A pocos días de la convocatoria, el plan cambia de "avanzar temario" a
// "consolidar lo aprendido": prioriza los conceptos con mayor riesgo de olvido
// × importancia, sugiere 1 simulacro/día y veta el contenido nuevo en las
// últimas 48 h. Servicio PURO y derivable (sin BD nueva).

const HOY = () => new Date().toISOString().slice(0, 10)

export const VENTANA_PRE_EXAMEN = 7  // días antes del examen en que se activa
export const VEDA_DIAS = 2           // 48 h: veda de contenido nuevo
export const TOP_CONCEPTOS = 40

export interface ConceptoPrioritario {
  id: number
  riesgo: number        // 1 − retención [0..1]
  importancia: number   // peso relativo (≥0); 1 por defecto
  prioridad: number     // riesgo × importancia
}

export interface PlanPreExamen {
  activo: boolean
  dias: number | null         // días hasta el examen (null si no hay fecha futura)
  vedaContenidoNuevo: boolean // true en las últimas 48 h
  simulacroHoy: boolean       // sugerir simulacro hoy (1/día durante la ventana)
  conceptos: ConceptoPrioritario[]
}

/** Días enteros hasta la fecha de examen (null si no hay fecha futura). */
export function diasHastaExamen(
  fechaExamen: string | null,
  hoy: string = HOY(),
): number | null {
  if (!fechaExamen || fechaExamen < hoy) return null
  return diasEntre(hoy, fechaExamen)
}

interface Opciones {
  importancia?: Record<number, number> // peso por tema (default 1)
  limite?: number
  ventana?: number
  simulacroHechoHoy?: boolean
}

/**
 * Construye el plan de repaso pre-examen. Solo entran temas ya estudiados
 * (vuelta ≥1 o última revisión): el pre-examen consolida, no introduce nuevo.
 */
export function planPreExamen(
  temas: Record<string, ProgresoTema>,
  idsTemas: number[],
  fechaExamen: string | null,
  hoy: string = HOY(),
  opts: Opciones = {},
): PlanPreExamen {
  const ventana = opts.ventana ?? VENTANA_PRE_EXAMEN
  const limite = opts.limite ?? TOP_CONCEPTOS
  const pesos = opts.importancia ?? {}
  const dias = diasHastaExamen(fechaExamen, hoy)
  const activo = dias !== null && dias <= ventana

  const inactivo: PlanPreExamen = {
    activo: false, dias, vedaContenidoNuevo: false, simulacroHoy: false, conceptos: [],
  }
  if (!activo) return inactivo

  const conceptos = idsTemas
    .map((id): ConceptoPrioritario | null => {
      const p = temas[String(id)]
      const estudiado = !!p && ((p.vueltas ?? 0) >= 1 || !!p.ultimaRevision)
      if (!estudiado) return null
      const riesgo = 1 - factorRetencion(p!.ultimaRevision, p!.vueltas ?? 0, hoy)
      const importancia = pesos[id] ?? 1
      return { id, riesgo, importancia, prioridad: riesgo * importancia }
    })
    .filter((c): c is ConceptoPrioritario => c !== null)
    .sort((a, b) => b.prioridad - a.prioridad)
    .slice(0, limite)

  return {
    activo: true,
    dias,
    vedaContenidoNuevo: dias! <= VEDA_DIAS,
    simulacroHoy: !opts.simulacroHechoHoy,
    conceptos,
  }
}
