import type { ProgresoTema } from '../types'
import { diasEntre } from './dominio'

// ── P1.6 Plan inverso a la fecha de examen ──────────────────
// Convierte el progreso real en un ritmo y una proyección: ¿a este paso llego
// al examen con el temario terminado? Todo derivable, sin BD nueva.

const HOY = () => new Date().toISOString().slice(0, 10)

function sumarDias(iso: string, dias: number): string {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + dias)
  return d.toISOString().slice(0, 10)
}

export type EstadoPlan = 'sin-datos' | 'sin-fecha' | 'adelantado' | 'justo' | 'atrasado'

export interface PlanEstudio {
  estudiados: number
  restantes: number
  total: number
  ritmoSemanal: number          // temas/semana al ritmo actual (1 decimal)
  fechaFinProyectada: string    // YYYY-MM-DD
  margenDias: number | null     // fechaExamen − fechaFin (+ adelantado, − tarde); null sin fecha futura
  ritmoNecesario: number | null // temas/semana para llegar a tiempo; null sin fecha futura
  estado: EstadoPlan
}

const r1 = (n: number) => Math.round(n * 10) / 10

/** Un tema cuenta como "estudiado" cuando tiene al menos una vuelta. */
function esEstudiado(p: ProgresoTema): boolean {
  return (p.vueltas ?? 0) >= 1
}

export function calcularPlan(
  temas: Record<string, ProgresoTema>,
  total: number,
  fechaExamen: string | null,
  hoy: string = HOY(),
): PlanEstudio {
  const valores = Object.values(temas)
  const estudiadosArr = valores.filter(esEstudiado)
  const estudiados = estudiadosArr.length
  const restantes = Math.max(0, total - estudiados)
  const base: PlanEstudio = {
    estudiados, restantes, total,
    ritmoSemanal: 0, fechaFinProyectada: hoy,
    margenDias: null, ritmoNecesario: null, estado: 'sin-datos',
  }
  if (estudiados === 0) return base

  // Semanas activas ≈ desde la primera revisión registrada (mín. 1 semana, conservador).
  const fechas = estudiadosArr.map(p => p.ultimaRevision).filter((f): f is string => !!f)
  const primera = fechas.length ? fechas.reduce((a, b) => (a < b ? a : b)) : hoy
  const semanasActivas = Math.max(1, diasEntre(primera, hoy) / 7)
  const ritmoSemanal = r1(estudiados / semanasActivas)

  // Proyección lineal a terminar el temario.
  const semanasRestantes = restantes === 0 ? 0 : restantes / (estudiados / semanasActivas)
  const fechaFinProyectada = sumarDias(hoy, Math.ceil(semanasRestantes * 7))

  // Sin fecha de examen futura: no hay margen ni ritmo necesario.
  if (!fechaExamen || fechaExamen <= hoy) {
    return { ...base, ritmoSemanal, fechaFinProyectada, estado: 'sin-fecha' }
  }

  // Margen con signo: + si terminamos antes del examen, − si después.
  const margen = fechaFinProyectada <= fechaExamen
    ? diasEntre(fechaFinProyectada, fechaExamen)
    : -diasEntre(fechaExamen, fechaFinProyectada)

  const semanasHastaExamen = Math.max(0.1, diasEntre(hoy, fechaExamen) / 7)
  const ritmoNecesario = r1(restantes / semanasHastaExamen)

  const estado: EstadoPlan = margen >= 7 ? 'adelantado' : margen <= -7 ? 'atrasado' : 'justo'

  return { ...base, ritmoSemanal, fechaFinProyectada, margenDias: margen, ritmoNecesario, estado }
}
