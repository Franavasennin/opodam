import { useNavigate } from 'react-router-dom'

const OPOSICIONES = [
  { emoji: '👮', nombre: 'Policía Canaria (CGPC)', temas: 45 },
  { emoji: '🚔', nombre: 'Policía Local', temas: 37 },
  { emoji: '⚔️', nombre: 'Guardia Civil', temas: 25 },
  { emoji: '⚖️', nombre: 'Auxiliar Judicial', temas: 29 },
  { emoji: '📋', nombre: 'Tramitación Judicial', temas: 31 },
  { emoji: '🏥', nombre: 'Aux. Enfermería (SCS)', temas: 24 },
]

const FUNCIONALIDADES = [
  { icon: '📚', titulo: 'Temario completo', desc: 'Estructurado por secciones, esquemas y mapas mentales. No más PDFs.' },
  { icon: '🤖', titulo: 'Tutor IA con RAG', desc: 'Pregunta cualquier duda. Responde con citas exactas del temario.' },
  { icon: '📝', titulo: 'Tests y simulacros', desc: 'Preguntas tipo examen con nota, revisión y explicación por opción.' },
  { icon: '🎤', titulo: 'Entrevista personal', desc: 'Simula la entrevista con IA. Recibe feedback inmediato.' },
  { icon: '🧠', titulo: 'Módulo psicológico', desc: 'Psicotécnicos, personalidad, biodata e informe de idoneidad.' },
  { icon: '📋', titulo: 'Supuestos prácticos', desc: 'Casos tipo examen resueltos con base legal.' },
  { icon: '🃏', titulo: 'Flashcards', desc: 'Repaso espaciado para memorizar sin esfuerzo.' },
  { icon: '💪', titulo: 'ProCoach físico', desc: 'Plan de entrenamiento adaptado a las pruebas físicas de cada cuerpo.' },
]

