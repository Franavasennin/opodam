import type { Tema } from '../../types';

export const TEMAS_META = [
  { id: 1,  titulo: 'La Constitución Española de 1978. Estructura y contenido. Derechos y deberes fundamentales. Los estados excepcionales', bloque: 'general' },
  { id: 2,  titulo: 'La Corona. Funciones constitucionales del Rey. El refrendo', bloque: 'general' },
  { id: 3,  titulo: 'Las Cortes Generales. El Congreso y el Senado. La función legislativa. Relaciones Gobierno-Cortes', bloque: 'general' },
  { id: 24, titulo: 'Las Fuerzas y Cuerpos de Seguridad. LO 2/1986. Principios básicos de actuación. Policías de las CCAA y Policías Locales', bloque: 'especifico' },
  { id: 25, titulo: 'El Sistema Canario de Seguridad y Emergencias. La Ley 9/2007. CECOES 1-1-2', bloque: 'especifico' },
] as const;

export const TOTAL_TEMAS = TEMAS_META.length;

const TEMA_FILE_MAP: Record<number, string> = {
  1:  'tema-01',
  2:  'tema-02',
  3:  'tema-03',
  24: 'tema-24',
  25: 'tema-25',
};

export async function cargarTema(id: number): Promise<Tema> {
  const fileName = TEMA_FILE_MAP[id];
  if (!fileName) {
    throw new Error(`Tema con id ${id} no encontrado`);
  }
  const modulo = await import(`./${fileName}.json`);
  return modulo.default as Tema;
}
