import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../services/supabase'
import { obtenerPerfil, calcularInforme } from '../services/psicologico'
import type { InformeIdoneidad as Informe, Veredicto } from '../types/psicologico'

const COLOR: Record<Veredicto, string> = {
  apto: 'var(--accent)',
  riesgo: '#d97706',
  'no-apto': '#dc2626',
}

const ETIQUETA: Record<Veredicto, string> = {
  apto: 'APTO',
  riesgo: 'PERFIL DE RIESGO',
  'no-apto': 'NO APTO',
}

const EMOJI: Record<Veredicto, string> = {
  apto: '✅',
  riesgo: '⚠️',
  'no-apto': '❌',
}

export default function InformeIdoneidad() {
  const navigate = useNavigate()
  const { slug } = useParams<{ slug: string }>()
  const [informe, setInforme] = useState<Informe | null>(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    let cancel = false
    ;(async () => {
      if (!supabase || !slug) { if (!cancel) setCargando(false); return }
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { navigate('/'); return }
      const perfil = await obtenerPerfil(user.id, slug)
      if (!cancel) {
        setInforme(perfil ? calcularInforme(perfil, slug) : null)
        setCargando(false)
      }
    })()
    return () => { cancel = true }
  }, [slug, navigate])

  if (cargando) return (
    <div className="min-h-screen flex items-center justify-center" style={{ color: 'var(--mute)' }}>
      Generando informe…
    </div>
  )

  if (!informe) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6" style={{ textAlign: 'center' }}>
      <span style={{ fontSize: 40 }}>📋</span>
      <p style={{ color: 'var(--mute)', fontSize: 15 }}>
        Aún no hay datos suficientes. Completa al menos psicotécnicos o personalidad.
      </p>
      <button onClick={() => navigate(`/oposicion/${slug}`)}
        style={{ marginTop: 8, background: 'var(--accent)', color: 'white', border: 0, borderRadius: 12, padding: '10px 24px', fontSize: 14, cursor: 'pointer' }}>
        Volver al dashboard
      </button>
    </div>
  )

  return (
    <div className="min-h-screen fade-up" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center gap-3 px-4 no-print"
        style={{ height: 52, borderBottom: '1px solid var(--border-soft)', background: 'color-mix(in srgb, var(--bg) 88%, transparent)', backdropFilter: 'blur(12px)' }}>
        <button onClick={() => navigate(`/oposicion/${slug}`)}
          style={{ background: 'none', border: 0, cursor: 'pointer', color: 'var(--ink)', fontSize: 16 }}>←</button>
        <span style={{ fontWeight: 600, fontSize: 14, letterSpacing: '-0.01em' }}>Informe de idoneidad</span>
        <div style={{ flex: 1 }} />
        <button onClick={() => window.print()}
          style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '4px 12px', fontSize: 13, cursor: 'pointer', color: 'var(--ink)' }}>
          🖨️ Imprimir
        </button>
      </header>

      <main className="max-w-2xl mx-auto px-4 pt-6 pb-16" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Veredicto */}
        <div className="card" style={{ background: 'var(--surface)', border: `2px solid ${COLOR[informe.veredicto]}`, borderRadius: 20, padding: 28, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>{EMOJI[informe.veredicto]}</div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, letterSpacing: '0.08em', color: COLOR[informe.veredicto], fontWeight: 700, marginBottom: 6 }}>
            {ETIQUETA[informe.veredicto]}
          </div>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--ink-soft)', lineHeight: 1.5 }}>
            {informe.recomendacion}
          </p>
          <div style={{ marginTop: 12, fontSize: 12, color: 'var(--mute)' }}>Generado el {informe.fecha}</div>
        </div>

        {/* Fortalezas */}
        {informe.fortalezas.length > 0 && (
          <section>
            <div className="eyebrow" style={{ marginBottom: 10 }}>Fortalezas detectadas</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {informe.fortalezas.map((f, i) => (
                <div key={i} className="card"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 16px', fontSize: 14, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <span style={{ color: 'var(--accent)', flexShrink: 0 }}>✓</span>
                  <span style={{ color: 'var(--ink)', lineHeight: 1.4 }}>{f}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Mejoras / Riesgos */}
        {informe.mejoras.length > 0 && (
          <section>
            <div className="eyebrow" style={{ marginBottom: 10 }}>Áreas de mejora</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {informe.mejoras.map((m, i) => (
                <div key={i} className="card"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 16px', fontSize: 14, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <span style={{ color: '#d97706', flexShrink: 0 }}>→</span>
                  <span style={{ color: 'var(--ink)', lineHeight: 1.4 }}>{m}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Preguntas probables */}
        <section>
          <div className="eyebrow" style={{ marginBottom: 10 }}>Preguntas probables en entrevista</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {informe.preguntasProbables.map((p, i) => (
              <div key={i} className="card"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 16px', fontSize: 14, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ color: 'var(--mute)', flexShrink: 0, fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span style={{ color: 'var(--ink)', lineHeight: 1.4, fontStyle: 'italic' }}>{p}</span>
              </div>
            ))}
          </div>
        </section>

        {/* CTA volver */}
        <button onClick={() => navigate(`/oposicion/${slug}`)}
          className="no-print"
          style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 0', fontSize: 14, cursor: 'pointer', color: 'var(--mute)', marginTop: 4 }}>
          ← Volver al dashboard
        </button>
      </main>

      {/* Print styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white; }
        }
      `}</style>
    </div>
  )
}
