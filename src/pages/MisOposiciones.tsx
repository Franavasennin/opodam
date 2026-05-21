// src/pages/MisOposiciones.tsx
import { useNavigate } from 'react-router-dom'
import { OPOSICIONES } from '../data/oposiciones'
import { setActiveSlug } from '../services/storage'
import { BannerNutriplan } from '../components/promo/BannerNutriplan'

const ICONOS: Record<string, string> = {
  'cgpc': '🛡️',
  'policia-local': '👮',
  'aux-enfermeria': '🏥',
  'aux-judicial': '⚖️',
  'tramitacion-judicial': '📋',
}

export default function MisOposiciones() {
  const navigate = useNavigate()
  const disponibles = OPOSICIONES.filter(op => op.disponible)
  const proximamente = OPOSICIONES.filter(op => !op.disponible)

  function handleEntrar(slug: string) {
    setActiveSlug(slug)
    navigate(`/oposicion/${slug}`)
  }

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Cabecera de marca */}
      <header className="bg-marca-900 text-white">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <span className="font-extrabold text-lg tracking-tight">OpoDAM</span>
          <span className="text-xs text-marca-100">Tu academia de oposiciones</span>
        </div>
      </header>

      {/* Hero */}
      <div className="bg-gradient-to-br from-marca-900 to-marca-600 text-white">
        <div className="max-w-2xl mx-auto px-4 pb-10 pt-4">
          <h1 className="text-2xl font-extrabold leading-tight">Prepara tu oposición</h1>
          <p className="text-sm text-marca-100 mt-1.5">
            Temario, esquemas, mapas mentales, flashcards y tests. Elige tu oposición y empieza hoy.
          </p>
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 -mt-5 pb-12">
        {/* Oposiciones disponibles */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
          <h2 className="text-sm font-bold text-slate-900">Oposiciones disponibles</h2>
          <p className="text-xs text-slate-500 mb-4">Acceso completo al temario y a las prácticas</p>
          <div className="space-y-3">
            {disponibles.map(op => (
              <button
                key={op.slug}
                onClick={() => handleEntrar(op.slug)}
                className="w-full text-left rounded-xl border border-slate-200 hover:border-marca-600 hover:shadow-md transition-all overflow-hidden flex"
              >
                <span className="w-1.5 shrink-0" style={{ background: op.color }} />
                <div className="flex items-center gap-3 p-4 flex-1 min-w-0">
                  <span className="text-2xl shrink-0">{ICONOS[op.slug] ?? '📚'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm text-slate-900">{op.nombre}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{op.descripcion}</div>
                    {op.numTemas != null && (
                      <span className="inline-block mt-2 text-xs font-semibold text-marca-700 bg-marca-100 rounded-full px-2 py-0.5">
                        {op.numTemas} temas
                      </span>
                    )}
                  </div>
                  <span className="text-marca-600 text-xl shrink-0">›</span>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Próximamente */}
        {proximamente.length > 0 && (
          <section className="mt-5">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2 px-1">Próximamente</h2>
            <div className="grid grid-cols-2 gap-3">
              {proximamente.map(op => (
                <div key={op.slug} className="bg-white rounded-xl border border-slate-200 p-3 opacity-70">
                  <span className="text-xl">{ICONOS[op.slug] ?? '📚'}</span>
                  <div className="font-semibold text-xs text-slate-700 mt-1">{op.nombre}</div>
                  <div className="text-[11px] text-slate-400">{op.descripcion}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Equivalencias entre temarios */}
        <button
          onClick={() => navigate('/equivalencias')}
          className="mt-5 w-full text-left rounded-2xl border border-slate-200 bg-white shadow-sm p-4 hover:border-marca-600 transition-colors flex items-center gap-3"
        >
          <span className="text-2xl shrink-0">🔀</span>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-slate-900">Equivalencias entre temarios</div>
            <div className="text-xs text-slate-500">Cruce CGPC ↔ Policía Local para estudiar lo común una sola vez</div>
          </div>
          <span className="text-marca-600 text-xl shrink-0">›</span>
        </button>

        {/* ProCoach AI */}
        <button
          onClick={() => navigate('/procoach')}
          className="mt-3 w-full text-left rounded-2xl border border-slate-200 bg-white shadow-sm p-4 hover:border-marca-600 transition-colors flex items-center gap-3"
        >
          <span className="text-2xl shrink-0">💪</span>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-slate-900">ProCoach AI</div>
            <div className="text-xs text-slate-500">Entrenador IA para oposiciones físicas</div>
          </div>
          <span className="text-marca-600 text-xl shrink-0">›</span>
        </button>

        <BannerNutriplan />
      </main>
    </div>
  )
}
