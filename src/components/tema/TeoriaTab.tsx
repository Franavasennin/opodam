import { useEffect, useState } from 'react'
import type { Tema } from '../../types'
import { parsearTeoria } from './parsearTeoria'

interface Props { tema: Tema; onTeoriaLeida: () => void }

const ttsDisponible = typeof window !== 'undefined' && 'speechSynthesis' in window

// Divide el texto en fragmentos cortos por frases (evita el corte de utterances largas).
function trocear(texto: string, max = 220): string[] {
  const limpio = texto.replace(/\s+/g, ' ').trim()
  const frases = limpio.match(/[^.!?\n]+[.!?]?/g) ?? [limpio]
  const out: string[] = []
  let buf = ''
  for (const f of frases) {
    if ((buf + f).length > max) { if (buf) out.push(buf.trim()); buf = f }
    else buf += f
  }
  if (buf.trim()) out.push(buf.trim())
  return out
}

export function TeoriaTab({ tema, onTeoriaLeida }: Props) {
  const [leyendo, setLeyendo] = useState(false)

  useEffect(() => {
    const t = setTimeout(onTeoriaLeida, 5000)
    return () => clearTimeout(t)
  }, [onTeoriaLeida])

  // Detener la lectura al desmontar o cambiar de tema.
  useEffect(() => {
    return () => { if (ttsDisponible) window.speechSynthesis.cancel() }
  }, [tema.id])

  function toggleLeer() {
    if (!ttsDisponible) return
    if (leyendo) { window.speechSynthesis.cancel(); setLeyendo(false); return }
    const texto = tema.secciones.map(s => s.contenido).join('. ')
    const trozos = trocear(texto)
    if (!trozos.length) return
    window.speechSynthesis.cancel()
    trozos.forEach((t, i) => {
      const u = new SpeechSynthesisUtterance(t)
      u.lang = 'es-ES'
      u.rate = 1
      if (i === trozos.length - 1) u.onend = () => setLeyendo(false)
      window.speechSynthesis.speak(u)
    })
    setLeyendo(true)
  }

  return (
    <div className="editorial">
      {ttsDisponible && (
        <button
          onClick={toggleLeer}
          className="btn-editorial btn-sec"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 18 }}
        >
          <span style={{ fontSize: 15 }}>{leyendo ? '⏹' : '🔊'}</span>
          {leyendo ? 'Detener lectura' : 'Leer temario'}
        </button>
      )}
      {tema.secciones.map((s, i) => {
        const bloques = parsearTeoria(s.contenido)
        return (
          <section key={i}>
            {s.titulo && (
              <>
                <span style={{ display: 'block', fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, letterSpacing: '0.06em', color: 'var(--mute)', textTransform: 'uppercase', marginBottom: 4 }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3 style={{ marginTop: i === 0 ? 4 : 28, marginBottom: 12 }}>{s.titulo}</h3>
              </>
            )}

            {bloques.map((b, j) => {
              if (b.tipo === 'estructura') {
                return (
                  <p key={j} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--accent)', margin: '22px 0 8px' }}>
                    {b.texto}
                  </p>
                )
              }
              if (b.tipo === 'subtitulo') {
                return (
                  <p key={j} style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', margin: '16px 0 6px' }}>
                    {b.texto}
                  </p>
                )
              }
              if (b.tipo === 'lista') {
                return (
                  <ul key={j} style={{ margin: '0 0 14px', paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {b.items!.map((it, k) => (
                      <li key={k} style={{ fontSize: 14.5, color: 'var(--ink-soft)', lineHeight: 1.55 }}>{it}</li>
                    ))}
                  </ul>
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
