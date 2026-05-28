import { useState } from 'react'
import { getFechaExamen, setFechaExamen } from '../../services/storage'

function diasRestantes(iso: string): number {
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0)
  const fin = new Date(iso + 'T00:00:00')
  return Math.round((fin.getTime() - hoy.getTime()) / 86400000)
}

function formatear(iso: string): string {
  try {
    return new Date(iso + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
  } catch { return iso }
}

interface Props { slug: string }

export function CuentaAtras({ slug }: Props) {
  const [fecha, setFecha] = useState<string>(() => getFechaExamen(slug) ?? '')
  const [editando, setEditando] = useState(false)

  function guardar(v: string) {
    setFecha(v)
    setFechaExamen(slug, v)
    if (v) setEditando(false)
  }

  const dias = fecha ? diasRestantes(fecha) : null

  // ── Sin fecha o editando ──
  if (!fecha || editando) {
    return (
      <div className="card" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 18 }}>📅</span>
        <span style={{ fontSize: 13, color: 'var(--ink-soft)', fontWeight: 500 }}>Fecha del examen:</span>
        <input
          type="date"
          value={fecha}
          onChange={e => guardar(e.target.value)}
          style={{ flex: 1, minWidth: 150, border: '1px solid var(--border)', borderRadius: 10, background: 'var(--bg)', color: 'var(--ink)', padding: '6px 10px', fontSize: 13 }}
        />
        {fecha && <button onClick={() => setEditando(false)} style={{ background: 'none', border: 0, cursor: 'pointer', color: 'var(--mute)', fontSize: 12 }}>Cancelar</button>}
      </div>
    )
  }

  // ── Con fecha ──
  const vencido = (dias ?? 0) < 0
  const hoy = dias === 0
  const color = vencido ? 'var(--mute)' : 'var(--accent)'
  const titulo = hoy ? '¡Hoy es el examen!' : vencido ? 'Examen pasado' : `Faltan ${dias} días`

  return (
    <button
      onClick={() => setEditando(true)}
      className="card"
      title="Cambiar fecha"
      style={{ width: '100%', textAlign: 'left', cursor: 'pointer', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 14 }}
    >
      <span style={{ fontSize: 22 }}>{hoy ? '🎯' : '⏳'}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          {!hoy && !vencido && <span className="num-display" style={{ fontSize: 24, color, lineHeight: 1 }}>{dias}</span>}
          <span style={{ fontSize: 14, fontWeight: 600, color: vencido ? 'var(--ink-soft)' : 'var(--ink)' }}>{titulo}</span>
        </div>
        <div style={{ fontSize: 11.5, color: 'var(--mute)', marginTop: 2 }}>Examen el {formatear(fecha)} · toca para cambiar</div>
      </div>
      <span style={{ color: 'var(--mute)', fontSize: 14 }}>✎</span>
    </button>
  )
}
