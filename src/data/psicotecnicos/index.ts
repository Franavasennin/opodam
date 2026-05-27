import type { PreguntaTest } from '../../components/test/MotorTest'

export const CATEGORIAS = [
  { id: 'series-numericas', titulo: 'Series numéricas' },
  { id: 'razonamiento-verbal', titulo: 'Razonamiento verbal' },
  { id: 'razonamiento-logico', titulo: 'Razonamiento lógico' },
  { id: 'ortografia-calculo', titulo: 'Ortografía y cálculo' },
  { id: 'razonamiento-mecanico', titulo: 'Razonamiento mecánico' },
] as const

export type CategoriaId = typeof CATEGORIAS[number]['id']

export async function cargarCategoria(id: string): Promise<PreguntaTest[]> {
  try {
    const modulo = await import(`./${id}.json`)
    return (modulo.default as PreguntaTest[]) ?? []
  } catch {
    return []
  }
}
