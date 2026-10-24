import { useState } from 'react'
import { calcularPuntuacionTest } from '../../services/progress'
import { ReviewOption } from './Shared'
import { Icon } from '../ui/Icon'
import { registrarEstudio } from '../../services/notificaciones'
import { FluidCounter } from '../ui/FluidCounter'
import { dispararConfetiOposicion } from '../ui/ConfettiBurst'

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
    const nota = calcularPuntuacionTest(aciertos, errores, preguntas.length)
    if (nota >= 5) {
      dispararConfetiOposicion()
    }
    onTerminar?.({ aciertos, errores, total: preguntas.length })
  }

  if (terminado) {
    const nota = calcularPuntuacionTest(aciertos, errores, preguntas.length)
    const apto = nota >= 5

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="card specular-border" style={{ background: 'var(--surface)', borderRadius: 20, padding: 28, textAlign: 'center' }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>Resultado de la prueba</div>
          <div className="num-display" style={{ fontSize: 56, color: apto ? 'var(--accent)' : 'var(--warn)', lineHeight: 1 }}>
            <FluidCounter value={nota} decimals={2} />
          </div>
          <div className="eyebrow" style={{ marginTop: 6 }}>sobre 10 · {apto ? 'Apto' : 'No apto'}</div>
          
          <div style={{ fontSize: 14, color: 'var(--ink-soft)', marginTop: 14, display: 'flex', justifyContent: 'center', gap: 16 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--ok)', fontWeight: 600 }}>
              <Icon nombre="acierto" size={16} /> {aciertos} aciertos
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--err)', fontWeight: 600 }}>
              <Icon nombre="fallo" size={16} /> {errores} errores
            </span>
          </div>
        </div>

        {preguntas.map((p, i) => {
          const elegida = respuestas[i]
          const ok = elegida === p.respuestaCorrecta
          return (
            <div key={p.id} className="card" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 16, borderLeft: `4px solid ${elegida === null ? 'var(--border)' : ok ? 'var(--ok)' : 'var(--err)'}` }}>
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Barra de progreso fluida */}
      <div className="w-full bg-[var(--surface-2)] h-1.5 rounded-full overflow-hidden">
        <div
          className="bg-[var(--accent)] h-full transition-all duration-300 ease-out"
          style={{ width: `${((indice + 1) / preguntas.length) * 100}%` }}
        />
      </div>

      <div className="flex items-center justify-between">
        <h2 style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{titulo}</h2>
        <span className="num-display" style={{ fontSize: 14, color: 'var(--mute)' }}>
          {indice + 1} de {preguntas.length}
        </span>
      </div>

      <p style={{ margin: 0, fontSize: 15.5, fontWeight: 500, lineHeight: 1.5, color: 'var(--ink)' }}>
        {p.enunciado}
      </p>

      {/* Opciones con física táctil Emil Kowalski */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {p.opciones.map((op, j) => {
          const isSelected = sel === j
          return (
            <button
              key={j}
              type="button"
              className={`tactile-option opt ${isSelected ? 'is-selected' : ''}`}
              onClick={() => elegir(j)}
            >
              <span
                style={{
                  width: 24,
                  height: 24,
                  flexShrink: 0,
                  borderRadius: 7,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 12,
                  fontWeight: 600,
                  color: isSelected ? 'var(--accent-ink)' : 'var(--mute)',
                  background: isSelected ? 'var(--accent)' : 'var(--surface-2)',
                  border: `1px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
                  transition: 'all 0.15s ease',
                }}
              >
                {LETRAS[j] ?? j + 1}
              </span>
              <span style={{ flex: 1, textAlign: 'left' }}>{op}</span>
            </button>
          )
        })}
      </div>

      <div className="flex justify-between items-center pt-2">
        <button
          onClick={() => setIndice(i => Math.max(0, i - 1))}
          disabled={indice === 0}
          className="tactile-press"
          style={{
            background: 'none',
            border: 0,
            minHeight: 44,
            padding: '0 12px',
            cursor: 'pointer',
            fontSize: 13.5,
            color: 'var(--mute)',
            opacity: indice === 0 ? 0.3 : 1,
          }}
        >
          ← Anterior
        </button>

        {esUltima ? (
          <button
            onClick={finalizar}
            className="btn-editorial btn-acc tactile-press"
            style={{ height: 42, padding: '0 24px', fontWeight: 600 }}
          >
            Finalizar examen
          </button>
        ) : (
          <button
            onClick={() => setIndice(i => Math.min(preguntas.length - 1, i + 1))}
            className="btn-editorial btn-acc tactile-press"
            style={{ height: 42, padding: '0 22px', fontWeight: 600 }}
          >
            Siguiente →
          </button>
        )}
      </div>
    </div>
  )
}
