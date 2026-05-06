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
      <header className="bg-white border-b border-slate-100 px-4 py-2.5 flex items-center gap-3">
        <button
          onClick={() => navigate('/mis-oposiciones')}
          className="text-blue-600 text-sm"
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
        <h1 className="font-bold text-slate-800 text-base mb-1">{oposicion.nombre}</h1>
        <p className="text-sm text-slate-500 mb-5">{oposicion.descripcion}</p>

        <div className="space-y-2">
          {MENU.map(item => (
            <button
              key={item.path}
              onClick={() => navigate(`/oposicion/${slug}/${item.path}`)}
              className="w-full flex items-center gap-3 bg-white border border-slate-100 rounded-xl px-4 py-3 text-left hover:border-slate-200 transition-colors"
            >
              <span className="text-xl">{item.icon}</span>
              <div>
                <div className="text-sm font-semibold text-slate-800">{item.label}</div>
                <div className="text-xs text-slate-400">{item.sub}</div>
              </div>
            </button>
          ))}
        </div>
      </main>
    </div>
  )
}
