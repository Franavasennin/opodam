// src/services/entrevista.ts
// Cliente del entrenador de entrevista. POST a /.netlify/functions/entrevista-chat.

export interface MensajeEntrevista {
  role: 'user' | 'assistant'
  content: string
}
export type ModoEntrevista = 'practica' | 'examen'

const ENDPOINT = '/.netlify/functions/entrevista-chat'

export async function enviarTurnoEntrevista(
  messages: MensajeEntrevista[],
  cuerpo: string,
  modo: ModoEntrevista,
): Promise<{ content: string | null; error: string | null }> {
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, cuerpo, modo }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) return { content: null, error: (data && data.error) || `HTTP ${res.status}` }
    return { content: (data && data.content) || '', error: null }
  } catch (err) {
    return { content: null, error: err instanceof Error ? err.message : 'Error desconocido' }
  }
}
