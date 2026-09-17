// src/pages/MisOposiciones.tsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { OPOSICIONES } from '../data/oposiciones'
import { setActiveSlug } from '../services/storage'
import { activarTrial, esOwner } from '../services/supabase'
import { BannerNutriplan } from '../components/promo/BannerNutriplan'
import { Icon, type NombreIcono } from '../components/ui/Icon'

const GLYPH: Record<string, NombreIcono> = {
  'cgpc': 'escudo',
  'policia-local': 'policia',
  'aux-enfermeria': 'salud',
  'aux-judicial': 'justicia',
  'tramitacion-judicial': 'supuestos',
  'security-plus': 'candado',
  'aws-security': 'nube',
}

export default function MisOposiciones() {
  const navigate = useNavigate()
  const [puedeVerPrivadas, setPuedeVerPrivadas] = useState(false)
  useEffect(() => { esOwner().then(setPuedeVerPrivadas) }, [])

  const visibles = OPOSICIONES.filter(op => !op.privado || puedeVerPrivadas)
  const disponibles = visibles.filter(op => op.disponible)
  const proximamente = visibles.filter(op => !op.disponible)

  async function handleEntrar(slug: string) {
    setActiveSlug(slug)
    // Esperamos a marcar trial_start antes de navegar: si no, RutaProtegida
    // podría leer 'sin-oposicion' y rebotar al usuario de vuelta aquí.
    await activarTrial().catch(() => { /* fail-open: no bloquea la navegación */ })
    navigate(`/oposicion/${slug}`)
  }

  return (
    <div className="min-h-screen fade-up" style={{ background: 'var(--bg)' }}>
      <div className="max-w-2xl mx-auto">
        {/* Cabecera con marca */}
        <div className="px-6 pt-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className="display-italic"
              style={{
                width: 28, height: 28, borderRadius: 8, background: 'var(--ink)', color: 'var(--bg)',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: "'Instrument Serif', serif", fontSize: 18, lineHeight: 1,
              }}
            >O</span>
            <span style={{ fontWeight: 600, fontSize: 15, letterSpacing: '-0.01em' }}>OpoDAM</span>
          </div>
          <span className="eyebrow">Tu academia</span>
        </div>

        {/* Hero editorial */}
        <div className="px-6 pt-5 pb-5">
          <div className="eyebrow" style={{ marginBottom: 10 }}>Academia de oposiciones</div>
          <h1 className="display" style={{ margin: 0, fontSize: 40, lineHeight: 1.02, letterSpacing: '-0.015em' }}>
            Prepara tu plaza,<br />
            <span className="display-italic" style={{ color: 'var(--accent)' }}>paso a paso.</span>
          </h1>
          <p style={{ marginTop: 14, marginBottom: 0, fontSize: 14.5, color: 'var(--mute)', maxWidth: 360, lineHeight: 1.45 }}>
            Temario, esquemas, mapas mentales, flashcards, tests, psicotécnicos, supuestos y un tutor que estudia contigo. Elige tu oposición y empieza hoy.
          </p>
        </div>

        {/* Lista de oposiciones */}
        <div className="px-6 pt-2 pb-2 flex items-baseline justify-between">
          <h2 className="display" style={{ margin: 0, fontSize: 22, letterSpacing: '-0.01em' }}>Oposiciones</h2>
          <span className="eyebrow">{disponibles.length} disponibles</span>
        </div>

        <div className="stagger" style={{ padding: '6px 16px 8px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {disponibles.map((op, i) => (
            <button
              key={op.slug}
              onClick={() => handleEntrar(op.slug)}
              className="card"
              style={{
                padding: 0, textAlign: 'left', cursor: 'pointer', overflow: 'hidden',
                background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18,
                boxShadow: '0 1px 2px rgba(14,15,13,0.04), 0 10px 26px -14px rgba(14,15,13,0.18)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'stretch' }}>
                <div style={{
                  width: 76, flexShrink: 0, background: 'var(--surface-2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-soft)',
                  borderRight: '1px solid var(--border-soft)', position: 'relative',
                }}>
                  <Icon nombre={GLYPH[op.slug] ?? 'temario'} size={26} />
                  <div style={{
                    position: 'absolute', bottom: 8, left: 0, right: 0, textAlign: 'center',
                    fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'var(--mute)', letterSpacing: '0.06em',
                  }}>{op.slug.toUpperCase()}</div>
                </div>
                <div style={{ flex: 1, padding: '14px 14px 12px', minWidth: 0 }}>
                  <div className="eyebrow" style={{ marginBottom: 4 }}>Nº {String(i + 1).padStart(2, '0')}</div>
                  <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em', color: 'var(--ink)' }}>{op.nombre}</div>
                  <div style={{ fontSize: 12.5, color: 'var(--mute)', marginTop: 2, lineHeight: 1.35 }}>{op.descripcion}</div>
                  {op.numTemas != null && (
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginTop: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
                        <span className="num-display" style={{ fontSize: 18 }}>{op.numTemas}</span>
                        <span style={{ fontSize: 11, color: 'var(--mute)' }}>temas</span>
                      </div>
                      <span style={{ marginLeft: 'auto', color: 'var(--mute)', fontSize: 18 }}>›</span>
                    </div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Próximamente */}
        {proximamente.length > 0 && (
          <section className="px-6 mt-4">
            <div className="eyebrow mb-2">Próximamente</div>
            <div className="grid grid-cols-2 gap-3">
              {proximamente.map(op => (
                <div key={op.slug} className="card" style={{ padding: 14, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, opacity: 0.7 }}>
                  <span style={{ display: 'inline-flex', color: 'var(--ink-soft)' }}><Icon nombre={GLYPH[op.slug] ?? 'temario'} size={20} /></span>
                  <div style={{ fontWeight: 600, fontSize: 12.5, color: 'var(--ink-soft)', marginTop: 6 }}>{op.nombre}</div>
                  <div style={{ fontSize: 11, color: 'var(--mute)' }}>{op.descripcion}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Accesos */}
        <div className="px-4 mt-4 flex flex-col gap-3">
          <button
            onClick={() => navigate('/equivalencias')}
            className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 16, textAlign: 'left', cursor: 'pointer', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16 }}
          >
            <span style={{ display: 'inline-flex', color: 'var(--accent)' }}><Icon nombre="mezcla" size={22} /></span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>Equivalencias entre temarios</div>
              <div style={{ fontSize: 12.5, color: 'var(--mute)' }}>Cruce CGPC ↔ Policía Local para estudiar lo común una sola vez</div>
            </div>
            <span style={{ color: 'var(--mute)', fontSize: 18 }}>›</span>
          </button>

          <button
            onClick={() => navigate('/procoach')}
            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 16, textAlign: 'left', cursor: 'pointer', background: 'var(--accent-soft)', color: 'var(--accent)', border: 0, borderRadius: 16 }}
          >
            <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--accent)', color: 'var(--accent-ink)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><Icon nombre="fisico" size={17} /></div>
            <div style={{ flex: 1, fontSize: 13 }}>
              <div style={{ fontWeight: 600 }}>ProCoach AI</div>
              <div style={{ opacity: 0.85 }}>Entrenador IA para oposiciones físicas</div>
            </div>
            <span style={{ fontSize: 15 }}>›</span>
          </button>
        </div>

        <div className="px-4 pb-10">
          <BannerNutriplan />
        </div>
      </div>
    </div>
  )
}
