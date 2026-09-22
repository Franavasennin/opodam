// src/pages/onboarding/OnboardingOposicion.tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { OPOSICIONES } from '../../data/oposiciones'
import { crearPerfil } from '../../services/supabase'
import { setOposicionesLocales } from '../../services/storage'
import { useOposicionStore } from '../../stores/oposicion'
import { usePuedeVerPrivadas } from '../../stores/sesion'

function Marca() {
  return (
    <div className="hero" style={{ borderRadius: '18px 18px 0 0', padding: 24, textAlign: 'center' }}>
      <div className="hero-grain" />
      <div style={{ position: 'relative' }}>
        <div style={{ fontSize: 34 }}>📘</div>
        <div className="display" style={{ fontSize: 24, marginTop: 4 }}>OpoDAM</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.72)' }}>Prepara tu oposición</div>
      </div>
    </div>
  )
}

function Puntos({ activo }: { activo: 0 | 1 | 2 }) {
  return (
    <div className="flex gap-1 justify-center" style={{ marginBottom: 16 }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{ height: 6, width: i === activo ? 24 : 6, borderRadius: 999, background: i === activo ? 'var(--accent)' : 'var(--border)' }} />
      ))}
    </div>
  )
}

export default function OnboardingOposicion() {
  const [seleccionadas, setSeleccionadas] = useState<string[]>([])
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const puedeVerPrivadas = usePuedeVerPrivadas()
  const opciones = OPOSICIONES.filter(op => !op.privado || puedeVerPrivadas)

  function toggleOposicion(slug: string) {
    setSeleccionadas(prev =>
      prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug]
    )
  }

  async function handleEmpezar() {
    if (seleccionadas.length === 0) return
    setCargando(true)
    setError(null)

    // 1. Guardar localmente primero (siempre funciona, sin red)
    setOposicionesLocales(seleccionadas)
    useOposicionStore.getState().activar(seleccionadas[0])

    // 2. Intentar guardar en Supabase en segundo plano (no bloquea)
    crearPerfil(seleccionadas).catch(e =>
      console.error('[OnboardingOposicion] Supabase sync error:', e)
    )

    // 3. Navegar inmediatamente
    navigate('/mis-oposiciones')
  }

  return (
    <div className="min-h-screen fade-up flex items-center justify-center p-4" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-sm">
        <Marca />
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderTop: 0, borderRadius: '0 0 18px 18px', padding: 24 }}>
          <Puntos activo={2} />
          <div className="eyebrow" style={{ marginBottom: 6 }}>Paso 3 — Tu oposición</div>
          <p style={{ fontSize: 13.5, color: 'var(--ink)', fontWeight: 600, margin: '0 0 14px' }}>Selecciona a qué te presentas (puedes elegir varias)</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            {opciones.map(op => {
              const sel = seleccionadas.includes(op.slug)
              return (
                <button
                  key={op.slug}
                  type="button"
                  disabled={!op.disponible}
                  onClick={() => op.disponible && toggleOposicion(op.slug)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 12, borderRadius: 12, padding: '10px 12px', textAlign: 'left',
                    cursor: op.disponible ? 'pointer' : 'not-allowed',
                    opacity: op.disponible ? 1 : 0.55,
                    background: sel ? 'var(--accent-soft)' : 'var(--surface-2)',
                    border: `1.5px solid ${sel ? 'var(--accent)' : 'var(--border)'}`,
                  }}
                >
                  <span style={{
                    width: 18, height: 18, flexShrink: 0, borderRadius: 5, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11,
                    background: sel ? 'var(--accent)' : 'transparent',
                    color: sel ? 'var(--accent-ink)' : 'transparent',
                    border: `2px solid ${sel ? 'var(--accent)' : 'var(--border)'}`,
                  }}>{sel && '✓'}</span>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)' }}>{op.nombre}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--mute)' }}>
                      {op.disponible
                        ? op.numTemas ? `${op.numTemas} temas disponibles` : 'Disponible'
                        : 'Próximamente'}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          {error && <p style={{ fontSize: 12, color: 'var(--warn)', margin: '0 0 8px' }}>{error}</p>}

          <button onClick={handleEmpezar} disabled={seleccionadas.length === 0 || cargando} className="btn-editorial btn-acc" style={{ width: '100%', opacity: seleccionadas.length === 0 || cargando ? 0.5 : 1 }}>
            {cargando ? 'Guardando…' : 'Empezar a estudiar'}
          </button>
        </div>
      </div>
    </div>
  )
}
