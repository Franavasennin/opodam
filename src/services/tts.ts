// ── P3.5 Modo audio de flashcards (TTS) ─────────────────────
// Lectura en voz alta vía Web Speech API para repasar en tiempos muertos
// (caminando, conduciendo). Defensivo: si el navegador no soporta TTS, las
// funciones no hacen nada. La parte de construcción de texto es pura.

let vozCache: SpeechSynthesisVoice | null | undefined

/** ¿El navegador soporta síntesis de voz? */
export function ttsDisponible(): boolean {
  return typeof window !== 'undefined'
    && 'speechSynthesis' in window
    && typeof SpeechSynthesisUtterance !== 'undefined'
}

/** Construye el texto hablado de una flashcard (pregunta y, opcional, respuesta). */
export function textoFlashcard(pregunta: string, respuesta?: string): string {
  const p = (pregunta ?? '').trim()
  const r = (respuesta ?? '').trim()
  if (!r) return p
  return `${p}. Respuesta: ${r}`
}

function vozEspanol(): SpeechSynthesisVoice | null {
  if (vozCache !== undefined) return vozCache
  const voces = window.speechSynthesis.getVoices()
  vozCache = voces.find(v => v.lang?.toLowerCase().startsWith('es')) ?? null
  return vozCache
}

interface OpcionesHablar {
  rate?: number
  onFin?: () => void
}

/** Lee un texto en voz alta (cancela cualquier lectura previa). */
export function hablar(texto: string, { rate = 1, onFin }: OpcionesHablar = {}): void {
  if (!ttsDisponible() || !texto.trim()) return
  const synth = window.speechSynthesis
  synth.cancel()
  const u = new SpeechSynthesisUtterance(texto)
  u.lang = 'es-ES'
  const v = vozEspanol()
  if (v) u.voice = v
  u.rate = rate
  if (onFin) u.onend = onFin
  synth.speak(u)
}

/** Detiene cualquier lectura en curso. */
export function pararTTS(): void {
  if (ttsDisponible()) window.speechSynthesis.cancel()
}
