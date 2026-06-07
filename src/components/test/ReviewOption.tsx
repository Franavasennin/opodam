import React from 'react'

interface Props {
  opcion: string
  index: number
  esCorrecta: boolean
  esElegida: boolean
  detalle?: string
}

const LETRAS = ['A', 'B', 'C', 'D', 'E', 'F']

export function ReviewOption({ opcion, index, esCorrecta, esElegida, detalle }: Props) {
  return (
    <div style={{
      margin: '0 0 6px', padding: '7px 10px', borderRadius: 9,
      background: esCorrecta ? 'var(--accent-soft)' : esElegida ? 'var(--warn-soft)' : 'transparent',
      border: `1px solid ${esCorrecta ? 'var(--accent)' : esElegida ? 'var(--warn)' : 'var(--border)'}`,
    }}>
      <p style={{
        margin: 0, fontSize: 12.5,
        fontWeight: esCorrecta || esElegida ? 600 : 400,
        color: esCorrecta ? 'var(--accent)' : esElegida ? 'var(--warn)' : 'var(--ink-soft)'
      }}>
        {esCorrecta ? '✅' : esElegida ? '❌' : '○'} {LETRAS[index] ?? index + 1}. {opcion}
        {esElegida && <span style={{ marginLeft: 6, fontSize: 11, opacity: 0.85 }}>· tu respuesta</span>}
      </p>
      {detalle && <p style={{ margin: '3px 0 0', fontSize: 11.5, color: 'var(--mute)', fontStyle: 'italic', lineHeight: 1.45 }}>{detalle}</p>}
    </div>
  )
}
