// src/pages/OposicionDashboard.tsx
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { OPOSICIONES } from '../data/oposiciones'
import { obtenerTopics } from '../data/topics'
import { useProgress } from '../hooks/useProgress'
import { CuentaAtras } from '../components/ui/CuentaAtras'
import { PanelEnRiesgo } from '../components/ui/PanelEnRiesgo'
import { PanelPreExamen } from '../components/ui/PanelPreExamen'
import { PanelPlan } from '../components/ui/PanelPlan'
import { obtenerPerfil, tieneAccesoOposicion } from '../services/supabase'
import { BannerTrial } from '../components/ui/BannerTrial'
import { BannerPaywall } from '../components/promo/BannerPaywall'
import { BienvenidaGuiada } from '../components/ui/BienvenidaGuiada'
import { pedirPermiso, comprobarRacha } from '../services/notificaciones'
import type { Perfil } from '../types'

const MENU = [
  { icon: '📚', label: 'Temario', sub: 'Estudia los temas', path: 'temario' },
  { icon: '🃏', label: 'Flashcards', sub: 'Repaso rápido', path: 'flashcards' },
  { icon: '📝', label: 'Tests y simulacros', sub: 'Practica preguntas', path: 'tests' },
  { icon: '👨‍🏫', label: 'Tutor', sub: 'Pregunta sobre todo el temario', path: 'tutor' },
  { icon: '🧠', label: 'Psicotécnicos', sub: 'Aptitudes y razonamiento', path: 'psicotecnicos' },
  { icon: '📋', label: 'Supuestos prácticos', sub: 'Casos tipo examen', path: 'supuestos' },
  { icon: '🎤', label: 'Entrevista', sub: 'Entrena la entrevista personal', path: 'entrevista' },
  { icon: '🧩', label: 'Test de personalidad', sub: 'Conoce tu perfil', path: 'personalidad' },
  { icon: '📝', label: 'Biodata', sub: 'Cuestionario de perfil personal', path: 'biodata', soloSlugs: ['guardia-civil', 'cgpc', 'policia-local'] },
  { icon: '🗂️', label: 'Informe psicológico', sub: 'Veredicto de idoneidad', path: 'informe-psicologico', soloSlugs: ['guardia-civil', 'cgpc', 'policia-local'] },
  { icon: '📊', label: 'Estadísticas', sub: 'Ver mi progreso', path: 'estadisticas' },
]

function saludo(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Buenos días'
  if (h < 20) return 'Buenas tardes'
  return 'Buenas noches'
}

