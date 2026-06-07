export interface PreguntaSupuesto {
  id: string
  enunciado: string
  opciones: string[]
  respuestaCorrecta: number
  explicacion: string
}
export interface Supuesto {
  id: string
  titulo: string
  caso: string
  preguntas: PreguntaSupuesto[]
}

export const SUPUESTOS_META = [
  { id: 'sup-gc-01', titulo: 'Actuación ante infracción de tráfico grave: alcohol y velocidad' },
  { id: 'sup-gc-02', titulo: 'Intervención ante violencia doméstica en zona rural' },
  { id: 'sup-gc-03', titulo: 'Expediente disciplinario por filtración de información reservada' },
] as const

export async function cargarSupuesto(id: string): Promise<Supuesto | null> {
  const meta = SUPUESTOS_META.find(s => s.id === id)
  if (!meta) return null
  try {
    const fichero = id.replace('sup-gc-', 'supuesto-')
    const modulo = await import(`./${fichero}.json`)
    return modulo.default as Supuesto
  } catch {
    return null
  }
}
