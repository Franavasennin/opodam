import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Icon, type NombreIcono } from './Icon'

const PASOS: { icono: NombreIcono; titulo: string; desc: string; path: string; cta: string }[] = [
  {
    icono: 'temario',
    titulo: 'Empieza por el Temario',
    desc: 'Lee el tema 1, escucha la lectura en voz alta y repasa el esquema. 20 minutos te bastan para empezar.',
    path: 'temario',
    cta: 'Ir al Temario →',
  },
  {
    icono: 'tests',
    titulo: 'Haz tu primer test',
    desc: 'Después de leer un tema, refuérzalo con preguntas tipo examen. Cada error tiene su explicación.',
    path: 'tests',
    cta: 'Hacer un test →',
  },
  {
    icono: 'tutor',
    titulo: 'Pregunta al Tutor IA',
    desc: 'Si algo no queda claro, el tutor responde con citas exactas del temario. Es gratis, úsalo.',
    path: 'tutor',
    cta: 'Hablar con el Tutor →',
  },
  {
    icono: 'psicotecnicos',
    titulo: 'Conoce tu perfil psicológico',
    desc: 'Haz los psicotécnicos y el test de personalidad. Al terminar obtienes un informe de idoneidad.',
    path: 'psicotecnicos',
    cta: 'Empezar psicotécnicos →',
  },
]

interface Props {
  esNuevo: boolean
}

export function BienvenidaGuiada({ esNuevo }: Props) {
  const navigate = useNavigate()
  const { slug } = useParams<{ slug: string }>()
  const [paso, setPaso] = useState(0)
  const [cerrado, setCerrado] = useState(() =>
    localStorage.getItem(`bienvenida-cerrada-${slug}`) === '1'
  )

  if (!esNuevo || cerrado) return null

  const p = PASOS[paso]

  function cerrar() {
    localStorage.setItem(`bienvenida-cerrada-${slug}`, '1')
    setCerrado(true)
  }

  return (
    <div className="card" style={{
      background: 'var(--surface)', border: '2px solid var(--accent)',
      borderRadius: 18, padding: 20, position: 'relative', marginBottom: 4,
    }}>
      <button onClick={cerrar} aria-label="Cerrar"
        style={{ position: 'absolute', top: 12, right: 14, background: 'none', border: 0, cursor: 'pointer', color: 'var(--mute)', fontSize: 18, lineHeight: 1 }}>×</button>

      {/* Barra de progreso de pasos */}
      <div style={{ display: 'flex', gap: 5, marginBottom: 14 }}>
        {PASOS.map((_, i) => (
          <div key={i} onClick={() => setPaso(i)} role="button" aria-label={`Paso ${i + 1}`}
            style={{ height: 4, flex: 1, borderRadius: 99, cursor: 'pointer', background: i <= paso ? 'var(--accent)' : 'var(--border)', transition: 'background 0.2s' }} />
        ))}
      </div>

      <div style={{ display: 'flex', color: 'var(--accent)', marginBottom: 8 }}><Icon nombre={p.icono} size={28} /></div>
      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)', marginBottom: 6 }}>{p.titulo}</div>
      <p style={{ fontSize: 13.5, color: 'var(--ink-soft)', lineHeight: 1.5, margin: '0 0 16px' }}>{p.desc}</p>

      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => navigate(`/oposicion/${slug}/${p.path}`)}
          style={{ flex: 1, background: 'var(--accent)', color: 'var(--accent-ink)', border: 0, borderRadius: 10, padding: '10px 0', fontSize: 13.5, fontWeight: 700, cursor: 'pointer' }}>
          {p.cta}
        </button>
        {paso < PASOS.length - 1 ? (
          <button onClick={() => setPaso(paso + 1)}
            style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: 'var(--mute)', cursor: 'pointer' }}>
            Siguiente
          </button>
        ) : (
          <button onClick={cerrar}
            style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: 'var(--mute)', cursor: 'pointer' }}>
            Listo ✓
          </button>
        )}
      </div>
    </div>
  )
}
