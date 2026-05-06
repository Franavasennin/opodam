import type { Tema } from '../../../types';

export const TEMAS_META = [
  // Bloque General
  { id: 1,  titulo: 'La Constitución Española de 1978. Estructura y contenido. Derechos y deberes fundamentales. Los estados excepcionales', bloque: 'general' },
  { id: 2,  titulo: 'La Corona. Funciones constitucionales del Rey. El refrendo', bloque: 'general' },
  { id: 3,  titulo: 'Las Cortes Generales. El Congreso y el Senado. La función legislativa. Relaciones Gobierno-Cortes', bloque: 'general' },
  { id: 4,  titulo: 'El Gobierno. El Presidente del Gobierno. Los Ministros. Las Comisiones Delegadas. El Consejo de Estado', bloque: 'general' },
  { id: 5,  titulo: 'El Poder Judicial. El Tribunal Constitucional. El Tribunal Supremo. El Consejo General del Poder Judicial', bloque: 'general' },
  { id: 6,  titulo: 'La organización territorial del Estado. Las Comunidades Autónomas. Los Estatutos de Autonomía. La financiación autonómica', bloque: 'general' },
  { id: 7,  titulo: 'La Comunidad Autónoma de Canarias. El Estatuto de Autonomía de Canarias. El Parlamento de Canarias. El Gobierno de Canarias', bloque: 'general' },
  { id: 8,  titulo: 'La Administración Pública. Principios constitucionales. La Administración del Estado. La Administración Local. La Administración Autonómica', bloque: 'general' },
  { id: 9,  titulo: 'El acto administrativo. Concepto, elementos y clases. La notificación. El silencio administrativo. La ejecución forzosa', bloque: 'general' },
  { id: 10, titulo: 'El procedimiento administrativo. La Ley 39/2015. Fases. Los recursos administrativos: alzada, reposición y revisión', bloque: 'general' },
  { id: 11, titulo: 'La responsabilidad patrimonial de la Administración Pública. Requisitos. El procedimiento. La acción de regreso', bloque: 'general' },
  { id: 12, titulo: 'El personal al servicio de las Administraciones Públicas. Clases. Derechos y deberes. Incompatibilidades. Régimen disciplinario', bloque: 'general' },
  { id: 13, titulo: 'Los contratos del sector público. Ley 9/2017 LCSP. Tipos. El contrato de obras. El contrato de servicios. Garantías', bloque: 'general' },
  { id: 14, titulo: 'El Código Penal. Concepto y principios. La infracción penal. Circunstancias modificativas de la responsabilidad criminal. Las penas', bloque: 'general' },
  { id: 15, titulo: 'Delitos contra la vida e integridad física. Homicidio. Asesinato. Lesiones. El delito de violencia habitual', bloque: 'general' },
  { id: 16, titulo: 'Delitos contra la libertad. Detenciones ilegales y secuestro. Amenazas. Coacciones. Acoso', bloque: 'general' },
  { id: 17, titulo: 'Delitos contra el patrimonio. Robo. Hurto. Estafa. Apropiación indebida. Daños. Receptación', bloque: 'general' },
  { id: 18, titulo: 'Delitos contra la salud pública. Tráfico de drogas. Delitos contra la seguridad vial', bloque: 'general' },
  { id: 19, titulo: 'Delitos contra la Administración Pública. Prevaricación. Cohecho. Tráfico de influencias. Malversación. Fraudes', bloque: 'general' },
  { id: 20, titulo: 'Delitos contra el orden público. Sedición. Atentado. Resistencia. Desobediencia. Desórdenes públicos', bloque: 'general' },
  { id: 21, titulo: 'La Ley de Enjuiciamiento Criminal. El proceso penal. La detención. La prisión provisional. El juicio oral', bloque: 'general' },
  { id: 22, titulo: 'La protección de datos. El RGPD. La LO 3/2018. La Agencia Española de Protección de Datos. Derechos ARCO', bloque: 'general' },
  { id: 23, titulo: 'La Ley Orgánica 4/2015 de Protección de la Seguridad Ciudadana. Infracciones y sanciones. El derecho de reunión', bloque: 'general' },
  // Bloque Específico
  { id: 24, titulo: 'Las Fuerzas y Cuerpos de Seguridad. LO 2/1986. Principios básicos de actuación. Policías de las CCAA y Policías Locales', bloque: 'especifico' },
  { id: 25, titulo: 'El Sistema Canario de Seguridad y Emergencias. La Ley 9/2007. CECOES 1-1-2', bloque: 'especifico' },
  { id: 26, titulo: 'El personal de la Policía Canaria. Decreto 87/2021. Estructura de la Policía Canaria. Régimen disciplinario', bloque: 'especifico' },
  { id: 27, titulo: 'La coordinación de las Policías Locales de Canarias. Ley 6/1997. Homologación. La Junta de Coordinación', bloque: 'especifico' },
  { id: 28, titulo: 'Deontología policial. El Código Europeo de Ética Policial. Declaración de Barcelona. Derechos humanos y policía', bloque: 'especifico' },
  { id: 29, titulo: 'Los derechos fundamentales en la actuación policial. La detención policial. El registro de personas y lugares. La entrada en domicilio', bloque: 'especifico' },
  { id: 30, titulo: 'La identificación de personas. Las diligencias de identificación. Cacheos. Las restricciones de derechos en la actuación policial', bloque: 'especifico' },
  { id: 31, titulo: 'La violencia de género. LO 1/2004. Protocolos de actuación policial ante la violencia de género. La orden de protección', bloque: 'especifico' },
  { id: 32, titulo: 'La protección de menores. LO 1/1996. La Ley de Protección de la Infancia. Actuación policial ante menores', bloque: 'especifico' },
  { id: 33, titulo: 'El tráfico y la seguridad vial. RDL 6/2015. El permiso de conducir por puntos. Las infracciones de tráfico. El atestado de accidente', bloque: 'especifico' },
  { id: 34, titulo: 'Las armas. Reglamento de Armas RD 137/1993. Clases de armas. El uso de armas por la policía. La legítima defensa', bloque: 'especifico' },
  { id: 35, titulo: 'La policía administrativa. Las infracciones administrativas. El procedimiento sancionador. La potestad inspectora', bloque: 'especifico' },
  { id: 36, titulo: 'La policía de proximidad. La mediación policial. El policía comunitario. Relaciones policía-ciudadano', bloque: 'especifico' },
  { id: 37, titulo: 'La criminalística. El atestado policial. Las pruebas periciales. La cadena de custodia. La inspección ocular', bloque: 'especifico' },
  { id: 38, titulo: 'Las emergencias y la protección civil. El Plan Territorial de Emergencias de Canarias (PLATECA). Actuación policial en emergencias', bloque: 'especifico' },
  { id: 39, titulo: 'La seguridad privada. Ley 5/2014. Los vigilantes de seguridad. Coordinación con las Fuerzas y Cuerpos de Seguridad', bloque: 'especifico' },
  { id: 40, titulo: 'Las comunicaciones policiales. Las transmisiones. El Sistema de Información Schengen (SIS). Las bases de datos policiales', bloque: 'especifico' },
  { id: 41, titulo: 'El uso de la fuerza policial. Los principios de proporcionalidad, congruencia y oportunidad. Las esposas y otros medios coercitivos', bloque: 'especifico' },
  { id: 42, titulo: 'Los primeros auxilios. El soporte vital básico. La RCP. Actuación policial ante accidentes y urgencias sanitarias', bloque: 'especifico' },
  { id: 43, titulo: 'La geografía de Canarias. Las islas y municipios. Aspectos físicos, sociodemográficos y económicos', bloque: 'especifico' },
  { id: 44, titulo: 'La economía de Canarias. El Régimen Económico y Fiscal canario (REF). El turismo. La agricultura. La pesca', bloque: 'especifico' },
  { id: 45, titulo: 'Las instituciones canarias. El Parlamento de Canarias. El Gobierno. El Presidente. El Defensor del Pueblo canario. El Consejo Consultivo', bloque: 'especifico' },
] as const;

