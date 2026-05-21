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
    <div className="text-center py-12 space-y-3">
      <div className="text-5xl">🎉</div>
      <p className="font-bold text-lg">¡Flashcards completadas!</p>
      <p className="text-gray-500 text-sm">Vuelta sumada al tema.</p>
      <button onClick={() => { setIndice(0); setTerminado(false); setVerRespuesta(false) }}
        className="bg-brand-600 text-white px-6 py-2 rounded-xl text-sm font-semibold">Repetir</button>
    </div>
  )

  const card = cards[indice]
  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-400 text-right">{indice + 1}/{cards.length}</p>
      <div onClick={() => setVerRespuesta(true)}
        className="min-h-48 bg-white border border-gray-100 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer hover:shadow-md transition-shadow text-center">
        <p className="text-sm font-medium text-gray-800">{getFlashcardFront(card)}</p>
        {!verRespuesta
          ? <p className="text-xs text-gray-400 mt-4">Toca para ver la respuesta</p>
          : <p className="text-sm text-brand-700 font-semibold mt-4 border-t border-gray-100 pt-4 w-full">{getFlashcardBack(card)}</p>
        }
      </div>
      {verRespuesta && (
        <div className="grid grid-cols-3 gap-2">
          {(['dificil', 'dudoso', 'facil'] as const).map(cal => (
            <button key={cal} onClick={() => responder(cal)}
              className={`py-2 rounded-xl text-sm font-semibold ${
                cal === 'dificil' ? 'bg-red-100 text-red-700' :
                cal === 'dudoso'  ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'
              }`}>
              {cal === 'dificil' ? '😓 Difícil' : cal === 'dudoso' ? '🤔 Dudoso' : '😊 Fácil'}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
