import type { Tema } from '../../../types';

export const TEMAS_META = [
  { id: 1, titulo: "La Constitución Española de 1978. Las atribuciones de la Corona. Las Cortes Generales. La elaboración de las leyes. El Tribunal Constitucional", bloque: "general" },
  { id: 2, titulo: "Derecho de igualdad y no discriminación por razón de género. La Ley Orgánica 3/2007 para la igualdad efectiva de mujeres y hombres. La Ley Orgánica 1/2004 de protección integral contra la violencia de género", bloque: "general" },
  { id: 3, titulo: "El Gobierno y la Administración. Organización administrativa española", bloque: "general" },
  { id: 4, titulo: "La organización territorial del Estado. La Administración Local: la provincia y el municipio. Las Comunidades Autónomas: instituciones, competencias y Estatutos de Autonomía", bloque: "general" },
  { id: 5, titulo: "Organización de la Unión Europea. Competencias e instituciones", bloque: "general" },
  { id: 6, titulo: "El Poder Judicial. El Consejo General del Poder Judicial. La jurisdicción. La independencia judicial. El Ministerio Fiscal. Los sistemas de acceso a las carreras judicial y fiscal", bloque: "general" },
  { id: 7, titulo: "Los Juzgados: de Primera Instancia e Instrucción, de lo Mercantil, de lo Penal, de lo Contencioso-Administrativo, de lo Social, de Vigilancia Penitenciaria, de Menores, de Violencia sobre la Mujer y de Paz", bloque: "general" },
  { id: 8, titulo: "Juzgados", bloque: "general" },
  { id: 9, titulo: "La Carta de Derechos de los Ciudadanos ante la Justicia", bloque: "general" },
  { id: 10, titulo: "La modernización de la oficina judicial", bloque: "general" },
  { id: 11, titulo: "El Cuerpo de Letrados de la Administración de Justicia: ingreso, categorías, adquisición y pérdida de la condición", bloque: "general" },
  { id: 12, titulo: "Cuerpos de funcionarios al servicio de la Administración de Justicia. Cuerpos especiales: el Cuerpo de Médicos Forenses: funciones", bloque: "general" },
  { id: 13, titulo: "Funciones y formas de acceso en los cuerpos generales al servicio de la Administración de Justicia", bloque: "general" },
  { id: 14, titulo: "Situaciones administrativas en los Cuerpos Generales de Funcionarios al Servicio de la Administración de Justicia", bloque: "general" },
  { id: 15, titulo: "Libertad sindical", bloque: "general" },
  { id: 16, titulo: "Los procedimientos declarativos en la LEC 1/2000", bloque: "general" },
  { id: 17, titulo: "Los procedimientos ejecutivos en la LEC 1/2000", bloque: "general" },
  { id: 18, titulo: "Los procedimientos especiales en la LEC 1/2000", bloque: "general" },
  { id: 19, titulo: "La jurisdicción voluntaria. Especial referencia a los actos de conciliación", bloque: "general" },
  { id: 20, titulo: "Los procedimientos penales en la LECr", bloque: "general" },
  { id: 21, titulo: "Procedimiento de juicio sobre delitos leves", bloque: "general" },
  { id: 22, titulo: "Los procedimientos contencioso-administrativos: ordinario, abreviado y especiales", bloque: "general" },
  { id: 23, titulo: "Los procedimientos laborales. El proceso ordinario ante la jurisdicción social. Procedimientos especiales y recursos", bloque: "general" },
  { id: 24, titulo: "Recursos: cuestiones generales sobre el derecho al recurso. Recursos en el proceso civil y en el proceso penal. Recursos ordinarios y extraordinarios", bloque: "general" },
  { id: 25, titulo: "Requisitos de los actos procesales", bloque: "general" },
  { id: 26, titulo: "Actos procesales. Resoluciones judiciales", bloque: "general" },
  { id: 27, titulo: "Actos de comunicación con otros tribunales y autoridades", bloque: "general" },
  { id: 28, titulo: "Actos de comunicación a las partes y otros intervinientes en el proceso: notificaciones, citaciones, emplazamientos y requerimientos. Formas de los actos de comunicación y nuevas tecnologías", bloque: "general" },
  { id: 29, titulo: "El Registro Civil", bloque: "general" },
] as const;

export type TemaMeta = typeof TEMAS_META[number];
export const TOTAL_TEMAS = TEMAS_META.length;

const TEMA_FILE_MAP: Record<number, string> = {
  1: "tema-01",
  2: "tema-02",
  3: "tema-03",
  4: "tema-04",
  5: "tema-05",
  6: "tema-06",
  7: "tema-07",
  8: "tema-08",
  9: "tema-09",
  10: "tema-10",
  11: "tema-11",
  12: "tema-12",
  13: "tema-13",
  14: "tema-14",
  15: "tema-15",
  16: "tema-16",
  17: "tema-17",
  18: "tema-18",
  19: "tema-19",
  20: "tema-20",
  21: "tema-21",
  22: "tema-22",
  23: "tema-23",
  24: "tema-24",
  25: "tema-25",
  26: "tema-26",
  27: "tema-27",
  28: "tema-28",
  29: "tema-29",
};

// Auxilio Judicial reutiliza el contenido de Tramitación Judicial (temas 1-29).
export async function cargarTema(id: number): Promise<Tema> {
  const fileName = TEMA_FILE_MAP[id];
  if (!fileName) throw new Error(`Tema con id ${id} no encontrado`);
  const modulo = await import(`../tramitacion-judicial/${fileName}.json`);
  return modulo.default as Tema;
}
