import { useEffect } from 'react'
import type { Tema } from '../../types'

interface Props { tema: Tema; onTeoriaLeida: () => void }

export function TeoriaTab({ tema, onTeoriaLeida }: Props) {
  useEffect(() => {
    const t = setTimeout(onTeoriaLeida, 5000)
    return () => clearTimeout(t)
  }, [onTeoriaLeida])

  return (
    <div className="editorial">
      {tema.secciones.map((s, i) => (
        <section key={i}>
          <span style={{ display: 'block', fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, letterSpacing: '0.06em', color: 'var(--mute)', textTransform: 'uppercase', marginBottom: 4 }}>
            {String(i + 1).padStart(2, '0')}
          </span>
          <h3 style={{ marginTop: i === 0 ? 4 : 28 }}>{s.titulo}</h3>
          <p style={{ fontSize: 15, color: 'var(--ink-soft)', lineHeight: 1.6, whiteSpace: 'pre-line', margin: 0 }}>
            {s.contenido}
          </p>
        </section>
      ))}
      <button
        onClick={onTeoriaLeida}
        className="btn-editorial btn-acc"
        style={{ width: '100%', marginTop: 28 }}
      >
        Marcar teoría como leída
      </button>
    </div>
  )
}
