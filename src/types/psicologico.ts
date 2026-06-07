// Módulo Psicológico por Cuerpo — tipos compartidos

export interface ResultadosPsicotecnicos {
  completado: boolean
  resultados: Record<string, number> // ej: { verbal: 72, numerico: 65, espacial: 58 }
  globalPercentil: number            // P0-P100
  fecha: string                      // ISO date
}

export interface BigFive {
  O: number // Apertura (openness)
  C: number // Responsabilidad (conscientiousness)
  E: number // Extraversión
  A: number // Amabilidad (agreeableness)
  N: number // Neuroticismo (inestabilidad emocional)
}

export interface ResultadosPersonalidad {
  completado: boolean
  bigFive: BigFive
  sesgoDeseabilidad: number // 0-100; >70 = cuestionable
  fecha: string
}

export interface ResultadosBiodata {
  completado: boolean
  respuestas: Record<string, string | number>
  fecha: string
}

export interface ResultadosEntrevista {
  sesiones: number
  ultimaFecha: string
  puntuacionMedia: number // 0-10
}

export interface PerfilPsicologico {
  psicotecnicos?: ResultadosPsicotecnicos
  personalidad?: ResultadosPersonalidad
  biodata?: ResultadosBiodata        // solo Guardia Civil
  entrevista?: ResultadosEntrevista
}

// ── Informe algorítmico ────────────────────────────────────────────
export type Veredicto = 'apto' | 'riesgo' | 'no-apto'

export interface InformeIdoneidad {
  fecha: string
  veredicto: Veredicto
  fortalezas: string[]
  mejoras: string[]
  preguntasProbables: string[]
  recomendacion: string
}

// ── Fila de Supabase ───────────────────────────────────────────────
export interface PerfilPsicologicoRow {
  id: string
  user_id: string
  oposicion_slug: string
  datos: PerfilPsicologico
  updated_at: string
}
