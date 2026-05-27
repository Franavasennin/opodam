import { useNavigate, useParams } from 'react-router-dom'
import * as cgpc from '../data/supuestos/cgpc/index'
import * as pl from '../data/supuestos/policia-local/index'

const MODULOS: Record<string, { SUPUESTOS_META: readonly { id: string; titulo: string }[] }> = {
  'cgpc': cgpc,
  'policia-local': pl,
}

export default function Supuestos() {
  const navigate = useNavigate()
  const { slug } = useParams<{ slug: string }>()
  const modulo = MODULOS[slug ?? 'cgpc']
  const metas = modulo ? modulo.SUPUESTOS_META : []

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => navigate(`/oposicion/${slug}`)} className="text-marca-600 text-sm font-medium">←</button>
        <h1 className="text-lg font-bold text-slate-900">Supuestos prácticos</h1>
      </header>
      <main className="p-4 max-w-2xl mx-auto space-y-3">
        {metas.length === 0 && <p className="text-slate-400 text-sm text-center py-8">Aún no hay supuestos para esta oposición.</p>}
        {metas.map(m => (
          <button key={m.id} onClick={() => navigate(`/oposicion/${slug}/supuestos/${m.id}`)}
            className="w-full flex items-center gap-3 bg-white border border-slate-200 rounded-2xl shadow-sm px-4 py-4 text-left hover:shadow-md transition-shadow">
            <span className="flex-1 text-sm font-bold text-slate-900">{m.titulo}</span>
            <span className="text-slate-300 text-lg">›</span>
          </button>
        ))}
      </main>
    </div>
  )
}
