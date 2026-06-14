// src/services/tutor.ts
// Cliente del tutor IA. Llama a /.netlify/functions/tutor-chat (proxy a Groq).

export interface MensajeTutor {
  role: 'user' | 'assistant'
  content: string
}

export interface ContextoTema {
  oposicion: string
  temaId: number
  titulo: string
  secciones: Array<{ titulo: string; contenido: string }>
  flashcards: Array<Record<string, unknown>>
  preguntas: Array<Record<string, unknown>>
  // P2.2: bloque compacto con las debilidades del alumno (null = sin datos).
  perfilAlumno?: string | null
}

const ENDPOINT = '/.netlify/functions/tutor-chat'

export async function preguntarTutor(
  messages: MensajeTutor[],
  contexto: ContextoTema,
): Promise<{ content: string | null; error: string | null }> {
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, contexto }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      return { content: null, error: (data && data.error) || `HTTP ${res.status}` }
    }
    return { content: (data && data.content) || '', error: null }
  } catch (err) {
    return { content: null, error: err instanceof Error ? err.message : 'Error desconocido' }
  }
}
