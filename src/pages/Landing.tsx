import { useNavigate } from 'react-router-dom'
import { useSeo } from '../hooks/useSeo'
import { Icon, type NombreIcono } from '../components/ui/Icon'
import { HeroScene3D } from '../components/3d/HeroScene3D'
import { TiltCard3D } from '../components/ui/TiltCard3D'

const OPOSICIONES: { icono: NombreIcono; nombre: string; temas: number }[] = [
  { icono: 'escudo',    nombre: 'Policía Canaria (CGPC)', temas: 45 },
  { icono: 'policia',   nombre: 'Policía Local', temas: 37 },
  { icono: 'espadas',   nombre: 'Guardia Civil', temas: 25 },
  { icono: 'justicia',  nombre: 'Auxiliar Judicial', temas: 29 },
  { icono: 'supuestos', nombre: 'Tramitación Judicial', temas: 31 },
  { icono: 'salud',     nombre: 'Aux. Enfermería (SCS)', temas: 24 },
]

const FUNCIONALIDADES: { icono: NombreIcono; titulo: string; desc: string }[] = [
  { icono: 'temario',       titulo: 'Temario completo', desc: 'Estructurado por secciones, esquemas y mapas mentales interactivos.' },
  { icono: 'tutor',         titulo: 'Tutor IA con RAG', desc: 'Pregunta cualquier duda. Responde con citas exactas de la legislación.' },
  { icono: 'tests',         titulo: 'Tests y simulacros', desc: 'Preguntas tipo examen con nota, revisión y explicación por opción.' },
  { icono: 'entrevista',    titulo: 'Entrevista personal', desc: 'Simula la entrevista con IA. Recibe feedback inmediato y postura.' },
  { icono: 'psicotecnicos', titulo: 'Módulo psicológico', desc: 'Psicotécnicos, personalidad, biodata e informe de idoneidad.' },
  { icono: 'supuestos',     titulo: 'Supuestos prácticos', desc: 'Casos reales tipo examen resueltos con articulado y base legal.' },
  { icono: 'flashcards',    titulo: 'Flashcards espaciadas', desc: 'Repaso activo con algoritmo de retención para memorizar sin esfuerzo.' },
  { icono: 'fisico',        titulo: 'ProCoach físico', desc: 'Plan de entrenamiento adaptado a las marcas de cada cuerpo.' },
]

