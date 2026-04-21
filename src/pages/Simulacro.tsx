import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { calcularPuntuacionTest } from '../services/progress'
import { cargarTema, TEMAS_META } from '../data/topics'
import type { Pregunta } from '../types'

type PreguntaExt = Pregunta & { temaId: number }

function barajar<T>(a: T[]): T[] { return [...a].sort(() => Math.random() - 0.5) }

const DURACION = 120 * 60

export function Simulacro() {
  const navigate = useNavigate()
  const [preguntas, setPreguntas] = useState<PreguntaExt[]>([])
  const [respuestas, setRespuestas] = useState<(number | null)[]>([])
  const [indice, setIndice] = useState(0)
  const [tiempo, setTiempo] = useState(DURACION)
  const [iniciado, setIniciado] = useState(false)
  const [terminado, setTerminado] = useState(false)
  const [cargando, setCargando] = useState(true)
  const intervalo = useRef<ReturnType<typeof setInterval>>()

  useEffect(() => {
    async function cargar() {
      const todas: PreguntaExt[] = []
      for (const m of TEMAS_META) {
        try { (await cargarTema(m.id)).preguntas.forEach(p => todas.push({ ...p, temaId: m.id })) }
        catch { /* skip */ }
      }
      const sel = barajar(todas).slice(0, 60)
      setPreguntas(sel)
      setRespuestas(new Array(sel.length).fill(null))
      setCargando(false)
    }
    cargar()
    return () => clearInterval(intervalo.current)
  }, [])

  function iniciar() {
    setIniciado(true)
    intervalo.current = setInterval(() => {
      setTiempo(t => {
        if (t <= 1) { clearInterval(intervalo.current); setTerminado(true); return 0 }
        return t - 1
      })
    }, 1000)
  }

  function terminar() { clearInterval(intervalo.current); setTerminado(true) }

  if (cargando) return <div className="flex justify-center py-16 text-gray-400">Preparando simulacro...</div>

  if (!iniciado) return (
    <div className="p-4 max-w-2xl mx-auto text-center py-16 space-y-4">
      <div className="text-5xl">🎯</div>
      <h1 className="text-2xl font-bold">Simulacro oficial</h1>
      <p className="text-gray-500 text-sm">{preguntas.length} preguntas · 120 min · -0,33 por error</p>
      <button onClick={iniciar} className="bg-brand-600 text-white px-8 py-3 rounded-xl font-semibold">Comenzar</button>
      <button onClick={() => navigate('/tests')} className="block text-gray-400 text-sm mx-auto underline">Cancelar</button>
    </div>
  )

  if (terminado) {
    const aciertos = respuestas.filter((r, i) => r === preguntas[i]?.correcta).length
    const errores  = respuestas.filter((r, i) => r !== null && r !== preguntas[i]?.correcta).length
    const punt = calcularPuntuacionTest(aciertos, errores, preguntas.length)
    return (
      <div className="p-4 max-w-2xl mx-auto space-y-4">
        <h2 className="text-xl font-bold pt-4">Resultado del simulacro</h2>
        <div className="bg-white rounded-2xl p-6 text-center shadow-sm">
          <p className="text-5xl font-bold text-brand-600">{punt.toFixed(2)}</p>
          <p className="text-gray-500 text-sm mt-1">sobre 10</p>
          <div className="flex justify-center gap-6 mt-4 text-sm">
            <span>✅ {aciertos}</span><span>❌ {errores}</span>
            <span>⬜ {preguntas.length - aciertos - errores} en blanco</span>
          </div>
        </div>
        <button onClick={() => navigate('/estadisticas')} className="w-full bg-brand-600 text-white rounded-xl py-3 text-sm font-semibold">Ver estadísticas</button>
        <button onClick={() => navigate('/tests')} className="w-full border border-gray-200 rounded-xl py-3 text-sm">Volver</button>
      </div>
    )
  }

  const mins = String(Math.floor(tiempo / 60)).padStart(2, '0')
  const segs = String(tiempo % 60).padStart(2, '0')
  const p = preguntas[indice]

  return (
    <div className="flex flex-col h-full">
      <header className="bg-white border-b px-4 py-3 sticky top-0 z-10 flex justify-between items-center">
        <span className="text-sm font-medium">{indice + 1}/{preguntas.length}</span>
        <span className={`font-mono font-bold ${tiempo < 600 ? 'text-red-600' : 'text-brand-600'}`}>⏱ {mins}:{segs}</span>
        <button onClick={terminar} className="text-xs text-gray-400 underline">Terminar</button>
      </header>
      <div className="flex-1 overflow-y-auto p-4 space-y-3 max-w-2xl mx-auto w-full">
        <p className="text-sm font-medium">{p.enunciado}</p>
        {p.opciones.map((op, j) => (
          <label key={j} className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-colors ${respuestas[indice] === j ? 'border-brand-500 bg-brand-50' : 'border-gray-100 hover:bg-gray-50'}`}>
            <input type="radio" checked={respuestas[indice] === j}
              onChange={() => setRespuestas(r => { const n = [...r]; n[indice] = j; return n })} />
            <span className="text-sm">{op}</span>
          </label>
        ))}
        <div className="flex gap-2 pt-2">
          {indice > 0 && <button onClick={() => setIndice(i => i - 1)} className="flex-1 border border-gray-200 rounded-xl py-2 text-sm">← Anterior</button>}
          {indice < preguntas.length - 1
            ? <button onClick={() => setIndice(i => i + 1)} className="flex-1 bg-brand-600 text-white rounded-xl py-2 text-sm font-semibold">Siguiente →</button>
            : <button onClick={terminar} className="flex-1 bg-green-600 text-white rounded-xl py-2 text-sm font-semibold">✅ Terminar</button>
          }
        </div>
      </div>
    </div>
  )
}
