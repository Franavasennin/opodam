import { useState, useEffect, useRef } from 'react'
import { Icon } from './Icon'

// ── P2.4 Pomodoro opcional (25/5) ────────────────────────────
// Overlay discreto para estudiar en bloques con descanso. No persiste nada;
// es un temporizador de sesión. Se cierra con la X.

const FOCO = 25 * 60
const DESCANSO = 5 * 60

function mmss(s: number): string {
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`
}

export function Pomodoro({ onCerrar }: { onCerrar: () => void }) {
  const [fase, setFase] = useState<'foco' | 'descanso'>('foco')
  const [restante, setRestante] = useState(FOCO)
  const [activo, setActivo] = useState(true)
  const faseRef = useRef(fase)
  useEffect(() => { faseRef.current = fase }, [fase])

  useEffect(() => {
    if (!activo) return
    const t = setInterval(() => {
      setRestante(prev => {
        if (prev > 1) return prev - 1
        // Cambio de fase al llegar a 0.
        const siguiente = faseRef.current === 'foco' ? 'descanso' : 'foco'
        setFase(siguiente)
        if ('vibrate' in navigator) navigator.vibrate?.(120)
        return siguiente === 'foco' ? FOCO : DESCANSO
      })
    }, 1000)
    return () => clearInterval(t)
  }, [activo])

  const total = fase === 'foco' ? FOCO : DESCANSO
  const pct = ((total - restante) / total) * 100
  const color = fase === 'foco' ? 'var(--accent)' : 'var(--ok)'

  return (
    <div
      role="timer"
      className="specular-border"
      style={{
        position: 'fixed', bottom: 84, right: 16, zIndex: 40,
        background: 'var(--surface)', borderRadius: 18,
        padding: '12px 14px', boxShadow: '0 12px 32px -8px rgba(0,0,0,0.22)', width: 168,
      }}
    >
      <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
        <span className="eyebrow" style={{ color, display: 'inline-flex', alignItems: 'center', gap: 6 }}><Icon nombre="tiempo" size={14} /> {fase === 'foco' ? 'Enfoque' : 'Descanso'}</span>
        <button onClick={onCerrar} aria-label="Cerrar Pomodoro" className="tactile-press" style={{ background: 'none', border: 0, minHeight: 44, minWidth: 44, cursor: 'pointer', color: 'var(--mute)', fontSize: 16, lineHeight: 1 }}>×</button>
      </div>
      <div className="num-display font-mono" style={{ fontSize: 32, lineHeight: 1, color, textAlign: 'center', letterSpacing: '-0.02em' }}>{mmss(restante)}</div>
      <div className="bar" style={{ margin: '10px 0', height: 6, borderRadius: 99, background: 'var(--surface-2)' }}>
        <div className="bar-fill" style={{ width: `${pct}%`, background: color, transition: 'width 0.4s ease-out' }} />
      </div>
      <button
        onClick={() => setActivo(a => !a)}
        className="tactile-press"
        style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, padding: '7px 0', cursor: 'pointer', color: 'var(--ink)', fontSize: 12.5, fontWeight: 600 }}
      >
        {activo ? 'Pausar' : 'Reanudar'}
      </button>
    </div>
  )
}
