import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { cargarCuestionario, puntuar, interpretacion, type ResultadoRasgo } from '../data/personalidad/index'

const ESCALA = [1, 2, 3, 4, 5]

export default function Personalidad() {
  const navigate = useNavigate()
  const { slug } = useParams<{ slug: string }>()
  const items = cargarCuestionario()
  const [respuestas, setRespuestas] = useState<Record<string, number>>({})
  const [resultado, setResultado] = useState<ResultadoRasgo[] | null>(null)

  const completos = Object.keys(respuestas).length
  const total = items.length

  function elegir(id: string, valor: number) {
    setRespuestas(prev => ({ ...prev, [id]: valor }))
  }

  if (resultado) {
    return (
      <div className="min-h-screen bg-slate-50">
        <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
          <button onClick={() => navigate(`/oposicion/${slug}`)} className="text-marca-600 text-sm font-medium">←</button>
          <h1 className="text-lg font-bold text-slate-900">Tu perfil</h1>
        </header>
        <main className="p-4 max-w-2xl mx-auto space-y-3">
          <p className="text-xs text-slate-500 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">⚠️ Resultado orientativo, no es un diagnóstico psicológico.</p>
          {resultado.map(r => (
            <div key={r.rasgo} className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-900">{r.titulo}</span>
                <span className="text-xs text-slate-500">{r.puntuacion}/100</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full mt-2 overflow-hidden">
                <div className="h-full bg-marca-600" style={{ width: `${r.puntuacion}%` }} />
              </div>
              <p className="text-xs text-slate-600 mt-2">{interpretacion(r.rasgo, r.banda)}</p>
            </div>
          ))}
          <button onClick={() => { setRespuestas({}); setResultado(null) }}
            className="w-full bg-marca-600 hover:bg-marca-700 text-white rounded-2xl py-3 text-sm font-semibold">Repetir test</button>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => navigate(`/oposicion/${slug}`)} className="text-marca-600 text-sm font-medium">←</button>
        <h1 className="text-lg font-bold text-slate-900">Test de personalidad</h1>
        <span className="ml-auto text-xs text-slate-400">{completos}/{total}</span>
      </header>
      <main className="p-4 max-w-2xl mx-auto space-y-3">
        {items.map(it => (
          <div key={it.id} className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4">
            <p className="text-sm text-slate-800 mb-3">{it.texto}</p>
            <div className="flex justify-between gap-1">
              {ESCALA.map(v => (
                <label key={v} className="flex flex-col items-center text-[10px] text-slate-400 cursor-pointer">
                  <input type="radio" aria-label={`${it.id}-${v}`} name={it.id}
                    checked={respuestas[it.id] === v} onChange={() => elegir(it.id, v)} />
                  <span>{v}</span>
                </label>
              ))}
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 mt-1"><span>En desacuerdo</span><span>De acuerdo</span></div>
          </div>
        ))}
        <button onClick={() => setResultado(puntuar(respuestas))} disabled={completos < total}
          className="w-full bg-marca-600 hover:bg-marca-700 disabled:opacity-40 text-white rounded-2xl py-3 text-sm font-semibold">
          Ver resultado
        </button>
      </main>
    </div>
  )
}
