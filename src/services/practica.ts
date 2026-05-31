// src/services/practica.ts
// Cliente de generación efímera de práctica (psicotécnicos / supuestos).

import type { PreguntaTest } from '../components/test/MotorTest'

const ENDPOINT = '/.netlify/functions/practica-generate'

export interface SupuestoGenerado {
  titulo: string
  caso: string
  preguntas: PreguntaTest[]
}

async function post(body: unknown): Promise<{ data: any; error: string | null }> {
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) return { data: null, error: (data && data.error) || `HTTP ${res.status}` }
    return { data, error: null }
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Error desconocido' }
  }
}

export async function generarPsicotecnicos(categoria: string): Promise<{ preguntas: PreguntaTest[]; error: string | null }> {
  const { data, error } = await post({ tipo: 'psicotecnico', categoria })
  if (error || !data) return { preguntas: [], error }
  return { preguntas: (data.preguntas as PreguntaTest[]) ?? [], error: null }
}

export async function generarSupuesto(slug: string, contexto: string): Promise<{ supuesto: SupuestoGenerado | null; error: string | null }> {
  const { data, error } = await post({ tipo: 'supuesto', slug, contexto })
  if (error || !data) return { supuesto: null, error }
  return { supuesto: (data.supuesto as SupuestoGenerado) ?? null, error: null }
}

export interface FlashcardGenerada { pregunta: string; respuesta: string }

export async function generarTestDuda(duda: string, contexto: string): Promise<{ preguntas: PreguntaTest[]; error: string | null }> {
  const { data, error } = await post({ tipo: 'tutor-test', duda, contexto })
  if (error || !data) return { preguntas: [], error }
  const items = (data.preguntas as Omit<PreguntaTest, 'id'>[]) ?? []
  const preguntas = items.map((q, i) => ({ ...q, id: `tutor-q${i}` }))
  return { preguntas, error: null }
}

export async function generarFlashcardsDuda(duda: string, contexto: string): Promise<{ flashcards: FlashcardGenerada[]; error: string | null }> {
  const { data, error } = await post({ tipo: 'tutor-flashcards', duda, contexto })
  if (error || !data) return { flashcards: [], error }
  return { flashcards: (data.flashcards as FlashcardGenerada[]) ?? [], error: null }
}
