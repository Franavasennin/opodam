import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useProgress } from '../hooks/useProgress'
import { calcularPuntuacionTest } from '../services/progress'
import { obtenerTopics } from '../data/topics'
import type { Tema } from '../types'
import { getPreguntaCorrecta } from '../types'

export function Tests() {
  const navigate = useNavigate()
  const { slug } = useParams<{ slug: string }>()
  const { guardarTest } = useProgress()
  const { cargarTema, TEMAS_META } = obtenerTopics(slug ?? 'cgpc')
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [temaId])

  if (temaId === null) return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-4 py-3">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-lg font-bold text-slate-900">Tests</h1>
        </div>
      </header>
      <div className="p-4 max-w-2xl mx-auto">
        <p className="text-slate-500 text-sm mb-4">Elige un tema para practicar preguntas</p>
        <div className="space-y-2">
          {TEMAS_META.map(m => (
            <button key={m.id} onClick={() => setTemaId(m.id)}
              className="w-full flex items-center gap-3 text-left bg-white border border-slate-200 rounded-2xl shadow-sm px-4 py-3 hover:shadow-md transition-shadow">
              <span className="w-9 h-9 rounded-xl bg-marca-50 text-marca-700 text-sm font-bold flex items-center justify-center shrink-0">
                {m.id}
              </span>
              <span className="text-sm font-semibold text-slate-900 truncate">{m.titulo}</span>
            </button>
          ))}
          <button onClick={() => navigate('/tests/simulacro')}
            className="w-full bg-marca-600 hover:bg-marca-700 transition-colors text-white rounded-2xl px-4 py-3 text-sm font-semibold mt-4">
            🎯 Simulacro completo
          </button>
        </div>
      </div>
    </div>
  )

  if (!tema) return <div className="min-h-screen bg-slate-50 flex justify-center py-16 text-slate-400">Cargando...</div>

  const aciertos = respuestas.filter((r, i) => r === getPreguntaCorrecta(tema.preguntas[i])).length
  const errores  = respuestas.filter((r, i) => r !== null && r !== getPreguntaCorrecta(tema.preguntas[i])).length

  function enviar() {
    guardarTest(tema!.id, aciertos, errores, tema!.preguntas.length)
    setEnviado(true)
  }

  if (enviado) return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-4 py-3">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-lg font-bold text-slate-900">Resultado</h1>
        </div>
      </header>
      <div className="p-4 max-w-2xl mx-auto space-y-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center shadow-sm">
          <p className="text-5xl font-bold text-marca-600">
            {calcularPuntuacionTest(aciertos, errores, tema.preguntas.length).toFixed(2)}
          </p>
          <p className="text-slate-500 text-sm mt-1">sobre 10</p>
          <p className="text-sm text-slate-700 mt-3">✅ {aciertos} aciertos · ❌ {errores} errores</p>
        </div>
        {tema.preguntas.map((p, i) => (
          <div key={i} className={`bg-white border border-slate-200 rounded-2xl shadow-sm p-4 border-l-4 ${respuestas[i] === getPreguntaCorrecta(p) ? 'border-l-emerald-500' : 'border-l-red-500'}`}>
            <p className="text-sm font-semibold text-slate-900">{p.enunciado}</p>
            <p className="text-xs text-slate-500 mt-1">Correcta: {p.opciones[getPreguntaCorrecta(p)]}</p>
            <p className="text-xs text-slate-400 mt-1 italic">{p.explicacion}</p>
          </div>
        ))}
        <button onClick={() => setTemaId(null)}
          className="w-full bg-marca-600 hover:bg-marca-700 transition-colors text-white rounded-2xl py-3 text-sm font-semibold">Volver</button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button onClick={() => setTemaId(null)} className="text-marca-600 hover:text-marca-700 text-sm font-medium transition-colors">←</button>
          <h1 className="text-lg font-bold text-slate-900 truncate">{tema.titulo}</h1>
        </div>
      </header>
      <div className="p-4 max-w-2xl mx-auto space-y-4">
        {tema.preguntas.map((p, i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 space-y-2">
            <p className="text-sm font-semibold text-slate-900">{i + 1}. {p.enunciado}</p>
            {p.opciones.map((op, j) => (
              <label key={j} className={`flex items-center gap-2 p-2.5 rounded-xl cursor-pointer transition-colors border ${respuestas[i] === j ? 'bg-marca-50 border-marca-600' : 'border-transparent hover:bg-slate-50'}`}>
                <input type="radio" name={`q-${i}`} checked={respuestas[i] === j}
                  onChange={() => setRespuestas(r => { const n = [...r]; n[i] = j; return n })}
                  className="text-marca-600" />
                <span className="text-sm text-slate-700">{op}</span>
              </label>
            ))}
          </div>
        ))}
        <button onClick={enviar} disabled={respuestas.some(r => r === null)}
          className="w-full bg-marca-600 hover:bg-marca-700 disabled:bg-slate-300 disabled:hover:bg-slate-300 transition-colors text-white rounded-2xl py-3 text-sm font-semibold">
          Enviar respuestas
        </button>
      </div>
    </div>
  )
}
