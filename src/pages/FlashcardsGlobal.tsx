import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useProgress } from '../hooks/useProgress'
import { flashcardsPendientesHoy, responderFlashcard, ordenarPorFragilidad } from '../services/spaced-repetition'
import { obtenerTopics } from '../data/topics'
import { ttsDisponible, hablar, pararTTS, textoFlashcard } from '../services/tts'
import { Icon } from '../components/ui/Icon'
import type { Flashcard } from '../types'
import { getFlashcardFront, getFlashcardBack } from '../types'

const topbar: React.CSSProperties = {
  height: 52, borderBottom: '1px solid var(--border-soft)',
  background: 'color-mix(in srgb, var(--bg) 88%, transparent)', backdropFilter: 'blur(12px)',
}

import { FlipCard3D } from '../components/ui/FlipCard3D'
import { dispararConfetiOposicion } from '../components/ui/ConfettiBurst'

export function FlashcardsGlobal() {
  const navigate = useNavigate()
  const { slug } = useParams<{ slug: string }>()
  const { progreso } = useProgress()
  const { cargarTema, TEMAS_META } = obtenerTopics(slug ?? 'cgpc')
  const [pendientes, setPendientes] = useState<{ card: Flashcard }[]>([])
  const [indice, setIndice] = useState(0)
  const [verRespuesta, setVerRespuesta] = useState(false)
  const [cargando, setCargando] = useState(true)
  const [audio, setAudio] = useState(false)

  useEffect(() => {
    async function cargar() {
      const ids = flashcardsPendientesHoy(progreso.flashcards)
      // Si no hay flashcards pendientes, no hace falta cargar ningún tema
      if (ids.length === 0) {
        setCargando(false)
        return
      }
      // Carga en paralelo (los temas son independientes); se ignoran los que fallen.
      const temas = await Promise.all(
        TEMAS_META.map(meta => cargarTema(meta.id).catch(() => null))
      )
      const porId = new Map<string, Flashcard>()
      for (const tema of temas) {
        if (!tema) continue
        tema.flashcards.filter(c => ids.includes(c.id)).forEach(card => porId.set(card.id, card))
      }
      // P1.4: repasar primero lo más frágil (nivel bajo / más vencido).
      const resultado = ordenarPorFragilidad(ids, progreso.flashcards)
        .map(id => porId.get(id))
        .filter((c): c is Flashcard => c != null)
        .map(card => ({ card }))
      setPendientes(resultado)
      setCargando(false)
    }
    cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // P3.5 — modo audio: lee la pregunta al aparecer la card y la respuesta al revelarla.
  useEffect(() => {
    if (!audio) return
    const item = pendientes[indice]
    if (item) hablar(textoFlashcard(getFlashcardFront(item.card)))
  }, [audio, indice, pendientes])

  useEffect(() => {
    if (!audio || !verRespuesta) return
    const item = pendientes[indice]
    if (item) hablar(getFlashcardBack(item.card))
  }, [verRespuesta, audio, indice, pendientes])

  useEffect(() => () => pararTTS(), [])

  if (cargando) return <div className="min-h-screen flex justify-center py-16" style={{ background: 'var(--bg)', color: 'var(--mute)' }}>Cargando…</div>

  if (!pendientes.length) return (
    <div className="min-h-screen fade-up flex flex-col items-center justify-center text-center px-4" style={{ background: 'var(--bg)' }}>
      <div style={{ marginBottom: 12, color: 'var(--accent)' }}><Icon nombre="acierto" size={52} /></div>
      <p className="display" style={{ margin: 0, fontSize: 26 }}>¡Todo al día!</p>
      <p style={{ color: 'var(--mute)', fontSize: 13.5, marginTop: 6 }}>Sin flashcards pendientes hoy.</p>
      <button onClick={() => navigate(`/oposicion/${slug}`)} className="btn-editorial btn-sec tactile-press" style={{ marginTop: 20 }}>← Volver</button>
    </div>
  )

  if (indice >= pendientes.length) return (
    <div className="min-h-screen fade-up flex flex-col items-center justify-center text-center px-4" style={{ background: 'var(--bg)' }}>
      <div style={{ marginBottom: 12, color: 'var(--accent)' }}><Icon nombre="celebracion" size={52} /></div>
      <p className="display" style={{ margin: 0, fontSize: 28 }}>¡Sesión completada!</p>
      <p style={{ color: 'var(--mute)', fontSize: 14, marginTop: 6 }}>{pendientes.length} flashcards repasadas con éxito hoy.</p>
      <button onClick={() => navigate(`/oposicion/${slug}`)} className="btn-editorial btn-acc tactile-press" style={{ marginTop: 20 }}>← Volver al panel</button>
    </div>
  )

  const { card } = pendientes[indice]

  function responder(cal: 'facil' | 'dudoso' | 'dificil') {
    responderFlashcard(card.id, cal)
    const siguiente = indice + 1
    if (siguiente >= pendientes.length) {
      dispararConfetiOposicion()
    }
    setIndice(siguiente)
    setVerRespuesta(false)
  }

  return (
    <div className="min-h-screen fade-up" style={{ background: 'var(--bg)' }}>
      <header className="sticky top-0 z-10 flex items-center gap-3 px-4" style={topbar}>
        <button onClick={() => navigate(`/oposicion/${slug}`)} className="tactile-press" style={{ background: 'none', border: 0, minHeight: 44, minWidth: 44, cursor: 'pointer', color: 'var(--ink)', fontSize: 16 }}>←</button>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontWeight: 600, fontSize: 14, letterSpacing: '-0.01em' }}>
          <Icon nombre="flashcards" size={16} /> Flashcards 3D
        </span>
        {ttsDisponible() && (
          <button
            onClick={() => setAudio(a => { if (a) pararTTS(); return !a })}
            title={audio ? 'Desactivar audio' : 'Leer en voz alta'}
            aria-pressed={audio}
            className="tactile-press"
            style={{ marginLeft: 'auto', display: 'inline-flex', background: 'none', border: 0, minHeight: 44, minWidth: 44, cursor: 'pointer', color: 'var(--ink)', opacity: audio ? 1 : 0.5 }}>
            <Icon nombre={audio ? 'sonido' : 'silencio'} size={18} />
          </button>
        )}
        <span className="num-display" style={{ marginLeft: ttsDisponible() ? 8 : 'auto', fontSize: 12, color: 'var(--mute)' }}>{indice + 1}/{pendientes.length}</span>
      </header>
      <main className="max-w-2xl mx-auto px-4 pt-4 pb-12" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Barra de progreso de la sesión */}
        <div className="w-full bg-[var(--surface-2)] h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-[var(--accent)] h-full transition-all duration-300 ease-out"
            style={{ width: `${((indice + 1) / pendientes.length) * 100}%` }}
          />
        </div>

        {/* Tarjeta 3D con volteo físico */}
        <FlipCard3D
          front={card.pregunta}
          back={card.respuesta}
          isFlipped={verRespuesta}
          onFlip={() => setVerRespuesta(v => !v)}
        />

        {verRespuesta && (
          <div className="grid grid-cols-3 gap-3 pt-2">
            {(['dificil', 'dudoso', 'facil'] as const).map(cal => {
              const color = cal === 'dificil' ? 'var(--warn)' : cal === 'dudoso' ? 'var(--gold)' : 'var(--accent)'
              return (
                <button
                  key={cal}
                  onClick={() => responder(cal)}
                  className="tactile-press"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    padding: '12px 0',
                    borderRadius: 14,
                    fontSize: 13.5,
                    fontWeight: 600,
                    cursor: 'pointer',
                    border: `1.5px solid ${color}`,
                    color,
                    background: 'var(--surface)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                  }}
                >
                  <Icon nombre={cal === 'dificil' ? 'triste' : cal === 'dudoso' ? 'duda' : 'contento'} size={16} />
                  {cal === 'dificil' ? 'Difícil' : cal === 'dudoso' ? 'Dudoso' : 'Fácil'}
                </button>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