export default function OposicionDashboard() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { progreso } = useProgress()
  const oposicion = OPOSICIONES.find(op => op.slug === slug)
  const [acceso, setAcceso] = useState<boolean | null>(null)

  useEffect(() => {
    if (slug) tieneAccesoOposicion(slug).then(setAcceso)
  }, [slug])

  useEffect(() => {
    // Pedir permiso de notificación de forma diferida (no bloquea UI)
    const t = setTimeout(() => {
      pedirPermiso().then(ok => { if (ok) comprobarRacha(progreso.racha?.dias ?? 0) })
    }, 3000)
    return () => clearTimeout(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [perfil, setPerfil] = useState<Perfil | null>(null)
  useEffect(() => { obtenerPerfil().then(setPerfil) }, [])

  if (!oposicion) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <p style={{ color: 'var(--mute)' }}>Oposición no encontrada.</p>
      </div>
    )
  }

  const ir = (path: string) => navigate(`/oposicion/${slug}/${path}`)

  const { TEMAS_META } = obtenerTopics(slug ?? 'cgpc')

  // ── métricas reales ──
  const temasObj = progreso.temas ?? {}
  const total = oposicion.numTemas ?? Object.keys(temasObj).length
  const estudiados = Object.values(temasObj).filter(t => (t.vueltas ?? 0) > 0 || t.teoriaLeida).length
  const conAciertos = Object.values(temasObj).filter(t => (t.porcentajeAciertos ?? 0) > 0)
  const aciertosMedia = conAciertos.length
    ? Math.round(conAciertos.reduce((a, t) => a + (t.porcentajeAciertos ?? 0), 0) / conAciertos.length)
    : 0
  const racha = progreso.racha?.dias ?? 0
  const progresoPct = total ? Math.round((estudiados / total) * 100) : 0

  const stats = [
    { label: 'Días en racha', valor: String(racha), sub: 'estudio diario' },
    { label: 'Aciertos medios', valor: `${aciertosMedia}%`, sub: 'en tus tests' },
    { label: 'Temas estudiados', valor: `${estudiados} / ${total}`, sub: `${progresoPct}% del temario` },
    { label: 'Progreso', valor: `${progresoPct}%`, sub: 'del programa' },
  ]

  return (
    <div className="min-h-screen fade-up" style={{ background: 'var(--bg)' }}>
      {perfil && <BannerTrial trialStart={perfil.trial_start ?? null} rol={perfil.rol} />}
      {/* ════════ MÓVIL ════════ */}
      <div className="lg:hidden">
        <header
          className="sticky top-0 z-10 flex items-center justify-between px-4"
          style={{ height: 52, borderBottom: '1px solid var(--border-soft)', background: 'color-mix(in srgb, var(--bg) 88%, transparent)', backdropFilter: 'blur(12px)' }}
        >
          <button onClick={() => navigate('/mis-oposiciones')} style={{ background: 'none', border: 0, cursor: 'pointer', color: 'var(--ink)', fontSize: 14, display: 'flex', alignItems: 'center', gap: 4 }}>
            ← <span style={{ fontWeight: 500 }}>Inicio</span>
          </button>
          <span className="pill mono">{oposicion.slug.toUpperCase()}</span>
        </header>

        <main className="max-w-2xl mx-auto px-4">
          <div className="hero" style={{ marginTop: 16 }}>
            <div className="hero-grain" />
            <div style={{ position: 'relative' }}>
              <div className="eyebrow" style={{ color: 'rgba(255,255,255,0.55)', marginBottom: 10 }}>Plan de estudio</div>
              <h1 className="display" style={{ margin: 0, fontSize: 30, lineHeight: 1.06, letterSpacing: '-0.015em' }}>{oposicion.nombre}</h1>
              <p style={{ marginTop: 8, marginBottom: 0, fontSize: 13.5, color: 'rgba(255,255,255,0.7)', lineHeight: 1.4 }}>{oposicion.descripcion}</p>
              {oposicion.numTemas != null && (
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 14 }}>
                  <span className="num-display" style={{ fontSize: 26 }}>{oposicion.numTemas}</span>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>temas en el programa</span>
                </div>
              )}
            </div>
          </div>

          <div style={{ marginTop: 16 }}><CuentaAtras slug={slug!} /></div>
          <div style={{ marginTop: 12 }}><PanelPlan slug={slug!} temas={temasObj} total={total} /></div>

          {acceso === false && (
            <div style={{ marginTop: 16 }}>
              <BannerPaywall slug={slug!} nombreOposicion={oposicion.nombre} />
            </div>
          )}

          <BienvenidaGuiada esNuevo={estudiados === 0 && aciertosMedia === 0} />
          <div style={{ marginTop: 16 }}><PanelPreExamen temas={temasObj} metas={TEMAS_META} /></div>
          <div style={{ marginTop: 16 }}><PanelEnRiesgo temas={temasObj} metas={TEMAS_META} /></div>
          <div className="eyebrow" style={{ margin: '22px 4px 10px' }}>Tu preparación</div>
          <div className="stagger" style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingBottom: 32 }}>
            {MENU.filter(item => !(oposicion.ocultar ?? []).includes(item.path) && (!item.soloSlugs || item.soloSlugs.includes(slug ?? ''))).map(item => (
              <button key={item.path} onClick={() => ir(item.path)} className="card"
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', textAlign: 'left', cursor: 'pointer', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16 }}>
                <span style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--surface-2)', border: '1px solid var(--border-soft)', fontSize: 20, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{item.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', letterSpacing: '-0.01em' }}>{item.label}</div>
                  <div style={{ fontSize: 12, color: 'var(--mute)', marginTop: 2 }}>{item.sub}</div>
                </div>
                <span style={{ color: 'var(--mute)', fontSize: 18 }}>›</span>
              </button>
            ))}
          </div>
        </main>
      </div>

      {/* ════════ ESCRITORIO ════════ */}
      <div className="hidden lg:block">
        {/* Topbar */}
        <header className="flex items-center justify-between px-8" style={{ height: 64, borderBottom: '1px solid var(--border-soft)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--mute)' }}>
            <span>OpoDAM</span><span>›</span>
            <span style={{ color: 'var(--ink-soft)', fontWeight: 600 }}>{oposicion.slug.toUpperCase()} · Resumen</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {racha > 0 && <span className="pill pill-accent">🔥 {racha} días</span>}
            <button onClick={() => ir('sesion-diaria')} className="btn-editorial btn-acc" style={{ height: 40 }}>Iniciar sesión diaria</button>
          </div>
        </header>

        <main className="px-8 py-7" style={{ maxWidth: 1100 }}>
          {/* Saludo */}
          <div className="eyebrow" style={{ marginBottom: 12 }}>{oposicion.nombre}</div>
          <h1 className="display" style={{ margin: 0, fontSize: 44, lineHeight: 1.02, letterSpacing: '-0.02em' }}>
            {saludo()}.<br />
            <span className="display-italic" style={{ color: 'var(--accent)' }}>Hoy toca seguir.</span>
          </h1>
          <p style={{ marginTop: 12, fontSize: 14.5, color: 'var(--mute)', maxWidth: 520, lineHeight: 1.5 }}>
            {oposicion.descripcion} · {total} temas en el programa. Continúa tu plan diario: lectura, repaso y test.
          </p>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, marginTop: 28, borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
            {stats.map((s, i) => (
              <div key={i} style={{ padding: '18px 16px', borderLeft: i === 0 ? 'none' : '1px solid var(--border)' }}>
                <div className="eyebrow" style={{ marginBottom: 8 }}>{s.label}</div>
                <div className="num-display" style={{ fontSize: 30, color: i === 0 && racha > 0 ? 'var(--accent)' : 'var(--ink)' }}>{s.valor}</div>
                <div style={{ fontSize: 11.5, color: 'var(--mute)', marginTop: 2 }}>{s.sub}</div>
              </div>
            ))}
          </div>

          {/* Cuenta atrás examen + plan inverso (P1.6) */}
          <div style={{ marginTop: 20 }}><CuentaAtras slug={slug!} /></div>
          <div style={{ marginTop: 12 }}><PanelPlan slug={slug!} temas={temasObj} total={total} /></div>

          {/* Paywall */}
          {acceso === false && (
            <div style={{ marginTop: 20 }}>
              <BannerPaywall slug={slug!} nombreOposicion={oposicion.nombre} />
            </div>
          )}

          {/* Modo pre-examen (P3.4) */}
          <div style={{ marginTop: 20 }}><PanelPreExamen temas={temasObj} metas={TEMAS_META} /></div>

          {/* En riesgo de olvido (P1.3) */}
          <div style={{ marginTop: 20 }}><PanelEnRiesgo temas={temasObj} metas={TEMAS_META} /></div>

          {/* Plan diario + ProCoach */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16, marginTop: 24 }}>
            <button onClick={() => ir('sesion-diaria')} className="hero" style={{ textAlign: 'left', border: 0, cursor: 'pointer' }}>
              <div className="hero-grain" />
              <div style={{ position: 'relative' }}>
                <div className="eyebrow" style={{ color: 'rgba(255,255,255,0.55)', marginBottom: 10 }}>Plan diario</div>
                <h2 className="display" style={{ margin: 0, fontSize: 24, lineHeight: 1.12 }}>Tu sesión de hoy</h2>
                <p style={{ marginTop: 8, marginBottom: 16, fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>Lectura, repaso de flashcards y test del día, encadenados.</p>
                <div style={{ display: 'flex', gap: 10 }}>
                  {['Leer', 'Repasar', 'Test'].map((p, i) => (
                    <span key={i} style={{ fontSize: 12, padding: '6px 12px', borderRadius: 999, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>{p}</span>
                  ))}
                </div>
              </div>
            </button>

            <button onClick={() => navigate('/procoach')} className="card" style={{ textAlign: 'left', cursor: 'pointer', background: 'var(--accent-soft)', border: 0, borderRadius: 22, padding: 22 }}>
              <div className="eyebrow" style={{ color: 'var(--accent)', marginBottom: 10 }}>ProCoach sugiere</div>
              {(oposicion.ocultar ?? []).includes('entrevista') ? (
                <>
                  <div className="display" style={{ fontSize: 22, lineHeight: 1.15, color: 'var(--accent)' }}>Repasa tus temas flojos.</div>
                  <p style={{ marginTop: 10, fontSize: 12.5, color: 'var(--accent)', opacity: 0.85 }}>Resuelve dudas con el tutor inteligente.</p>
                </>
              ) : (
                <>
                  <div className="display" style={{ fontSize: 22, lineHeight: 1.15, color: 'var(--accent)' }}>Entrena la entrevista esta semana.</div>
                  <p style={{ marginTop: 10, fontSize: 12.5, color: 'var(--accent)', opacity: 0.85 }}>Practica con feedback y consejos para el tribunal.</p>
                </>
              )}
              <span className="btn-editorial btn-acc" style={{ height: 38, marginTop: 14 }}>Empezar</span>
            </button>
          </div>
        </main>
      </div>
    </div>
  )
}
