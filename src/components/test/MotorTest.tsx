import { useState } from 'react'
import { calcularPuntuacionTest } from '../../services/progress'

export interface PreguntaTest {
  id: string
  enunciado: string
  opciones: string[]
  respuestaCorrecta: number
  explicacion: string
}

interface Props {
  preguntas: PreguntaTest[]
  titulo: string
  onTerminar?: (resultado: { aciertos: number; errores: number; total: number }) => void
}

export function MotorTest({ preguntas, titulo, onTerminar }: Props) {
  const [indice, setIndice] = useState(0)
  const [respuestas, setRespuestas] = useState<(number | null)[]>(() => preguntas.map(() => null))
  const [terminado, setTerminado] = useState(false)

  if (!preguntas.length) {
    return <p className="text-slate-400 text-sm text-center py-8">Aún no hay preguntas aquí.</p>
  }

  const aciertos = respuestas.filter((r, i) => r === preguntas[i].respuestaCorrecta).length
  const errores = respuestas.filter((r, i) => r !== null && r !== preguntas[i].respuestaCorrecta).length

  function elegir(j: number) {
    setRespuestas(prev => prev.map((r, i) => (i === indice ? j : r)))
  }

  function finalizar() {
    setTerminado(true)
    onTerminar?.({ aciertos, errores, total: preguntas.length })
  }

  if (terminado) {
    const nota = calcularPuntuacionTest(aciertos, errores, preguntas.length)
    return (
      <div className="space-y-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center shadow-sm">
          <p className="text-5xl font-bold text-marca-600">{nota.toFixed(2)}</p>
          <p className="text-slate-500 text-sm mt-1">sobre 10</p>
          <p className="text-sm text-slate-700 mt-3">✅ {aciertos} aciertos · ❌ {errores} errores</p>
        </div>
        {preguntas.map((p, i) => (
          <div key={p.id} className={`bg-white border border-slate-200 rounded-2xl shadow-sm p-4 border-l-4 ${respuestas[i] === p.respuestaCorrecta ? 'border-l-emerald-500' : 'border-l-red-500'}`}>
            <p className="text-sm font-semibold text-slate-900">{p.enunciado}</p>
            <p className="text-xs text-slate-500 mt-1">Correcta: {p.opciones[p.respuestaCorrecta]}</p>
            <p className="text-xs text-slate-400 mt-1 italic">{p.explicacion}</p>
          </div>
        ))}
      </div>
    )
  }

  const p = preguntas[indice]
  const sel = respuestas[indice]
  const esUltima = indice + 1 >= preguntas.length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-slate-900">{titulo}</h2>
        <span className="text-xs text-slate-400">{indice + 1}/{preguntas.length}</span>
      </div>
      <p className="text-sm font-medium leading-relaxed">{p.enunciado}</p>
      {p.opciones.map((op, j) => (
        <label key={j} className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-colors ${sel === j ? 'border-marca-500 bg-marca-50' : 'border-slate-200 hover:bg-slate-50'}`}>
          <input type="radio" checked={sel === j} onChange={() => elegir(j)} />
          <span className="text-sm">{op}</span>
        </label>
      ))}
      <div className="flex justify-between pt-2">
        <button onClick={() => setIndice(i => Math.max(0, i - 1))} disabled={indice === 0}
          className="text-sm text-slate-500 disabled:opacity-30">← Anterior</button>
        {esUltima
          ? <button onClick={finalizar} className="bg-marca-600 hover:bg-marca-700 text-white text-sm font-semibold rounded-xl px-4 py-2">Finalizar</button>
          : <button onClick={() => setIndice(i => Math.min(preguntas.length - 1, i + 1))}
              className="bg-marca-600 hover:bg-marca-700 text-white text-sm font-semibold rounded-xl px-4 py-2">Siguiente →</button>}
      </div>
    </div>
  )
}
