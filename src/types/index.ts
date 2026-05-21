// ── Content types ─────────────────────────────────────────

export interface Seccion {
  titulo: string
  contenido: string
}

// Esquemas: cgpc usa `codigo`, policia-local usa `contenido`
export interface EsquemaMermaid {
  tipo: 'mermaid'
  titulo: string
  codigo?: string
  contenido?: string
  id?: string
}

// Nodo mapa mental: formato A (cgpc) {id, data:{label}, position:{x,y}}
//                   formato B (policia-local) {id, texto, nivel, x, y}
export interface NodoMapa {
  id: string
  data?: { label: string }
  position?: { x: number; y: number }
  texto?: string
  label?: string
  nivel?: number
  x?: number
  y?: number
  type?: string
}

// Arista mapa mental: cgpc {id, source, target}; policia-local {desde, hasta}
export interface AristaMapa {
  id?: string
  source?: string
  target?: string
  desde?: string
  hasta?: string
  origen?: string
  destino?: string
  label?: string
}

// Flashcard: cgpc {pregunta, respuesta}; policia-local {anverso, reverso}
export interface Flashcard {
  id: string
  pregunta?: string
  respuesta?: string
  anverso?: string
  reverso?: string
}

// Pregunta: cgpc {opciones[3], correcta:0-2}; policia-local {opciones[4], respuestaCorrecta:0-3}
export interface Pregunta {
  id: string
  enunciado: string
  opciones: string[]
  correcta?: number
  respuestaCorrecta?: number
  explicacion: string
}

// Helpers de normalización entre ambos formatos
export function getMermaidCode(e: EsquemaMermaid): string {
  return e.codigo ?? e.contenido ?? ''
}
export function getFlashcardFront(c: Flashcard): string {
  return c.pregunta ?? c.anverso ?? ''
}
export function getFlashcardBack(c: Flashcard): string {
  return c.respuesta ?? c.reverso ?? ''
}
export function getPreguntaCorrecta(p: Pregunta): number {
  return p.respuestaCorrecta ?? p.correcta ?? 0
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

export interface Perfil {
  id: string
  email: string
  oposiciones: string[]
  created_at: string
}
