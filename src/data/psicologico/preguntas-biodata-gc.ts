// Cuestionario Biodata — Cuerpos policiales
// Disponible para: guardia-civil, cgpc, policia-local
// Las respuestas se guardan en PerfilPsicologico.biodata.respuestas

export type TipoCampo = 'numero' | 'select' | 'texto' | 'boolean'

export interface PreguntaBiodata {
  id: string
  seccion: string
  pregunta: string
  tipo: TipoCampo
  opciones?: string[]         // para tipo 'select'
  min?: number                // para tipo 'numero'
  max?: number
  clave: string               // key en el objeto respuestas
}

const NOMBRE_CUERPO_BIODATA: Record<string, string> = {
  'guardia-civil': 'Guardia Civil',
  'cgpc': 'Policía Canaria',
  'policia-local': 'Policía Local',
}

export const PREGUNTAS_BIODATA_GC: PreguntaBiodata[] = [
  // ── Actividad física ──────────────────────────────────────────────
  {
    id: 'bg-01',
    seccion: 'Actividad física',
    pregunta: '¿Cuántas horas semanales dedicas a actividad física o deporte?',
    tipo: 'numero',
    min: 0,
    max: 40,
    clave: 'actividadFisicaHoras',
  },
  {
    id: 'bg-02',
    seccion: 'Actividad física',
    pregunta: '¿Qué tipo de actividad física practicas principalmente?',
    tipo: 'select',
    opciones: ['Musculación / gym', 'Running / atletismo', 'Artes marciales', 'Deportes de equipo', 'Ciclismo / natación', 'No practico'],
    clave: 'tipoActividad',
  },
  {
    id: 'bg-03',
    seccion: 'Actividad física',
    pregunta: '¿Has completado alguna prueba de resistencia (maratón, triatlón, etc.)?',
    tipo: 'boolean',
    clave: 'pruebaResistencia',
  },

  // ── Experiencia previa ─────────────────────────────────────────────
  {
    id: 'bg-04',
    seccion: 'Experiencia previa',
    pregunta: '¿Tienes experiencia previa en Fuerzas y Cuerpos de Seguridad o Fuerzas Armadas?',
    tipo: 'boolean',
    clave: 'experienciaPrevia',
  },
  {
    id: 'bg-05',
    seccion: 'Experiencia previa',
    pregunta: '¿Has trabajado en servicios de emergencias (bombero, sanitario, protección civil)?',
    tipo: 'boolean',
    clave: 'experienciaEmergencias',
  },
  {
    id: 'bg-06',
    seccion: 'Experiencia previa',
    pregunta: '¿Has realizado voluntariado o actividades de servicio a la comunidad?',
    tipo: 'select',
    opciones: ['Nunca', 'Ocasionalmente', 'De forma regular (> 1 año)', 'Actualmente lo hago'],
    clave: 'voluntariado',
  },

  // ── Motivación — las preguntas bg-07 y bg-08 se inyectan con nombre del cuerpo
  // (ver getPreguntasBiodata)
  {
    id: 'bg-07',
    seccion: 'Motivación',
    pregunta: '¿Cuánto tiempo llevas preparando esta oposición?',
    tipo: 'select',
    opciones: ['Menos de 6 meses', '6 meses – 1 año', '1 – 2 años', 'Más de 2 años'],
    clave: 'tiempoPreparacion',
  },
  {
    id: 'bg-08',
    seccion: 'Motivación',
    pregunta: '¿Cuál es tu principal motivación para opositar?',
    tipo: 'select',
    opciones: [
      'Vocación de servicio público',
      'Estabilidad laboral',
      'Tradición familiar',
      'Interés por la seguridad y el orden',
      'Reto personal',
    ],
    clave: 'motivacionPrincipal',
  },

  // ── Historial académico / formativo ───────────────────────────────
  {
    id: 'bg-09',
    seccion: 'Formación',
    pregunta: '¿Cuál es tu nivel de estudios completado?',
    tipo: 'select',
    opciones: ['ESO / Graduado escolar', 'Bachillerato / FP Medio', 'FP Superior', 'Grado universitario', 'Postgrado / Máster'],
    clave: 'nivelEstudios',
  },
  {
    id: 'bg-10',
    seccion: 'Formación',
    pregunta: '¿Tienes carnet de conducir?',
    tipo: 'select',
    opciones: ['Solo B', 'B + A (moto)', 'B + C (camión)', 'Varios (B, A, C…)'],
    clave: 'carnetConducir',
  },

  // ── Perfil social ──────────────────────────────────────────────────
  {
    id: 'bg-11',
    seccion: 'Perfil social',
    pregunta: '¿Cómo describes tu estilo de trabajo?',
    tipo: 'select',
    opciones: ['Prefiero trabajar solo', 'Me adapto a ambas situaciones', 'Me siento mejor en equipo'],
    clave: 'estiloTrabajo',
  },
  {
    id: 'bg-12',
    seccion: 'Perfil social',
    pregunta: '¿Has ocupado roles de liderazgo (jefe de equipo, delegado, responsable…)?',
    tipo: 'boolean',
    clave: 'rolLiderazgo',
  },
]

/** Devuelve las preguntas de biodata con los textos adaptados al cuerpo. */
export function getPreguntasBiodata(slug: string): PreguntaBiodata[] {
  const nombre = NOMBRE_CUERPO_BIODATA[slug] ?? 'este cuerpo'
  return PREGUNTAS_BIODATA_GC.map(p => {
    if (p.id === 'bg-07') return { ...p, pregunta: `¿Cuánto tiempo llevas preparando oposiciones a ${nombre}?` }
    if (p.id === 'bg-08') return { ...p, pregunta: `¿Cuál es tu principal motivación para ser ${nombre}?` }
    return p
  })
}
