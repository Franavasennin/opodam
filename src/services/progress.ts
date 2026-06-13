import type { Progreso } from '../types'
import { getProgreso, saveProgreso } from './storage'
import { actualizarRendimientoTema, calcularNotaExamen } from './examen'

export function calcularPuntuacionTest(
  aciertos: number,
  errores: number,
  total: number,
  penalizacion = 1 / 3,
): number {
  return calcularNotaExamen(aciertos, errores, total, penalizacion)
}

export function debeActualizarRacha(ultimoEstudio: string | null): boolean {
  if (!ultimoEstudio) return true
  const hoy = new Date().toISOString().slice(0, 10)
  if (ultimoEstudio === hoy) return false
  const ayer = new Date()
  ayer.setDate(ayer.getDate() - 1)
  return ultimoEstudio === ayer.toISOString().slice(0, 10)
}

export function contarVueltasGlobal(
  temas: Progreso['temas'],
  totalTemas: number,
): number {
  if (Object.keys(temas).length < totalTemas) return 0
  return Math.min(...Object.values(temas).map(t => t.vueltas))
}

export function temasPrioritarios(
  temas: Progreso['temas'],
  todosIds: number[],
): number[] {
  const vueltasPorId = (id: number) => temas[String(id)]?.vueltas ?? 0
  const media = todosIds.reduce((s, id) => s + vueltasPorId(id), 0) / todosIds.length
  return todosIds.filter(id => vueltasPorId(id) < media)
}

export function registrarEstudio(temaId: number): void {
  const p = getProgreso()
  const hoy = new Date().toISOString().slice(0, 10)
  const tema = p.temas[String(temaId)] ?? {
    vueltas: 0, ultimaRevision: null, porcentajeAciertos: 0, teoriaLeida: false,
  }
  tema.teoriaLeida = true
  tema.ultimaRevision = hoy
  p.temas[String(temaId)] = tema
  if (debeActualizarRacha(p.racha.ultimoEstudio)) {
    p.racha.dias += 1
  } else if (p.racha.ultimoEstudio !== hoy) {
    p.racha.dias = 1
  }
  p.racha.ultimoEstudio = hoy
  saveProgreso(p)
}

export function completarVuelta(temaId: number): void {
  const p = getProgreso()
  const tema = p.temas[String(temaId)] ?? {
    vueltas: 0, ultimaRevision: null, porcentajeAciertos: 0, teoriaLeida: false,
  }
  tema.vueltas += 1
  tema.ultimaRevision = new Date().toISOString().slice(0, 10)
  p.temas[String(temaId)] = tema
  saveProgreso(p)
}

export function guardarResultadoTest(
  temaId: number,
  aciertos: number,
  errores: number,
  total: number,
): void {
  const p = getProgreso()
  const tema = p.temas[String(temaId)] ?? {
    vueltas: 0, ultimaRevision: null, porcentajeAciertos: 0, teoriaLeida: false,
  }
  tema.porcentajeAciertos = Math.round((aciertos / total) * 100)
  p.temas[String(temaId)] = tema
  saveProgreso(p)
  completarVuelta(temaId)
  actualizarRendimientoTema(temaId, aciertos, errores, total)
}
