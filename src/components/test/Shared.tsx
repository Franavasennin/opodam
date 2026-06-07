import React from 'react'

export const topbarStyle: React.CSSProperties = {
  height: 52, borderBottom: '1px solid var(--border-soft)',
  background: 'color-mix(in srgb, var(--bg) 88%, transparent)', backdropFilter: 'blur(12px)',
}

interface TestTopbarProps {
  onBack?: () => void
  title: React.ReactNode
  rightContent?: React.ReactNode
}

export function TestTopbar({ onBack, title, rightContent }: TestTopbarProps) {
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between px-4" style={topbarStyle}>
      <div className="flex items-center gap-3">
        {onBack && (
          <button onClick={onBack} style={{ background: 'none', border: 0, cursor: 'pointer', color: 'var(--ink)', fontSize: 16 }}>←</button>
        )}
        <span style={{ fontWeight: 600, fontSize: 14, letterSpacing: '-0.01em' }}>{title}</span>
      </div>
      {rightContent}
    </header>
  )
}

const LETRAS = ['A', 'B', 'C', 'D', 'E', 'F']

interface ReviewOptionProps {
  opcion: string
  index: number
  esCorrecta: boolean
  esElegida: boolean
  detalle?: string
}

export function ReviewOption({ opcion, index, esCorrecta, esElegida, detalle }: ReviewOptionProps) {
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

interface ExplanationBlockProps {
  explicacion: string
}

export function ExplanationBlock({ explicacion }: ExplanationBlockProps) {
  if (!explicacion) return null
  return (
    <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--mute)', fontStyle: 'italic' }}>
      {explicacion}
    </p>
  )
}