export type TemaMeta = typeof TEMAS_META[number];
export const TOTAL_TEMAS = TEMAS_META.length; // 45

const TEMA_FILE_MAP: Record<number, string> = {
  1: 'tema-01', 2: 'tema-02', 3: 'tema-03', 4: 'tema-04', 5: 'tema-05',
  6: 'tema-06', 7: 'tema-07', 8: 'tema-08', 9: 'tema-09', 10: 'tema-10',
  11: 'tema-11', 12: 'tema-12', 13: 'tema-13', 14: 'tema-14', 15: 'tema-15',
  16: 'tema-16', 17: 'tema-17', 18: 'tema-18', 19: 'tema-19', 20: 'tema-20',
  21: 'tema-21', 22: 'tema-22', 23: 'tema-23', 24: 'tema-24', 25: 'tema-25',
  26: 'tema-26', 27: 'tema-27', 28: 'tema-28', 29: 'tema-29', 30: 'tema-30',
  31: 'tema-31', 32: 'tema-32', 33: 'tema-33', 34: 'tema-34', 35: 'tema-35',
  36: 'tema-36', 37: 'tema-37', 38: 'tema-38', 39: 'tema-39', 40: 'tema-40',
  41: 'tema-41', 42: 'tema-42', 43: 'tema-43', 44: 'tema-44', 45: 'tema-45',
};

export async function cargarTema(id: number): Promise<Tema> {
  const fileName = TEMA_FILE_MAP[id];
  if (!fileName) throw new Error(`Tema con id ${id} no encontrado`);
  const modulo = await import(`./${fileName}.json`);
  return modulo.default as Tema;
}