export default function Landing() {
  const navigate = useNavigate()
  const ir = () => navigate('/onboarding/email')

  return (
    <div style={{ background: 'var(--bg)', color: 'var(--ink)', minHeight: '100vh' }}>

      {/* ── Navbar ── */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 20, borderBottom: '1px solid var(--border-soft)', background: 'color-mix(in srgb, var(--bg) 90%, transparent)', backdropFilter: 'blur(14px)', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span className="display" style={{ fontSize: 18 }}>OpoDAM</span>
        <button onClick={ir}
          style={{ background: 'var(--ink)', color: 'var(--bg)', border: 0, borderRadius: 10, padding: '8px 18px', fontSize: 13.5, fontWeight: 700, cursor: 'pointer' }}>
          Entrar gratis
        </button>
      </nav>

      {/* ── Hero ── */}
      <section style={{ maxWidth: 680, margin: '0 auto', padding: '72px 24px 56px', textAlign: 'center' }}>
        <div className="eyebrow" style={{ marginBottom: 16 }}>La academia en tu bolsillo</div>
        <h1 className="display" style={{ fontSize: 'clamp(32px, 6vw, 52px)', lineHeight: 1.06, letterSpacing: '-0.02em', margin: '0 0 20px' }}>
          Prepara tu oposición<br />
          <span className="display-italic" style={{ color: 'var(--accent)' }}>con IA, sin salir de casa.</span>
        </h1>
        <p style={{ fontSize: 17, color: 'var(--ink-soft)', lineHeight: 1.6, maxWidth: 520, margin: '0 auto 32px' }}>
          Temario completo, tutor inteligente, tests, entrevista simulada y módulo psicológico.
          Todo lo que paga la academia, por <strong>19,90&nbsp;€/mes</strong>.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={ir}
            style={{ background: 'var(--ink)', color: 'var(--bg)', border: 0, borderRadius: 14, padding: '14px 28px', fontSize: 16, fontWeight: 700, cursor: 'pointer' }}>
            Empezar ahora →
          </button>
          <button onClick={() => document.getElementById('funcionalidades')?.scrollIntoView({ behavior: 'smooth' })}
            style={{ background: 'none', color: 'var(--ink-soft)', border: '1px solid var(--border)', borderRadius: 14, padding: '14px 24px', fontSize: 15, cursor: 'pointer' }}>
            Ver qué incluye
          </button>
        </div>
        <p style={{ fontSize: 12, color: 'var(--mute)', marginTop: 16 }}>Sin tarjeta. Sin compromiso. Cancela cuando quieras.</p>
      </section>

      {/* ── Oposiciones ── */}
      <section style={{ maxWidth: 800, margin: '0 auto', padding: '0 24px 64px' }}>
        <div className="eyebrow" style={{ textAlign: 'center', marginBottom: 20 }}>Oposiciones disponibles</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
          {OPOSICIONES.map(op => (
            <div key={op.nombre} className="card"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 24, flexShrink: 0 }}>{op.emoji}</span>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)', lineHeight: 1.3 }}>{op.nombre}</div>
                <div style={{ fontSize: 11.5, color: 'var(--mute)', marginTop: 2 }}>{op.temas} temas</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Funcionalidades ── */}
      <section id="funcionalidades" style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '64px 24px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div className="eyebrow" style={{ textAlign: 'center', marginBottom: 8 }}>Todo en una app</div>
          <h2 className="display" style={{ fontSize: 'clamp(24px, 4vw, 36px)', textAlign: 'center', margin: '0 0 40px', letterSpacing: '-0.015em' }}>
            Lo que la academia cobra por separado,<br />
            <span className="display-italic" style={{ color: 'var(--accent)' }}>aquí lo tienes todo.</span>
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
            {FUNCIONALIDADES.map(f => (
              <div key={f.titulo} className="card"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 16, padding: 18 }}>
                <div style={{ fontSize: 26, marginBottom: 10 }}>{f.icon}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', marginBottom: 6 }}>{f.titulo}</div>
                <div style={{ fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.5 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Precio ── */}
      <section style={{ maxWidth: 480, margin: '0 auto', padding: '72px 24px', textAlign: 'center' }}>
        <div className="eyebrow" style={{ marginBottom: 12 }}>Precio</div>
        <div style={{ background: 'var(--surface)', border: '2px solid var(--accent)', borderRadius: 24, padding: '36px 32px' }}>
          <div className="num-display" style={{ fontSize: 52, color: 'var(--accent)', lineHeight: 1 }}>19,90€</div>
          <div style={{ fontSize: 14, color: 'var(--mute)', marginTop: 6 }}>por oposición · al mes</div>
          <div style={{ margin: '24px 0', display: 'flex', flexDirection: 'column', gap: 10, textAlign: 'left' }}>
            {[
              '✓ Temario completo estructurado',
              '✓ Tutor IA con RAG',
              '✓ Tests, simulacros y supuestos prácticos',
              '✓ Entrevista personal simulada',
              '✓ Módulo psicológico completo',
              '✓ ProCoach físico',
              '✓ PWA — funciona sin internet',
              '✓ Sin permanencia — cancela cuando quieras',
            ].map(item => (
              <div key={item} style={{ fontSize: 14, color: 'var(--ink)' }}>{item}</div>
            ))}
          </div>
          <button onClick={ir}
            style={{ width: '100%', background: 'var(--accent)', color: 'var(--accent-ink)', border: 0, borderRadius: 14, padding: '14px 0', fontSize: 16, fontWeight: 700, cursor: 'pointer' }}>
            Empezar ahora →
          </button>
          <p style={{ fontSize: 12, color: 'var(--mute)', marginTop: 12 }}>Entra gratis y elige tu oposición.</p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ borderTop: '1px solid var(--border)', padding: '24px', textAlign: 'center' }}>
        <span style={{ fontSize: 12, color: 'var(--mute)' }}>© 2026 OpoDAM · Canarias · Hecho para opositores de verdad.</span>
      </footer>
    </div>
  )
}