export default function Landing() {
  useSeo({
    title: 'OpoDAM · Academia de oposiciones en Canarias',
    description: 'Prepara tu oposición en Canarias (Policía Local, Policía Canaria, Guardia Civil, Justicia, Sanidad) con temario, tests, tutor IA y simulacros de examen.',
    path: '/',
  })
  const navigate = useNavigate()
  const ir = () => navigate('/onboarding/email')

  return (
    <div style={{ background: 'var(--bg)', color: 'var(--ink)', minHeight: '100vh', overflowX: 'hidden' }}>

      {/* ── Navbar con desenfoque de cristal editorial ── */}
      <nav
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 40,
          borderBottom: '1px solid var(--border-soft)',
          background: 'color-mix(in srgb, var(--bg) 85%, transparent)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          padding: '0 24px',
          height: 60,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="display" style={{ fontSize: 21, letterSpacing: '-0.02em', fontWeight: 700 }}>
            OpoDAM
          </span>
          <span
            style={{
              fontSize: 10.5,
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: 99,
              background: 'var(--accent-soft)',
              color: 'var(--accent-strong)',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
            }}
          >
            by Skornet<span className="hidden min-[430px]:inline"> 3D Studio</span>
          </span>
        </div>

        <button
          onClick={ir}
          className="tactile-press"
          style={{
            background: 'var(--ink)',
            color: 'var(--bg)',
            border: 0,
            borderRadius: 12,
            padding: '9px 20px',
            fontSize: 13.5,
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 4px 14px -3px rgba(0,0,0,0.15)',
          }}
        >
          Entrar gratis
        </button>
      </nav>

      {/* ── Hero con Canvas 3D Interactivo ── */}
      <section style={{ maxWidth: 1040, margin: '0 auto', padding: '48px 24px 32px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            alignItems: 'center',
            gap: 32,
          }}
        >
          {/* Texto y llamada a la acción */}
          <div style={{ textAlign: 'left' }}>
            <div
              className="eyebrow"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 16,
                padding: '4px 12px',
                borderRadius: 99,
                background: 'var(--surface)',
                border: '1px solid var(--border)',
              }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: 'var(--accent)',
                  boxShadow: '0 0 8px var(--accent)',
                }}
              />
              La academia inteligente en tu bolsillo
            </div>

            <h1
              className="display"
              style={{
                fontSize: 'clamp(36px, 5.5vw, 56px)',
                lineHeight: 1.05,
                letterSpacing: '-0.025em',
                margin: '0 0 20px',
              }}
            >
              Prepara tu plaza <br />
              <span className="display-italic" style={{ color: 'var(--accent)' }}>
                con IA táctil y 3D.
              </span>
            </h1>

            <p
              style={{
                fontSize: 17.5,
                color: 'var(--ink-soft)',
                lineHeight: 1.6,
                maxWidth: 480,
                margin: '0 0 32px',
              }}
            >
              Temario con RAG interactivo, simulacros con inercia, entrevista por voz y módulo psicotécnico espacial. Todo lo que exige tu tribunal por <strong>19,90&nbsp;€/mes</strong>.
            </p>

            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
              <button
                onClick={ir}
                className="tactile-press"
                style={{
                  background: 'var(--accent)',
                  color: 'var(--accent-ink)',
                  border: 0,
                  borderRadius: 14,
                  padding: '14px 28px',
                  fontSize: 15.5,
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 6px 20px -4px rgba(184, 73, 47, 0.4)',
                }}
              >
                Comenzar ahora →
              </button>

              <button
                onClick={() => document.getElementById('oposiciones')?.scrollIntoView({ behavior: 'smooth' })}
                className="tactile-press"
                style={{
                  background: 'var(--surface)',
                  color: 'var(--ink)',
                  border: '1px solid var(--border)',
                  borderRadius: 14,
                  padding: '14px 24px',
                  fontSize: 15,
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Explorar convocatorias
              </button>
            </div>

            <p style={{ fontSize: 12.5, color: 'var(--mute)', marginTop: 18 }}>
              ⚡ Sin tarjeta inicial. Acceso inmediato desde cualquier dispositivo.
            </p>
          </div>

          {/* Escena 3D con Three.js */}
          <div className="relative flex justify-center items-center">
            <HeroScene3D />
          </div>
        </div>
      </section>

      {/* ── Oposiciones con TiltCard 3D ── */}
      <section id="oposiciones" style={{ maxWidth: 1040, margin: '0 auto', padding: '48px 24px 64px' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div className="eyebrow" style={{ marginBottom: 6 }}>Convocatorias activas en Canarias</div>
          <h2 className="display" style={{ fontSize: 'clamp(26px, 4vw, 36px)', margin: 0 }}>
            Elige tu especialidad
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {OPOSICIONES.map(op => (
            <TiltCard3D key={op.nombre} onClick={ir} maxTilt={9} glowColor="rgba(184, 73, 47, 0.18)">
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <span
                  style={{
                    flexShrink: 0,
                    width: 48,
                    height: 48,
                    borderRadius: 14,
                    background: 'var(--accent-soft)',
                    color: 'var(--accent-strong)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 8px rgba(184, 73, 47, 0.15)',
                  }}
                >
                  <Icon nombre={op.icono} size={26} />
                </span>
                <div>
                  <div style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--ink)', lineHeight: 1.25 }}>
                    {op.nombre}
                  </div>
                  <div style={{ fontSize: 12.5, color: 'var(--mute)', marginTop: 4 }}>
                    {op.temas} temas oficiales actualizados
                  </div>
                </div>
              </div>
            </TiltCard3D>
          ))}
        </div>
      </section>

      {/* ── Funcionalidades con Elevación Tridimensional ── */}
      <section
        id="funcionalidades"
        style={{
          background: 'var(--surface)',
          borderTop: '1px solid var(--border)',
          borderBottom: '1px solid var(--border)',
          padding: '72px 24px',
        }}
      >
        <div style={{ maxWidth: 1040, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 44 }}>
            <div className="eyebrow" style={{ marginBottom: 8 }}>Ecosistema integral</div>
            <h2 className="display" style={{ fontSize: 'clamp(28px, 4.5vw, 40px)', margin: '0 0 12px' }}>
              Lo que la academia cobra por separado,<br />
              <span className="display-italic" style={{ color: 'var(--accent)' }}>aquí lo tienes todo en un clic.</span>
            </h2>
            <p style={{ fontSize: 16, color: 'var(--ink-soft)', maxWidth: 540, margin: '0 auto' }}>
              Diseñado con rigor pedagógico y microinteracciones fluidas para maximizar tu retención de memoria.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 18 }}>
            {FUNCIONALIDADES.map(f => (
              <TiltCard3D key={f.titulo} maxTilt={6} glowColor="rgba(196, 162, 90, 0.15)">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: 'var(--surface-2)',
                      color: 'var(--accent)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid var(--border-soft)',
                    }}
                  >
                    <Icon nombre={f.icono} size={24} />
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>{f.titulo}</div>
                  <div style={{ fontSize: 13.5, color: 'var(--ink-soft)', lineHeight: 1.55 }}>{f.desc}</div>
                </div>
              </TiltCard3D>
            ))}
          </div>
        </div>
      </section>

      {/* ── Precio Editorial ── */}
      <section style={{ maxWidth: 540, margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
        <div className="eyebrow" style={{ marginBottom: 10 }}>Inversión sin sorpresas</div>
        <div
          className="specular-border"
          style={{
            background: 'var(--surface)',
            borderRadius: 28,
            padding: '40px 32px',
            boxShadow: '0 20px 48px -16px rgba(26, 24, 21, 0.12)',
          }}
        >
          <div className="num-display" style={{ fontSize: 58, color: 'var(--accent)', lineHeight: 1 }}>
            19,90€
          </div>
          <div style={{ fontSize: 14, color: 'var(--mute)', marginTop: 8, fontWeight: 500 }}>
            por oposición · acceso completo mensual
          </div>

          <div style={{ margin: '28px 0', display: 'flex', flexDirection: 'column', gap: 12, textAlign: 'left' }}>
            {[
              '✓ Temario completo estructurado con citas de ley',
              '✓ Tutor IA con RAG en tiempo real',
              '✓ Tests ilimitados con explicaciones razonadas',
              '✓ Entrevista personal simulada con feedback',
              '✓ Módulo psicológico completo y biodata',
              '✓ ProCoach de pruebas físicas personalizadas',
              '✓ Modo offline PWA sin interrupciones',
              '✓ Cancela en cualquier momento con un clic',
            ].map(item => (
              <div key={item} style={{ fontSize: 14, color: 'var(--ink)', fontWeight: 500 }}>
                {item}
              </div>
            ))}
          </div>

          <button
            onClick={ir}
            className="tactile-press"
            style={{
              width: '100%',
              background: 'var(--accent)',
              color: 'var(--accent-ink)',
              border: 0,
              borderRadius: 16,
              padding: '16px 0',
              fontSize: 16,
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 8px 24px -6px rgba(184, 73, 47, 0.45)',
            }}
          >
            Comenzar preparación →
          </button>
          <p style={{ fontSize: 12.5, color: 'var(--mute)', marginTop: 14 }}>
            Prueba gratuita disponible al registrar tu cuenta.
          </p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ borderTop: '1px solid var(--border)', padding: '32px 24px', textAlign: 'center' }}>
        <span style={{ fontSize: 12.5, color: 'var(--mute)' }}>
          © 2026 OpoDAM · Diseñado para la excelencia en oposiciones.
        </span>
        <div style={{ marginTop: 10, display: 'flex', gap: 20, justifyContent: 'center' }}>
          <a href="/terminos" style={{ fontSize: 12.5, color: 'var(--mute)', textDecoration: 'none' }}>Términos</a>
          <a href="/privacidad" style={{ fontSize: 12.5, color: 'var(--mute)', textDecoration: 'none' }}>Privacidad</a>
          <a href="/reembolsos" style={{ fontSize: 12.5, color: 'var(--mute)', textDecoration: 'none' }}>Reembolsos</a>
        </div>
      </footer>
    </div>
  )
}
