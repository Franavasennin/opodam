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
  { id: 'sup-cgpc-01', titulo: 'Identificación en la vía pública' },
] as const

export async function cargarSupuesto(id: string): Promise<Supuesto | null> {
  const meta = SUPUESTOS_META.find(s => s.id === id)
  if (!meta) return null
  try {
    const fichero = id.replace('sup-cgpc-', 'supuesto-')
    const modulo = await import(`./${fichero}.json`)
    return modulo.default as Supuesto
  } catch {
    return null
  }
}
