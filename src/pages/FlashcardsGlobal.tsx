import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useProgress } from '../hooks/useProgress'
import { flashcardsPendientesHoy, responderFlashcard } from '../services/spaced-repetition'
import { obtenerTopics } from '../data/topics'
import type { Flashcard } from '../types'

export function FlashcardsGlobal() {
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
      for (const meta of TEMAS_META) {
        try {
          const tema = await cargarTema(meta.id)
          tema.flashcards.filter(c => ids.includes(c.id)).forEach(card => resultado.push({ card }))
        } catch { /* tema no cargado */ }
      }
      setPendientes(resultado)
      setCargando(false)
    }
    cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (cargando) return <div className="flex justify-center py-16 text-gray-400">Cargando...</div>

  if (!pendientes.length) return (
    <div className="p-4 max-w-2xl mx-auto text-center py-16">
      <div className="text-5xl mb-3">✅</div>
      <p className="font-bold text-lg">¡Todo al día!</p>
      <p className="text-gray-500 text-sm mt-1">Sin flashcards pendientes hoy.</p>
    </div>
  )

  if (indice >= pendientes.length) return (
    <div className="p-4 max-w-2xl mx-auto text-center py-16">
      <div className="text-5xl mb-3">🎉</div>
      <p className="font-bold text-lg">¡Sesión completada!</p>
      <p className="text-gray-500 text-sm">{pendientes.length} flashcards repasadas hoy.</p>
    </div>
  )

  const { card } = pendientes[indice]

  function responder(cal: 'facil' | 'dudoso' | 'dificil') {
    responderFlashcard(card.id, cal)
    setIndice(i => i + 1)
    setVerRespuesta(false)
  }

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold pt-4">🃏 Flashcards</h1>
      <p className="text-xs text-gray-400">{indice + 1}/{pendientes.length} pendientes hoy</p>
      <div onClick={() => setVerRespuesta(true)}
        className="min-h-48 bg-white border border-gray-100 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer hover:shadow-md transition-shadow text-center">
        <p className="text-sm font-medium text-gray-800">{card.pregunta}</p>
        {!verRespuesta
          ? <p className="text-xs text-gray-400 mt-4">Toca para ver la respuesta</p>
          : <p className="text-sm text-brand-700 font-semibold mt-4 border-t pt-4 w-full">{card.respuesta}</p>
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
