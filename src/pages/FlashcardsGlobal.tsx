import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useProgress } from '../hooks/useProgress'
import { flashcardsPendientesHoy, responderFlashcard } from '../services/spaced-repetition'
import { obtenerTopics } from '../data/topics'
import type { Flashcard } from '../types'

const topbar: React.CSSProperties = {
  height: 52, borderBottom: '1px solid var(--border-soft)',
  background: 'color-mix(in srgb, var(--bg) 88%, transparent)', backdropFilter: 'blur(12px)',
}

export function FlashcardsGlobal() {
  const navigate = useNavigate()
  const { slug } = useParams<{ slug: string }>()
  const { progreso } = useProgress()
  const { cargarTema, TEMAS_META } = obtenerTopics(slug ?? 'cgpc')
  const [pendientes, setPendientes] = useState<{ card: Flashcard }[]>([])
  const [indice, setIndice] = useState(0)
  const [verRespuesta, setVerRespuesta] = useState(false)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    async function cargar() {
      const ids = flashcardsPendientesHoy(progreso.flashcards)
      // Si no hay flashcards pendientes, no hace falta cargar ningún tema
      if (ids.length === 0) {
        setCargando(false)
        return
      }
      const resultado: { card: Flashcard }[] = []
      // Carga en paralelo (los temas son independientes); se ignoran los que fallen.
      const temas = await Promise.all(
        TEMAS_META.map(meta => cargarTema(meta.id).catch(() => null))
      )
      for (const tema of temas) {
        if (!tema) continue
        tema.flashcards.filter(c => ids.includes(c.id)).forEach(card => resultado.push({ card }))
      }
      setPendientes(resultado)
      setCargando(false)
    }
    cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (cargando) return <div className="min-h-screen flex justify-center py-16" style={{ background: 'var(--bg)', color: 'var(--mute)' }}>Cargando…</div>

  if (!pendientes.length) return (
    <div className="min-h-screen fade-up flex flex-col items-center justify-center text-center px-4" style={{ background: 'var(--bg)' }}>
      <div style={{ fontSize: 52, marginBottom: 12 }}>✅</div>
      <p className="display" style={{ margin: 0, fontSize: 26 }}>¡Todo al día!</p>
      <p style={{ color: 'var(--mute)', fontSize: 13.5, marginTop: 6 }}>Sin flashcards pendientes hoy.</p>
      <button onClick={() => navigate(`/oposicion/${slug}`)} className="btn-editorial btn-sec" style={{ marginTop: 20 }}>← Volver</button>
    </div>
  )

  if (indice >= pendientes.length) return (
    <div className="min-h-screen fade-up flex flex-col items-center justify-center text-center px-4" style={{ background: 'var(--bg)' }}>
      <div style={{ fontSize: 52, marginBottom: 12 }}>🎉</div>
      <p className="display" style={{ margin: 0, fontSize: 26 }}>¡Sesión completada!</p>
      <p style={{ color: 'var(--mute)', fontSize: 13.5, marginTop: 6 }}>{pendientes.length} flashcards repasadas hoy.</p>
      <button onClick={() => navigate(`/oposicion/${slug}`)} className="btn-editorial btn-acc" style={{ marginTop: 20 }}>← Volver</button>
    </div>
  )

  const { card } = pendientes[indice]

  function responder(cal: 'facil' | 'dudoso' | 'dificil') {
    responderFlashcard(card.id, cal)
    setIndice(i => i + 1)
    setVerRespuesta(false)
  }

  return (
    <div className="min-h-screen fade-up" style={{ background: 'var(--bg)' }}>
      <header className="sticky top-0 z-10 flex items-center gap-3 px-4" style={topbar}>
        <button onClick={() => navigate(`/oposicion/${slug}`)} style={{ background: 'none', border: 0, cursor: 'pointer', color: 'var(--ink)', fontSize: 16 }}>←</button>
        <span style={{ fontWeight: 600, fontSize: 14, letterSpacing: '-0.01em' }}>🃏 Flashcards</span>
        <span className="num-display" style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--mute)' }}>{indice + 1}/{pendientes.length}</span>
      </header>
      <main className="max-w-2xl mx-auto px-4 pt-4 pb-12" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div onClick={() => setVerRespuesta(true)} className="card"
          style={{ minHeight: 200, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--ink)', lineHeight: 1.4 }}>{card.pregunta}</p>
          {!verRespuesta
            ? <p style={{ fontSize: 12, color: 'var(--mute)', marginTop: 16 }}>Toca para ver la respuesta</p>
            : <p style={{ fontSize: 14, color: 'var(--accent)', fontWeight: 600, marginTop: 16, borderTop: '1px solid var(--border-soft)', paddingTop: 16, width: '100%' }}>{card.respuesta}</p>
          }
        </div>
        {verRespuesta && (
          <div className="grid grid-cols-3 gap-2">
            {(['dificil', 'dudoso', 'facil'] as const).map(cal => {
              const color = cal === 'dificil' ? 'var(--warn)' : cal === 'dudoso' ? '#a07a2c' : 'var(--accent)'
              return (
                <button key={cal} onClick={() => responder(cal)}
                  style={{ padding: '10px 0', borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: `1px solid ${color}`, color, background: 'transparent' }}>
                  {cal === 'dificil' ? '😓 Difícil' : cal === 'dudoso' ? '🤔 Dudoso' : '😊 Fácil'}
                </button>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
