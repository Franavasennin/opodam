import { useState } from 'react'
import { responderFlashcard, inicializarFlashcards } from '../../services/spaced-repetition'
import type { Tema } from '../../types'
import { getFlashcardFront, getFlashcardBack } from '../../types'

interface Props { tema: Tema; onVueltaCompleta: () => void }

export function FlashcardsTab({ tema, onVueltaCompleta }: Props) {
  const [indice, setIndice] = useState(0)
  const [verRespuesta, setVerRespuesta] = useState(false)
  const [terminado, setTerminado] = useState(false)
  const cards = tema.flashcards

  function responder(cal: 'facil' | 'dudoso' | 'dificil') {
    responderFlashcard(cards[indice].id, cal)
    inicializarFlashcards(cards.map(c => c.id))
    if (indice + 1 >= cards.length) { setTerminado(true); onVueltaCompleta() }
    else { setIndice(i => i + 1); setVerRespuesta(false) }
  }

  if (terminado) return (
    <div className="text-center py-12" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
      <div style={{ fontSize: 48 }}>🎉</div>
      <p className="display" style={{ margin: 0, fontSize: 24 }}>¡Flashcards completadas!</p>
      <p style={{ color: 'var(--mute)', fontSize: 13.5 }}>Vuelta sumada al tema.</p>
      <button onClick={() => { setIndice(0); setTerminado(false); setVerRespuesta(false) }} className="btn-editorial btn-acc">Repetir</button>
    </div>
  )

  const card = cards[indice]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <p className="num-display" style={{ margin: 0, fontSize: 12, color: 'var(--mute)', textAlign: 'right' }}>{indice + 1}/{cards.length}</p>
      <div onClick={() => setVerRespuesta(true)} className="card"
        style={{ minHeight: 200, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', textAlign: 'center' }}>
        <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--ink)', lineHeight: 1.4 }}>{getFlashcardFront(card)}</p>
        {!verRespuesta
          ? <p style={{ fontSize: 12, color: 'var(--mute)', marginTop: 16 }}>Toca para ver la respuesta</p>
          : <p style={{ fontSize: 14, color: 'var(--accent)', fontWeight: 600, marginTop: 16, borderTop: '1px solid var(--border-soft)', paddingTop: 16, width: '100%' }}>{getFlashcardBack(card)}</p>
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
    </div>
  )
}
