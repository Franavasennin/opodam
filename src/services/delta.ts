// src/services/delta.ts
// Cliente para el agente DELTA (entrenador de oposiciones físicas).
// Llama a /.netlify/functions/delta-chat, que proxea a Groq Cloud.

export type Cuerpo =
  | 'guardia_civil'
  | 'policia_nacional'
  | 'policia_local'
  | 'cgpc'
  | 'fuerzas_armadas'
  | 'bomberos'

export type Nivel = 'beginner' | 'intermediate' | 'advanced'

export interface PerfilDelta {
  name?: string
  cuerpo?: Cuerpo
  goal?: string
  level?: Nivel
  weekly_days?: string
  equipment?: 'home' | 'full_gym' | 'mixto'
  injuries?: string
  target_date?: string
  extra_context?: string
}

export interface MensajeChat {
  role: 'user' | 'assistant'
  content: string
}

const ENDPOINT = '/.netlify/functions/delta-chat'

export async function enviarMensajeDelta(
  messages: MensajeChat[],
  profile: PerfilDelta,
): Promise<{ content: string | null; error: string | null }> {
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, profile }),
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
