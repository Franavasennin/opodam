import type { Tema } from '../../../types'

export const TEMAS_META = [
  // Bloque General — ids 1..15
  { id: 1,  titulo: 'La Constitución Española. El Título Preliminar. Los derechos y deberes fundamentales. La dignidad de la persona. La nacionalidad y la mayoría de edad. Derechos y libertades de los extranjeros en España', bloque: 'general' },
  { id: 2,  titulo: 'El derecho a la vida y a la integridad física y moral. La libertad ideológica y religiosa. Los derechos de libertad personal. Los derechos al honor, a la intimidad y a la propia imagen. El derecho de libre residencia y circulación. Las libertades de expresión e información. El derecho de reunión y manifestación. El derecho de asociación', bloque: 'general' },
  { id: 3,  titulo: 'Garantías de las libertades y Derechos fundamentales. El Defensor del Pueblo. La suspensión de los derechos y libertades. Estado de sitio, estado de excepción y estado de alarma', bloque: 'general' },
  { id: 4,  titulo: 'La Corona. Las Cortes Generales: el Congreso de los Diputados y el Senado. Composición y funcionamiento. La circunscripción electoral. Inviolabilidad e inmunidad', bloque: 'general' },
  { id: 5,  titulo: 'El Gobierno de España. Composición y Funciones. Control jurisdiccional. Audiencia de los ciudadanos. La organización territorial del Estado', bloque: 'general' },
  { id: 6,  titulo: 'El Poder Judicial. El Ministerio Fiscal: composición y funciones. El Tribunal Constitucional: composición y funciones. El Tribunal Supremo. El Tribunal Superior de Justicia de Canarias: composición y funciones', bloque: 'general' },
  { id: 7,  titulo: 'El Estatuto de la Comunidad Autónoma de Canarias. La reforma del Estatuto. Las Instituciones de la Comunidad Autónoma. El Parlamento: composición y funciones. El Gobierno de Canarias: composición y funciones. Los Cabildos: composición y funciones', bloque: 'general' },
  { id: 8,  titulo: 'La Administración del Estado. Estructura y funciones. Las Comunidades Autónomas. La Administración autonómica. Distribución competencial entre el Estado y las Comunidades Autónomas. La Administración Local. Colaboración, cooperación y coordinación entre Administraciones', bloque: 'general' },
  { id: 9,  titulo: 'El acto administrativo. Validez, nulidad y anulabilidad. Notificación de los actos administrativos y cómputo de los plazos. El procedimiento administrativo y los recursos administrativos', bloque: 'general' },
  { id: 10, titulo: 'La jurisdicción contencioso-administrativa. Procedimientos ordinarios y especiales. El proceso contencioso-administrativo. Las partes, actos impugnables. La ejecución de la sentencia', bloque: 'general' },
  { id: 11, titulo: 'Las Administraciones Públicas Canarias: Comunidad Autónoma, Cabildos Insulares y Ayuntamientos. La Administración Pública de la Comunidad Autónoma de Canarias: organización y competencias', bloque: 'general' },
  { id: 12, titulo: 'Elementos del municipio. Territorio y población. Organización municipal. Competencias municipales. Atribuciones del Alcalde. Atribuciones del Pleno. Junta de Gobierno Local, composición y atribuciones', bloque: 'general' },
  { id: 13, titulo: 'El estatuto de los miembros de las Corporaciones locales. Personal al servicio de las Entidades locales. Adquisición y pérdida de la condición de funcionario. Incompatibilidades. Régimen estatutario', bloque: 'general' },
  { id: 14, titulo: 'Las Ordenanzas municipales. Reglamentos y Bandos. Procedimiento de elaboración y aprobación. Régimen sancionador. Clasificación de las infracciones. Sanciones. Licencias o autorizaciones municipales: tipos y actividades sujetas', bloque: 'general' },
  { id: 15, titulo: 'Los Municipios Canarios. Sesiones de los órganos municipales. Adopción de acuerdos. Información y participación ciudadana', bloque: 'general' },
  // Bloque Específico — ids 16..37
  { id: 16, titulo: 'Normativa sobre los Cuerpos y Fuerzas de Seguridad. Disposiciones generales. Principios básicos de actuación. Disposiciones estatutarias comunes. Los Cuerpos y Fuerzas de Seguridad del Estado. Funciones. Escalas. Sistema de acceso. Derechos de representación colectiva. El Régimen disciplinario', bloque: 'especifico' },
  { id: 17, titulo: 'Sistema Canario de Seguridad y Emergencias. Las policías de las Comunidades Autónomas: previsión estatutaria. Funciones. Régimen estatutario. La coordinación y colaboración entre las Fuerzas y Cuerpos de Seguridad del Estado y los cuerpos de policía autonómicos. Órganos de coordinación', bloque: 'especifico' },
  { id: 18, titulo: 'Las Policías Locales de Canarias: estructura y organización. Derechos y deberes de sus miembros. Acceso, promoción y movilidad. Régimen disciplinario: faltas y sanciones. Procedimiento sancionador. Coordinación de las Policías Locales de Canarias. La Academia Canaria de Seguridad', bloque: 'especifico' },
  { id: 19, titulo: 'Normativa sobre protección de la seguridad ciudadana. Actividades de la Policía Local en materia de protección de la seguridad ciudadana. Regulación de la utilización de videocámaras por las Fuerzas y Cuerpos de Seguridad en lugares públicos', bloque: 'especifico' },
  { id: 20, titulo: 'La policía judicial. Integrantes de la policía judicial y funciones. El atestado policial: contenido y partes. Conocimiento de la Autoridad judicial o del Ministerio Fiscal: plazos y sanciones por incumplimiento', bloque: 'especifico' },
  { id: 21, titulo: 'El sistema de protección civil. Normativa básica de Protección Civil y sus normas de desarrollo. El Sistema Canario de Emergencias: principios básicos. Conceptos y contenidos básicos de los planes de emergencia', bloque: 'especifico' },
  { id: 22, titulo: 'Las relaciones entre policía y sociedad. Policía comunitaria o de proximidad. Sistemas de patrullaje. Recogida y tratamiento de datos. Creación y gestión de archivos. Protección de datos de carácter personal', bloque: 'especifico' },
  { id: 23, titulo: 'Los delitos y sus penas. Circunstancias modificativas de la responsabilidad criminal: atenuantes, agravantes y eximentes. Delitos contra la vida y la integridad física: homicidio y lesiones. Delitos contra la libertad. Delitos contra la libertad e indemnidad sexuales. La omisión del deber de socorro', bloque: 'especifico' },
  { id: 24, titulo: 'Los delitos contra el patrimonio y contra el orden socioeconómico. Hurtos, robos, robo y hurto de uso de vehículos, usurpación, defraudaciones: estafas y apropiación indebida', bloque: 'especifico' },
  { id: 25, titulo: 'Delitos relativos a la ordenación del territorio y protección del medio ambiente. Delitos contra la seguridad colectiva: incendios, delitos contra la salud pública y contra la seguridad del tráfico. Las falsedades. Delitos contra la administración pública. Delitos contra el orden público', bloque: 'especifico' },
  { id: 26, titulo: 'La violencia de género. Ley Orgánica 1/2004, de 28 de diciembre, de Medidas de Protección Integral contra la violencia de Género. Derechos de las mujeres víctimas. Tutela institucional, penal y judicial. Medidas de protección y de seguridad', bloque: 'especifico' },
  { id: 27, titulo: 'Ley Orgánica 5/2000, de 12 de enero, reguladora de la responsabilidad penal de los menores: de las medidas; instrucción del procedimiento; medidas cautelares; ejecución de las medidas', bloque: 'especifico' },
  { id: 28, titulo: 'Los delitos leves y sus penas. Delitos leves contra las personas. Delitos leves contra el patrimonio. Delitos leves contra los intereses generales y contra el orden público', bloque: 'especifico' },
  { id: 29, titulo: 'Tráfico, circulación y seguridad vial. Normas reguladoras. Normas de comportamiento en la circulación de vehículos y peatones. Bebidas alcohólicas y sustancias estupefacientes. Límites de velocidad y distancias. Prioridad de paso. Incorporación a la circulación. Cambios de dirección, sentido y marcha atrás', bloque: 'especifico' },
  { id: 30, titulo: 'Adelantamientos. Parada y estacionamiento. Cruce de pasos a nivel y puentes levadizos. Otras normas de circulación: apagado de motor, cinturón, casco y elementos de seguridad. Tiempo de descanso y conducción. Peatones. Auxilio. Publicidad. Animales', bloque: 'especifico' },
  { id: 31, titulo: 'La señalización. Normas generales sobre señales. Prioridad entre señales. Formato e idioma de las señales. Mantenimiento de señales y señales circunstanciales. Retirada, sustitución y alteración de señales', bloque: 'especifico' },
  { id: 32, titulo: 'Las autorizaciones administrativas. Permisos y licencias de conducción. Permisos de circulación y documentación de los vehículos. La matriculación. La declaración de nulidad o lesividad y pérdida de vigencia. Suspensión cautelar', bloque: 'especifico' },
  { id: 33, titulo: 'Régimen sancionador: infracciones y sanciones. Tipificación de las faltas y graduación de las sanciones. Responsabilidad. Prescripción. Procedimiento sancionador: fases. Pérdida de puntos. Recursos. Medidas cautelares: inmovilización y retirada del vehículo', bloque: 'especifico' },
  { id: 34, titulo: 'Actividad en materia de sanidad, consumo y abastos. Obras y edificación: competencias y licencias. Régimen Jurídico de los espectáculos públicos y de las actividades clasificadas. Licencias y autorizaciones', bloque: 'especifico' },
  { id: 35, titulo: 'Protección del medio ambiente. Normativa sobre emisiones y vertidos contaminantes. Humos, ruidos y vibraciones. Régimen sancionador en las infracciones administrativas', bloque: 'especifico' },
  { id: 36, titulo: 'Ordenación del Turismo en Canarias. Normativa básica. Sujetos, actividades y establecimientos regulados. Competencias de la Administración municipal en materia de turismo. Servicios públicos turísticos municipales. Infracciones turísticas', bloque: 'especifico' },
  { id: 37, titulo: 'Población y Ecología humana. Estructura de la población en Canarias. Multiculturalismo y cohesión social. Normativa actual en materia de extranjería. El análisis de los fenómenos demográficos en Canarias', bloque: 'especifico' },
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
