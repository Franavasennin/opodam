import type { Tema } from '../../../types'

export const TEMAS_META = [
  // Bloque General — ids 1..15 (titulos definitivos en Task 13)
  { id: 1,  titulo: 'Policia Local — Tema General 1',  bloque: 'general' },
  { id: 2,  titulo: 'Policia Local — Tema General 2',  bloque: 'general' },
  { id: 3,  titulo: 'Policia Local — Tema General 3',  bloque: 'general' },
  { id: 4,  titulo: 'Policia Local — Tema General 4',  bloque: 'general' },
  { id: 5,  titulo: 'Policia Local — Tema General 5',  bloque: 'general' },
  { id: 6,  titulo: 'Policia Local — Tema General 6',  bloque: 'general' },
  { id: 7,  titulo: 'Policia Local — Tema General 7',  bloque: 'general' },
  { id: 8,  titulo: 'Policia Local — Tema General 8',  bloque: 'general' },
  { id: 9,  titulo: 'Policia Local — Tema General 9',  bloque: 'general' },
  { id: 10, titulo: 'Policia Local — Tema General 10', bloque: 'general' },
  { id: 11, titulo: 'Policia Local — Tema General 11', bloque: 'general' },
  { id: 12, titulo: 'Policia Local — Tema General 12', bloque: 'general' },
  { id: 13, titulo: 'Policia Local — Tema General 13', bloque: 'general' },
  { id: 14, titulo: 'Policia Local — Tema General 14', bloque: 'general' },
  { id: 15, titulo: 'Policia Local — Tema General 15', bloque: 'general' },
  { id: 16, titulo: 'Policia Local — Tema Especifico 1',  bloque: 'especifico' },
  { id: 17, titulo: 'Policia Local — Tema Especifico 2',  bloque: 'especifico' },
  { id: 18, titulo: 'Policia Local — Tema Especifico 3',  bloque: 'especifico' },
  { id: 19, titulo: 'Policia Local — Tema Especifico 4',  bloque: 'especifico' },
  { id: 20, titulo: 'Policia Local — Tema Especifico 5',  bloque: 'especifico' },
  { id: 21, titulo: 'Policia Local — Tema Especifico 6',  bloque: 'especifico' },
  { id: 22, titulo: 'Policia Local — Tema Especifico 7',  bloque: 'especifico' },
  { id: 23, titulo: 'Policia Local — Tema Especifico 8',  bloque: 'especifico' },
  { id: 24, titulo: 'Policia Local — Tema Especifico 9',  bloque: 'especifico' },
  { id: 25, titulo: 'Policia Local — Tema Especifico 10', bloque: 'especifico' },
  { id: 26, titulo: 'Policia Local — Tema Especifico 11', bloque: 'especifico' },
  { id: 27, titulo: 'Policia Local — Tema Especifico 12', bloque: 'especifico' },
  { id: 28, titulo: 'Policia Local — Tema Especifico 13', bloque: 'especifico' },
  { id: 29, titulo: 'Policia Local — Tema Especifico 14', bloque: 'especifico' },
  { id: 30, titulo: 'Policia Local — Tema Especifico 15', bloque: 'especifico' },
  { id: 31, titulo: 'Policia Local — Tema Especifico 16', bloque: 'especifico' },
  { id: 32, titulo: 'Policia Local — Tema Especifico 17', bloque: 'especifico' },
  { id: 33, titulo: 'Policia Local — Tema Especifico 18', bloque: 'especifico' },
  { id: 34, titulo: 'Policia Local — Tema Especifico 19', bloque: 'especifico' },
  { id: 35, titulo: 'Policia Local — Tema Especifico 20', bloque: 'especifico' },
  { id: 36, titulo: 'Policia Local — Tema Especifico 21', bloque: 'especifico' },
  { id: 37, titulo: 'Policia Local — Tema Especifico 22', bloque: 'especifico' },
] as const

export type TemaMeta = typeof TEMAS_META[number]
export const TOTAL_TEMAS = TEMAS_META.length // 37

const TEMA_FILE_MAP: Record<number, string> = {
  1: 'tema-01', 2: 'tema-02', 3: 'tema-03', 4: 'tema-04', 5: 'tema-05',
  6: 'tema-06', 7: 'tema-07', 8: 'tema-08', 9: 'tema-09', 10: 'tema-10',
  11: 'tema-11', 12: 'tema-12', 13: 'tema-13', 14: 'tema-14', 15: 'tema-15',
  16: 'tema-16', 17: 'tema-17', 18: 'tema-18', 19: 'tema-19', 20: 'tema-20',
  21: 'tema-21', 22: 'tema-22', 23: 'tema-23', 24: 'tema-24', 25: 'tema-25',
  26: 'tema-26', 27: 'tema-27', 28: 'tema-28', 29: 'tema-29', 30: 'tema-30',
  31: 'tema-31', 32: 'tema-32', 33: 'tema-33', 34: 'tema-34', 35: 'tema-35',
  36: 'tema-36', 37: 'tema-37',
}

export async function cargarTema(id: number): Promise<Tema> {
  const fileName = TEMA_FILE_MAP[id]
  if (!fileName) throw new Error(`Tema con id ${id} no encontrado`)
  const modulo = await import(`./${fileName}.json`)
  return modulo.default as Tema
}
