import { useState } from 'react'
import { calcularPuntuacionTest } from '../../services/progress'
import { ReviewOption } from './Shared'
import { registrarEstudio } from '../../services/notificaciones'

export interface PreguntaTest {
  id: string
  enunciado: string
  opciones: string[]
  respuestaCorrecta: number
  explicacion: string
  explicaciones?: string[]
}

interface Props {
  preguntas: PreguntaTest[]
  titulo: string
  onTerminar?: (resultado: { aciertos: number; errores: number; total: number }) => void
}

const LETRAS = ['A', 'B', 'C', 'D', 'E', 'F']

export function MotorTest({ preguntas, titulo, onTerminar }: Props) {
  const [indice, setIndice] = useState(0)
  const [respuestas, setRespuestas] = useState<(number | null)[]>(() => preguntas.map(() => null))
  const [terminado, setTerminado] = useState(false)

  if (!preguntas.length) {
    return <p style={{ color: 'var(--mute)', fontSize: 14, textAlign: 'center', padding: '32px 0' }}>Aún no hay preguntas aquí.</p>
  }

  const aciertos = respuestas.filter((r, i) => r === preguntas[i].respuestaCorrecta).length
  const errores = respuestas.filter((r, i) => r !== null && r !== preguntas[i].respuestaCorrecta).length

  function elegir(j: number) {
    setRespuestas(prev => prev.map((r, i) => (i === indice ? j : r)))
  }

  function finalizar() {
    registrarEstudio()
    setTerminado(true)
    onTerminar?.({ aciertos, errores, total: preguntas.length })
  }

  if (terminado) {
    const nota = calcularPuntuacionTest(aciertos, errores, preguntas.length)
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="card" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, padding: 24, textAlign: 'center' }}>
          <div className="num-display" style={{ fontSize: 52, color: 'var(--accent)', lineHeight: 1 }}>{nota.toFixed(2)}</div>
          <div className="eyebrow" style={{ marginTop: 6 }}>sobre 10</div>
          <div style={{ fontSize: 13.5, color: 'var(--ink-soft)', marginTop: 12 }}>✅ {aciertos} aciertos · ❌ {errores} errores</div>
        </div>
        {preguntas.map((p, i) => {
          const elegida = respuestas[i]
          const ok = elegida === p.respuestaCorrecta
          return (
            <div key={p.id} className="card" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 16, borderLeft: `3px solid ${elegida === null ? 'var(--border)' : ok ? 'var(--accent)' : 'var(--warn)'}` }}>
              <p style={{ margin: '0 0 10px', fontSize: 13.5, fontWeight: 600, color: 'var(--ink)' }}>{p.enunciado}</p>
              {p.opciones.map((op, j) => {
                const esCorr = j === p.respuestaCorrecta
                const esEleg = j === elegida
                const detalle = p.explicaciones?.[j] ?? (esCorr ? p.explicacion : '')
                return (
                  <ReviewOption
                    key={j}
                    opcion={op}
                    index={j}
                    esCorrecta={esCorr}
                    esElegida={esEleg}
                    detalle={detalle}
                  />
                )
              })}
            </div>
          )
        })}
      </div>
    )
  }

  const p = preguntas[indice]
  const sel = respuestas[indice]
  const esUltima = indice + 1 >= preguntas.length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="flex items-center justify-between">
        <h2 style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{titulo}</h2>
        <span className="num-display" style={{ fontSize: 15, color: 'var(--mute)' }}>{indice + 1}/{preguntas.length}</span>
      </div>
      <p style={{ margin: 0, fontSize: 15, fontWeight: 500, lineHeight: 1.45, color: 'var(--ink)' }}>{p.enunciado}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {p.opciones.map((op, j) => (
          <button key={j} type="button" className="opt" onClick={() => elegir(j)}
            style={sel === j ? { borderColor: 'var(--accent)', background: 'var(--accent-soft)', color: 'var(--accent)' } : undefined}>
            <span style={{
              width: 22, height: 22, flexShrink: 0, borderRadius: 6,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
              color: sel === j ? 'var(--accent-ink)' : 'var(--mute)',
              background: sel === j ? 'var(--accent)' : 'var(--surface)',
              border: `1px solid ${sel === j ? 'var(--accent)' : 'var(--border)'}`,
            }}>{LETRAS[j] ?? j + 1}</span>
            <span>{op}</span>
          </button>
        ))}
      </div>
      <div className="flex justify-between pt-2">
        <button onClick={() => setIndice(i => Math.max(0, i - 1))} disabled={indice === 0}
          style={{ background: 'none', border: 0, cursor: 'pointer', fontSize: 13.5, color: 'var(--mute)', opacity: indice === 0 ? 0.3 : 1 }}>← Anterior</button>
        {esUltima
          ? <button onClick={finalizar} className="btn-editorial btn-acc" style={{ height: 40 }}>Finalizar</button>
          : <button onClick={() => setIndice(i => Math.min(preguntas.length - 1, i + 1))} className="btn-editorial btn-acc" style={{ height: 40 }}>Siguiente →</button>}
      </div>
    </div>
  )
}
