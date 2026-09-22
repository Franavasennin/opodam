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
  // Opcional: razonamiento por cada opción (mismo orden que `opciones`).
  // Si falta, la UI usa la explicación global en la opción correcta.
  explicaciones?: string[]
  // Dificultad de la pregunta. Ausente = 'normal' (compatibilidad con bancos antiguos).
  // 'dificil' = pregunta trampa (distractores muy cercanos, matices, plazos, nº de artículo…).
  dificultad?: 'normal' | 'dificil'
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
  // Vídeos fuente (solo temas con contenido en vídeo, p.ej. security-plus). Opcional.
  videos?: { titulo: string; youtubeId: string }[]
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
  nivel: number                   // 0-5 (legado SM-2; se mantiene para UI/orden)
  intervalo: number               // days until next review
  // P3.1 FSRS-4.5 — opcionales: ausentes en estados pre-FSRS (se migran al vuelo)
  stability?: number              // S FSRS
  difficulty?: number             // D FSRS (1..10)
  ultimaRevision?: string         // YYYY-MM-DD del último repaso
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

// Cuaderno de errores: una entrada por pregunta fallada al menos una vez.
// Se "gradúa" (sale del cuaderno) cuando se acierta 2 veces seguidas.
export interface ErrorPregunta {
  temaId: number
  fallos: number
  aciertosSeguidos: number
  ultimoFallo: string             // YYYY-MM-DD
  // P1.5: confianza declarada en el último intento fallado. Un 'seguro' que falla
  // (ilusión de saber) es lo más peligroso → prioridad máxima en el cuaderno.
  confianza?: 'seguro' | 'dudo'
}

// P1.5: calibración de confianza. Cuenta cómo se reparten las respuestas según
// lo seguro que estaba el alumno frente al resultado real.
export type Confianza = 'seguro' | 'dudo'

export interface Calibracion {
  seguroAcierto: number
  seguroFallo: number   // "falsos seguros" = ilusión de saber
  dudoAcierto: number
  dudoFallo: number
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
  // Cuaderno de errores (clave = id de pregunta). Default {} para progresos antiguos.
  erroresPorPregunta: Record<string, ErrorPregunta>
  // P1.5: calibración de confianza acumulada. Default a ceros para progresos antiguos.
  calibracion: Calibracion
  // P2.4: segundos de estudio acumulados por tema (clave = id de tema). Default {}.
  tiempoPorTema: Record<string, number>
}

export interface Perfil {
  id: string
  email: string
  oposiciones: string[]
  created_at: string
  rol?: 'owner' | 'beta' | 'trial'
  trial_start?: string | null
}
