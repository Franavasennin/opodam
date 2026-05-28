import { useEffect } from 'react'
import type { Tema } from '../../types'
import { parsearTeoria } from './parsearTeoria'

interface Props { tema: Tema; onTeoriaLeida: () => void }

export function TeoriaTab({ tema, onTeoriaLeida }: Props) {
  useEffect(() => {
    const t = setTimeout(onTeoriaLeida, 5000)
    return () => clearTimeout(t)
  }, [onTeoriaLeida])

  return (
    <div className="editorial">
      {tema.secciones.map((s, i) => {
        const bloques = parsearTeoria(s.contenido)
        return (
          <section key={i}>
            <span style={{ display: 'block', fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, letterSpacing: '0.06em', color: 'var(--mute)', textTransform: 'uppercase', marginBottom: 4 }}>
              {String(i + 1).padStart(2, '0')}
            </span>
            <h3 style={{ marginTop: i === 0 ? 4 : 28, marginBottom: 12 }}>{s.titulo}</h3>

            {bloques.map((b, j) => {
              if (b.tipo === 'estructura') {
                return (
                  <p key={j} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--accent)', margin: '20px 0 8px' }}>
                    {b.texto}
                  </p>
                )
              }
              if (b.tipo === 'biblio') {
                return (
                  <p key={j} style={{ fontSize: 12.5, color: 'var(--mute)', fontStyle: 'italic', lineHeight: 1.5, margin: '0 0 12px' }}>
                    Bibliografía: {b.texto}
                  </p>
                )
              }
              if (b.tipo === 'articulo') {
                return (
                  <p key={j} style={{ fontSize: 15, color: 'var(--ink-soft)', lineHeight: 1.6, margin: '0 0 14px' }}>
                    <strong style={{ color: 'var(--ink)', fontWeight: 600 }}>{b.etiqueta}. </strong>
                    {b.texto}
                  </p>
                )
              }
              return (
                <p key={j} style={{ fontSize: 15, color: 'var(--ink-soft)', lineHeight: 1.6, margin: '0 0 14px' }}>
                  {b.texto}
                </p>
              )
            })}
          </section>
        )
      })}
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
