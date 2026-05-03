import type { Progreso } from '../types'
import { getProgreso, saveProgreso } from './storage'
import { cargarProgresoRemoto, guardarProgresoRemoto, obtenerUsuario } from './supabase'

export function mergeProgreso(local: Progreso, remoto: Progreso): Progreso {
  const merged: Progreso = structuredClone(local)

  // Temas: gana más vueltas
  for (const [id, rem] of Object.entries(remoto.temas)) {
    const loc = merged.temas[id]
    if (!loc || rem.vueltas > loc.vueltas) merged.temas[id] = rem
  }

  // Flashcards: gana nivel más alto
  for (const [id, rem] of Object.entries(remoto.flashcards)) {
    const loc = merged.flashcards[id]
    if (!loc || rem.nivel > loc.nivel) merged.flashcards[id] = rem
  }

  // Racha: gana valor más alto
  if (remoto.racha.dias > merged.racha.dias) merged.racha = remoto.racha

  // tiempoTotalSegundos: max
  merged.tiempoTotalSegundos = Math.max(local.tiempoTotalSegundos, remoto.tiempoTotalSegundos)

  // historialExamenes: unión deduplicada por id, últimos 10
  const todos = [...merged.historialExamenes, ...remoto.historialExamenes]
  const vistos = new Set<string>()
  merged.historialExamenes = todos
    .filter(e => { if (vistos.has(e.id)) return false; vistos.add(e.id); return true })
    .sort((a, b) => b.id.localeCompare(a.id))
    .slice(0, 10)

  // sesionDiaria: más reciente
  if (remoto.sesionDiaria) {
    if (!merged.sesionDiaria || remoto.sesionDiaria.fecha > merged.sesionDiaria.fecha) {
      merged.sesionDiaria = remoto.sesionDiaria
    }
  }

  // rendimientoPorTema: suma
  for (const [id, rem] of Object.entries(remoto.rendimientoPorTema)) {
    const loc = merged.rendimientoPorTema[id]
    if (!loc) {
      merged.rendimientoPorTema[id] = { ...rem }
    } else {
      merged.rendimientoPorTema[id] = {
        aciertos: loc.aciertos + rem.aciertos,
        errores:  loc.errores  + rem.errores,
        total:    loc.total    + rem.total,
      }
    }
  }

  return merged
}

export async function sincronizar(): Promise<void> {
  const usuario = await obtenerUsuario()
  if (!usuario) return
  const local  = getProgreso()
  const remoto = await cargarProgresoRemoto()
  if (!remoto) {
    await guardarProgresoRemoto(local)
    return
  }
  const merged = mergeProgreso(local, remoto)
  saveProgreso(merged)
  await guardarProgresoRemoto(merged)
}
