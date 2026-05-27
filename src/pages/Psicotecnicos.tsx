import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { CATEGORIAS, cargarCategoria } from '../data/psicotecnicos/index'
import { MotorTest, type PreguntaTest } from '../components/test/MotorTest'
import { generarPsicotecnicos } from '../services/practica'

export default function Psicotecnicos() {
  const navigate = useNavigate()
  const { slug } = useParams<{ slug: string }>()
  const [catId, setCatId] = useState<string | null>(null)
  const [titulo, setTitulo] = useState('')
  const [preguntas, setPreguntas] = useState<PreguntaTest[]>([])
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function abrir(id: string, label: string) {
    setCatId(id); setTitulo(label); setError(null)
    setPreguntas(await cargarCategoria(id))
  }

  async function generarMas() {
    if (!catId) return
    setCargando(true); setError(null)
    const { preguntas: nuevas, error: err } = await generarPsicotecnicos(catId)
    setCargando(false)
    if (err || !nuevas.length) { setError('No se pudo generar, inténtalo de nuevo.'); return }
    setPreguntas(prev => [...prev, ...nuevas])
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => catId ? setCatId(null) : navigate(`/oposicion/${slug}`)} className="text-marca-600 text-sm font-medium">←</button>
        <h1 className="text-lg font-bold text-slate-900">Psicotécnicos</h1>
      </header>
      <main className="p-4 max-w-2xl mx-auto space-y-3">
        {!catId && CATEGORIAS.map(c => (
          <button key={c.id} onClick={() => abrir(c.id, c.titulo)}
            className="w-full flex items-center gap-3 bg-white border border-slate-200 rounded-2xl shadow-sm px-4 py-4 text-left hover:shadow-md transition-shadow">
            <span className="flex-1 text-sm font-bold text-slate-900">{c.titulo}</span>
            <span className="text-slate-300 text-lg">›</span>
          </button>
        ))}
        {catId && (
          <>
            <MotorTest preguntas={preguntas} titulo={titulo} />
            <button onClick={generarMas} disabled={cargando}
              className="w-full border border-marca-200 text-marca-700 rounded-xl py-2 text-sm font-semibold disabled:opacity-40">
              {cargando ? 'Generando…' : '+ Generar más preguntas'}
            </button>
            {error && <p className="text-xs text-red-600">{error}</p>}
          </>
        )}
      </main>
    </div>
  )
}
