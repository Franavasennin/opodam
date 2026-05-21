import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useProgress } from '../hooks/useProgress'
import { Card } from '../components/ui/Card'
import { obtenerTopics } from '../data/topics'
import { responderFlashcard } from '../services/spaced-repetition'
import { obtenerSesionHoy, completarSesionDiaria, calcularDebilidades } from '../services/adaptativo'
import { actualizarRendimientoTema } from '../services/examen'
import type { Flashcard, PreguntaExt } from '../types'
import { getPreguntaCorrecta, getFlashcardFront, getFlashcardBack } from '../types'

type Fase = 'cargando' | 'flashcards' | 'minitest' | 'completada'

export function SesionDiaria() {
  const navigate = useNavigate()
  const { slug } = useParams<{ slug: string }>()
  const { cargarTema, TEMAS_META } = obtenerTopics(slug ?? 'cgpc')
  const { progreso, refrescar } = useProgress()
  const [fase, setFase] = useState<Fase>('cargando')
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [preguntas, setPreguntas] = useState<PreguntaExt[]>([])
  const [fcIndice, setFcIndice] = useState(0)
  const [fcVerRespuesta, setFcVerRespuesta] = useState(false)
  const [pIndice, setPIndice] = useState(0)
  const [respuestas, setRespuestas] = useState<(number | null)[]>([])
  const [mostrandoExplicacion, setMostrandoExplicacion] = useState(false)

  useEffect(() => {
    async function cargar() {
      const sesion = obtenerSesionHoy()
      if (sesion.completada) { setFase('completada'); return }

      // Cargar flashcards pendientes
      const fcs: Flashcard[] = []
      for (const meta of TEMAS_META) {
        try {
          const tema = await cargarTema(meta.id)
          tema.flashcards
            .filter(c => sesion.flashcardIds.includes(c.id))
            .forEach(c => fcs.push(c))
        } catch { /* skip */ }
      }

      // Cargar preguntas de temas débiles (hasta 10)
      const temasDebiles = calcularDebilidades(progreso.rendimientoPorTema, 3)
      const prgs: PreguntaExt[] = []
      for (const temaId of temasDebiles) {
        try {
          const tema = await cargarTema(temaId)
          const shuffled = [...tema.preguntas].sort(() => Math.random() - 0.5).slice(0, 4)
          shuffled.forEach(p => prgs.push({ ...p, temaId }))
        } catch { /* skip */ }
      }
      const pregSel = prgs.slice(0, 10)

      setFlashcards(fcs)
      setPreguntas(pregSel)
      setRespuestas(new Array(pregSel.length).fill(null))
      setFase(fcs.length > 0 ? 'flashcards' : pregSel.length > 0 ? 'minitest' : 'completada')
      if (fcs.length === 0 && pregSel.length === 0) { completarSesionDiaria(); refrescar() }
    }
    cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function responderFC(cal: 'facil' | 'dudoso' | 'dificil') {
    if (flashcards[fcIndice]) responderFlashcard(flashcards[fcIndice].id, cal)
    if (fcIndice + 1 >= flashcards.length) {
      if (preguntas.length > 0) setFase('minitest')
      else { completarSesionDiaria(); refrescar(); setFase('completada') }
    } else {
      setFcIndice(i => i + 1)
      setFcVerRespuesta(false)
    }
  }

  function responderPregunta(opcion: number) {
    setRespuestas(r => { const n = [...r]; n[pIndice] = opcion; return n })
    setMostrandoExplicacion(true)
  }

  function siguientePregunta() {
    setMostrandoExplicacion(false)
    if (pIndice + 1 >= preguntas.length) {
      // Calcular y guardar rendimiento por tema
      const porTema: Record<number, { aciertos: number; errores: number; total: number }> = {}
      preguntas.forEach((p, i) => {
        if (!porTema[p.temaId]) porTema[p.temaId] = { aciertos: 0, errores: 0, total: 0 }
        porTema[p.temaId].total++
        if (respuestas[i] === getPreguntaCorrecta(p)) porTema[p.temaId].aciertos++
        else if (respuestas[i] !== null) porTema[p.temaId].errores++
      })
      Object.entries(porTema).forEach(([id, r]) =>
        actualizarRendimientoTema(Number(id), r.aciertos, r.errores, r.total)
      )
      completarSesionDiaria()
      refrescar()
      setFase('completada')
    } else {
      setPIndice(i => i + 1)
    }
  }

  if (fase === 'cargando') {
    return <div className="flex justify-center py-16 text-gray-400">Preparando sesión...</div>
  }

  if (fase === 'completada') {
    const aciertos = preguntas.filter((p, i) => respuestas[i] === getPreguntaCorrecta(p)).length
    return (
      <div className="p-4 max-w-2xl mx-auto text-center py-12 space-y-4">
        <div className="text-6xl">🎉</div>
        <h1 className="text-2xl font-bold">¡Sesión completada!</h1>
        {preguntas.length > 0 && (
          <p className="text-gray-600">
            Mini-test: <span className="font-bold text-brand-600">{aciertos}/{preguntas.length}</span> correctas
          </p>
        )}
        <p className="text-gray-500 text-sm">
          Racha: <span className="font-semibold text-brand-600">{progreso.racha.dias} días 🔥</span>
        </p>
        <p className="text-xs text-gray-400">Vuelve mañana para la siguiente sesión</p>
        <button onClick={() => navigate('/')}
          className="w-full bg-brand-600 text-white rounded-xl py-3 text-sm font-semibold">
          Volver al inicio
        </button>
      </div>
    )
  }

  if (fase === 'flashcards') {
    const card = flashcards[fcIndice]
    return (
      <div className="p-4 max-w-2xl mx-auto space-y-4">
        <h1 className="text-lg font-bold pt-4">⚡ Sesión de hoy</h1>
        <p className="text-xs text-gray-400">Flashcards {fcIndice + 1}/{flashcards.length}</p>
        <div onClick={() => setFcVerRespuesta(true)}
          className="min-h-48 bg-white border border-gray-100 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer hover:shadow-md transition-shadow text-center">
          <p className="text-sm font-medium text-gray-800">{getFlashcardFront(card)}</p>
          {!fcVerRespuesta
            ? <p className="text-xs text-gray-400 mt-4">Toca para ver la respuesta</p>
            : <p className="text-sm text-brand-700 font-semibold mt-4 border-t pt-4 w-full">{getFlashcardBack(card)}</p>
          }
        </div>
        {fcVerRespuesta && (
          <div className="grid grid-cols-3 gap-2">
            {(['dificil', 'dudoso', 'facil'] as const).map(cal => (
              <button key={cal} onClick={() => responderFC(cal)}
                className={`py-2 rounded-xl text-sm font-semibold ${
                  cal === 'dificil' ? 'bg-red-100 text-red-700' :
                  cal === 'dudoso'  ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'
                }`}>
                {cal === 'dificil' ? '😓 Difícil' : cal === 'dudoso' ? '🤔 Dudoso' : '😊 Fácil'}
              </button>
            ))}
          </div>
        )}
        {preguntas.length > 0 && (
          <button onClick={() => setFase('minitest')} className="w-full text-xs text-gray-400 underline">
            Saltar a mini-test →
          </button>
        )}
      </div>
    )
  }

  // fase === 'minitest'
  const p = preguntas[pIndice]
  const respActual = respuestas[pIndice]
  return (
    <div className="p-4 max-w-2xl mx-auto space-y-4">
      <h1 className="text-lg font-bold pt-4">⚡ Sesión de hoy — Mini-test</h1>
      <p className="text-xs text-gray-400">{pIndice + 1}/{preguntas.length} preguntas</p>
      <p className="text-sm font-medium leading-relaxed">{p.enunciado}</p>
      {p.opciones.map((op, j) => {
        let cls = 'border-gray-100 hover:bg-gray-50'
        if (mostrandoExplicacion) {
          if (j === getPreguntaCorrecta(p)) cls = 'border-green-400 bg-green-50'
          else if (j === respActual) cls = 'border-red-400 bg-red-50'
        } else if (respActual === j) {
          cls = 'border-brand-500 bg-brand-50'
        }
        return (
          <label key={j}
            className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-colors ${cls}`}>
            <input type="radio" checked={respActual === j} disabled={mostrandoExplicacion}
              onChange={() => responderPregunta(j)} />
            <span className="text-sm">{op}</span>
          </label>
        )
      })}
      {mostrandoExplicacion && (
        <>
          <Card className="bg-blue-50 border-blue-200">
            <p className="text-xs text-blue-800">{p.explicacion}</p>
          </Card>
          <button onClick={siguientePregunta}
            className="w-full bg-brand-600 text-white rounded-xl py-3 text-sm font-semibold">
            {pIndice + 1 < preguntas.length ? 'Siguiente →' : '✅ Finalizar sesión'}
          </button>
        </>
      )}
    </div>
  )
}
