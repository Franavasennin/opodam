// ── Content types ─────────────────────────────────────────

export interface Seccion {
  titulo: string
  contenido: string
}

export interface EsquemaMermaid {
  tipo: 'mermaid'
  titulo: string
  codigo: string
}

export interface NodoMapa {
  id: string
  data: { label: string }
  position: { x: number; y: number }
  type?: string
}

export interface AristaMapa {
  id: string
  source: string
  target: string
  label?: string
}

export interface Flashcard {
  id: string
  pregunta: string
  respuesta: string
}

export interface Pregunta {
  id: string
  enunciado: string
  opciones: [string, string, string]
  correcta: 0 | 1 | 2
  explicacion: string
}

export type Bloque = 'general' | 'especifico'

export interface Tema {
  id: number
  titulo: string
  bloque: Bloque
  secciones: Seccion[]
  esquemas: EsquemaMermaid[]
  mapaMental: { nodos: NodoMapa[]; aristas: AristaMapa[] }
  flashcards: Flashcard[]
  preguntas: Pregunta[]
}

// ── Progress types ─────────────────────────────────────────

export interface ProgresoTema {
  vueltas: number
  ultimaRevision: string | null   // YYYY-MM-DD
  porcentajeAciertos: number      // 0-100
  teoriaLeida: boolean
}

export interface EstadoFlashcard {
  proximoRepaso: string           // YYYY-MM-DD
  nivel: number                   // 0-5
  intervalo: number               // days until next review
}

export type PreguntaExt = Pregunta & { temaId: number }

export interface RendimientoTema {
  aciertos: number
  errores: number
  total: number
}

export interface ExamenResultado {
  id: string        // timestamp ISO, ej: "2026-05-02T18:30:00.000Z"
  fecha: string     // YYYY-MM-DD
  modo: 'completo' | 'mini'
  aciertos: number
  errores: number
  enBlanco: number
  nota: number      // 0–10, 2 decimales
  aprobado: boolean
  tiempoSegundos: number
  preguntasIds: string[]
  respuestasUsuario: Record<string, number | null>
  resultadosPorTema: Record<string, RendimientoTema>
}

export interface Progreso {
  temas: Record<string, ProgresoTema>
  flashcards: Record<string, EstadoFlashcard>
  racha: { dias: number; ultimoEstudio: string | null }
  tiempoTotalSegundos: number
  notificaciones: { hora: string; activas: boolean }
  historialExamenes: ExamenResultado[]
  sesionDiaria: { fecha: string; flashcardIds: string[]; preguntaIds: string[]; completada: boolean } | null
  rendimientoPorTema: Record<string, RendimientoTema>
}
