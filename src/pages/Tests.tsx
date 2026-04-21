import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProgress } from '../hooks/useProgress'
import { calcularPuntuacionTest } from '../services/progress'
import { cargarTema, TEMAS_META } from '../data/topics'
import type { Tema } from '../types'

export function Tests() {
  const navigate = useNavigate()
  const { guardarTest } = useProgress()
  const [temaId, setTemaId] = useState<number | null>(null)
  const [tema, setTema] = useState<Tema | null>(null)
  const [respuestas, setRespuestas] = useState<(number | null)[]>([])
  const [enviado, setEnviado] = useState(false)

  useEffect(() => {
    if (temaId === null) return
    cargarTema(temaId).then(t => {
      setTema(t)
      setRespuestas(new Array(t.preguntas.length).fill(null))
      setEnviado(false)
    })
  }, [temaId])

  if (temaId === null) return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold pt-4 mb-4">📝 Tests</h1>
      <div className="space-y-2">
        {TEMAS_META.map(m => (
          <button key={m.id} onClick={() => setTemaId(m.id)}
            className="w-full text-left bg-white border border-gray-100 rounded-xl px-4 py-3 text-sm hover:shadow-md transition-shadow">
            <span className="font-medium">Tema {m.id}</span> — {m.titulo}
          </button>
        ))}
        <button onClick={() => navigate('/tests/simulacro')}
          className="w-full bg-brand-600 text-white rounded-xl px-4 py-3 text-sm font-semibold mt-4">
          🎯 Simulacro completo
        </button>
      </div>
    </div>
  )

  if (!tema) return <div className="flex justify-center py-16 text-gray-400">Cargando...</div>

  const aciertos = respuestas.filter((r, i) => r === tema.preguntas[i].correcta).length
  const errores  = respuestas.filter((r, i) => r !== null && r !== tema.preguntas[i].correcta).length

  function enviar() {
    guardarTest(tema!.id, aciertos, errores, tema!.preguntas.length)
    setEnviado(true)
  }

  if (enviado) return (
    <div className="p-4 max-w-2xl mx-auto space-y-4">
      <h2 className="text-xl font-bold pt-4">Resultado</h2>
      <div className="bg-white rounded-2xl p-6 text-center shadow-sm">
        <p className="text-4xl font-bold text-brand-600">
          {calcularPuntuacionTest(aciertos, errores, tema.preguntas.length).toFixed(2)}
        </p>
        <p className="text-gray-500 text-sm mt-1">sobre 10</p>
        <p className="text-sm mt-3">✅ {aciertos} aciertos · ❌ {errores} errores</p>
      </div>
      {tema.preguntas.map((p, i) => (
        <div key={i} className={`bg-white rounded-xl p-4 border-l-4 ${respuestas[i] === p.correcta ? 'border-green-400' : 'border-red-400'}`}>
          <p className="text-sm font-medium">{p.enunciado}</p>
          <p className="text-xs text-gray-500 mt-1">Correcta: {p.opciones[p.correcta]}</p>
          <p className="text-xs text-gray-400 mt-1 italic">{p.explicacion}</p>
        </div>
      ))}
      <button onClick={() => setTemaId(null)}
        className="w-full bg-brand-600 text-white rounded-xl py-3 text-sm font-semibold">Volver</button>
    </div>
  )

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-4">
      <div className="flex items-center gap-2 pt-4">
        <button onClick={() => setTemaId(null)} className="text-brand-600 text-sm">←</button>
        <h1 className="text-lg font-bold">{tema.titulo}</h1>
      </div>
      {tema.preguntas.map((p, i) => (
        <div key={i} className="bg-white rounded-2xl p-4 shadow-sm space-y-2">
          <p className="text-sm font-medium">{i + 1}. {p.enunciado}</p>
          {p.opciones.map((op, j) => (
            <label key={j} className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${respuestas[i] === j ? 'bg-brand-100' : 'hover:bg-gray-50'}`}>
              <input type="radio" name={`q-${i}`} checked={respuestas[i] === j}
                onChange={() => setRespuestas(r => { const n = [...r]; n[i] = j; return n })}
                className="text-brand-600" />
              <span className="text-sm">{op}</span>
            </label>
          ))}
        </div>
      ))}
      <button onClick={enviar} disabled={respuestas.some(r => r === null)}
        className="w-full bg-brand-600 disabled:bg-gray-300 text-white rounded-xl py-3 text-sm font-semibold">
        Enviar respuestas
      </button>
    </div>
  )
}
