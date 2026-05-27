import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import * as cgpc from '../data/supuestos/cgpc/index'
import * as pl from '../data/supuestos/policia-local/index'
import { MotorTest, type PreguntaTest } from '../components/test/MotorTest'

const MODULOS: Record<string, { cargarSupuesto: (id: string) => Promise<any> }> = {
  'cgpc': cgpc,
  'policia-local': pl,
}

export default function SupuestoDetalle() {
  const navigate = useNavigate()
  const { slug, id } = useParams<{ slug: string; id: string }>()
  const [supuesto, setSupuesto] = useState<{ titulo: string; caso: string; preguntas: PreguntaTest[] } | null>(null)
  const [cargado, setCargado] = useState(false)

  useEffect(() => {
    const modulo = MODULOS[slug ?? 'cgpc']
    if (!modulo || !id) { setCargado(true); return }
    modulo.cargarSupuesto(id).then(s => { setSupuesto(s); setCargado(true) })
  }, [slug, id])

  useEffect(() => {
    if (cargado && !supuesto) navigate(`/oposicion/${slug}/supuestos`)
  }, [cargado, supuesto, navigate, slug])

  if (!supuesto) return <div className="min-h-screen flex items-center justify-center text-slate-400">Cargando…</div>

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => navigate(`/oposicion/${slug}/supuestos`)} className="text-marca-600 text-sm font-medium">←</button>
        <h1 className="text-base font-bold text-slate-900 truncate">{supuesto.titulo}</h1>
      </header>
      <main className="p-4 max-w-2xl mx-auto space-y-4">
        <details open className="bg-white border border-slate-200 rounded-2xl p-4">
          <summary className="text-sm font-semibold text-slate-900 cursor-pointer">Enunciado del supuesto</summary>
          <p className="text-sm text-slate-700 mt-2 whitespace-pre-wrap">{supuesto.caso}</p>
        </details>
        <MotorTest preguntas={supuesto.preguntas} titulo="Preguntas del supuesto" />
      </main>
    </div>
  )
}
