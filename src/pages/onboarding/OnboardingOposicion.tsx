// src/pages/onboarding/OnboardingOposicion.tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { OPOSICIONES } from '../../data/oposiciones'
import { crearPerfil } from '../../services/supabase'
import { setActiveSlug } from '../../services/storage'

export default function OnboardingOposicion() {
  const [seleccionadas, setSeleccionadas] = useState<string[]>([])
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  function toggleOposicion(slug: string) {
    setSeleccionadas(prev =>
      prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug]
    )
  }

  async function handleEmpezar() {
    if (seleccionadas.length === 0) return
    setCargando(true)
    setError(null)
    const { error: err } = await crearPerfil(seleccionadas)
    if (err) {
      setError(`Error: ${err}`)
      setCargando(false)
      return
    }
    setActiveSlug(seleccionadas[0])
    navigate('/mis-oposiciones')
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-t-2xl p-6 text-center text-white">
          <div className="text-4xl mb-1">📘</div>
          <div className="font-bold text-lg">OpoDAM</div>
          <div className="text-sm opacity-80">Prepara tu oposición</div>
        </div>

        <div className="bg-white rounded-b-2xl shadow-lg p-6">
          <div className="flex gap-1 justify-center mb-4">
            <div className="h-1.5 w-1.5 bg-slate-200 rounded-full" />
            <div className="h-1.5 w-1.5 bg-slate-200 rounded-full" />
            <div className="h-1.5 w-6 bg-blue-600 rounded-full" />
          </div>

          <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">Paso 3 — Tu oposición</p>
          <p className="text-sm text-slate-700 font-medium mb-4">Selecciona a qué te presentas (puedes elegir varias)</p>

          <div className="space-y-2 mb-4">
            {OPOSICIONES.map(op => (
              <button
                key={op.slug}
                type="button"
                disabled={!op.disponible}
                onClick={() => op.disponible && toggleOposicion(op.slug)}
                className={[
                  'w-full flex items-center gap-3 border rounded-xl px-3 py-2.5 text-left transition-colors',
                  op.disponible
                    ? seleccionadas.includes(op.slug)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 hover:border-slate-300'
                    : 'border-slate-100 bg-slate-50 opacity-60 cursor-not-allowed',
                ].join(' ')}
              >
                <span
                  className={[
                    'w-4 h-4 rounded flex-shrink-0 border-2 flex items-center justify-center text-xs',
                    seleccionadas.includes(op.slug)
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'border-slate-300',
                  ].join(' ')}
                >
                  {seleccionadas.includes(op.slug) && '✓'}
                </span>
                <div>
                  <div className="text-sm font-semibold text-slate-800">{op.nombre}</div>
                  <div className="text-xs text-slate-400">
                    {op.disponible
                      ? op.numTemas ? `${op.numTemas} temas disponibles` : 'Disponible'
                      : 'Próximamente'}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {error && <p className="text-xs text-red-600 mb-2">{error}</p>}

          <button
            onClick={handleEmpezar}
            disabled={seleccionadas.length === 0 || cargando}
            className="w-full bg-blue-600 text-white rounded-xl py-2.5 text-sm font-semibold disabled:opacity-50"
          >
            {cargando ? 'Guardando...' : 'Empezar a estudiar'}
          </button>
        </div>
      </div>
    </div>
  )
}
