// src/pages/OposicionDashboard.tsx
import { useParams, useNavigate } from 'react-router-dom'
import { OPOSICIONES } from '../data/oposiciones'

const MENU = [
  { icon: '📚', label: 'Temario', sub: 'Estudia los temas', path: 'temario' },
  { icon: '🃏', label: 'Flashcards', sub: 'Repaso rápido', path: 'flashcards' },
  { icon: '📝', label: 'Tests y simulacros', sub: 'Practica preguntas', path: 'tests' },
  { icon: '📊', label: 'Estadísticas', sub: 'Ver mi progreso', path: 'estadisticas' },
]

export default function OposicionDashboard() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const oposicion = OPOSICIONES.find(op => op.slug === slug)

  if (!oposicion) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-500">Oposición no encontrada.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => navigate('/mis-oposiciones')}
          className="text-marca-600 hover:text-marca-700 text-sm font-medium transition-colors"
        >
          ← Inicio
        </button>
        <span
          className="text-xs font-bold px-3 py-1 rounded-full border"
          style={{ color: oposicion.color, borderColor: oposicion.color, background: `${oposicion.color}15` }}
        >
          {oposicion.slug.toUpperCase()}
        </span>
      </header>

      <main className="max-w-md mx-auto p-4">
        <h1 className="font-bold text-slate-900 text-lg mb-1">{oposicion.nombre}</h1>
        <p className="text-sm text-slate-500 mb-6">{oposicion.descripcion}</p>

        <div className="space-y-3">
          {MENU.map(item => (
            <button
              key={item.path}
              onClick={() => navigate(`/oposicion/${slug}/${item.path}`)}
              className="w-full flex items-center gap-4 bg-white border border-slate-200 rounded-2xl shadow-sm px-4 py-4 text-left hover:shadow-md transition-shadow"
            >
              <span className="w-11 h-11 rounded-xl bg-marca-50 text-xl flex items-center justify-center shrink-0">
                {item.icon}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-slate-900">{item.label}</div>
                <div className="text-xs text-slate-500 mt-0.5">{item.sub}</div>
              </div>
              <span className="text-slate-300 text-lg">›</span>
            </button>
          ))}
        </div>
      </main>
    </div>
  )
}
