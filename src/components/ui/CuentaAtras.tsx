import { useEffect, useState } from 'react'
import { Icon } from './Icon'
import { obtenerConvocatoria, type Convocatoria } from '../../services/convocatorias'

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

const card: React.CSSProperties = {
  background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '12px 16px',
  display: 'flex', alignItems: 'center', gap: 14,
}

interface Props { slug: string }

export function CuentaAtras({ slug }: Props) {
  const [conv, setConv] = useState<Convocatoria | null>(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    let vivo = true
    setTimeout(() => { if (vivo) setCargando(true) }, 0)
    obtenerConvocatoria(slug).then(c => { if (vivo) { setConv(c); setCargando(false) } })
    return () => { vivo = false }
  }, [slug])

  if (cargando) {
    return <div style={card}><span style={{ display: 'inline-flex', color: 'var(--mute)' }}><Icon nombre="tiempo" size={20} /></span><span style={{ fontSize: 14, color: 'var(--mute)' }}>Comprobando convocatoria…</span></div>
  }
  if (!conv) return null

  const fuenteLabel = conv.fuente === 'BOE' ? 'BOE' : 'BOC'
  const Enlace = (
    <a href={conv.boletinUrl} target="_blank" rel="noopener noreferrer"
      style={{ fontSize: 14, fontWeight: 600, color: 'var(--accent-strong)', textDecoration: 'underline', whiteSpace: 'nowrap' }}
      onClick={e => e.stopPropagation()}>
      Ver en el {fuenteLabel} ↗
    </a>
  )

  // 1) Hay fecha de examen → cuenta atrás real
  if (conv.estado === 'activa' && conv.fechaExamen) {
    const dias = diasRestantes(conv.fechaExamen)
    const hoy = dias === 0, vencido = dias < 0
    const titulo = hoy ? '¡Hoy es el examen!' : vencido ? 'Examen finalizado' : `Faltan ${dias} días`
    const cuenta = !hoy && !vencido
    return (
      <div style={{ ...card, padding: cuenta ? '16px 18px' : card.padding, gap: 16 }}>
        {cuenta ? (
          <div style={{ textAlign: 'center', minWidth: 64 }}>
            <div className="num-display" style={{ fontSize: 56, lineHeight: 0.95, color: 'var(--accent-strong)' }}>{dias}</div>
            <div className="eyebrow" style={{ marginTop: 4 }}>{dias === 1 ? 'día' : 'días'}</div>
          </div>
        ) : (
          <span style={{ display: 'inline-flex', color: 'var(--accent-strong)' }}><Icon nombre={hoy ? 'diana' : 'tiempo'} size={26} /></span>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink)' }}>{cuenta ? 'para el examen' : titulo}</div>
          <div style={{ fontSize: 14, color: 'var(--mute)', marginTop: 2 }}>Examen el {formatear(conv.fechaExamen)}</div>
        </div>
        {Enlace}
      </div>
    )
  }

  // 2) Convocatoria activa pero sin fecha de examen confirmada
  if (conv.estado === 'activa') {
    return (
      <div style={card}>
        <span style={{ display: 'inline-flex', color: 'var(--accent-strong)' }}><Icon nombre="alerta" size={22} /></span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>Convocatoria activa</div>
          <div style={{ fontSize: 14, color: 'var(--mute)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {conv.fechaPublicacion ? `Publicada el ${conv.fechaPublicacion} · ` : ''}consulta la fecha del examen en el {fuenteLabel}
          </div>
        </div>
        {Enlace}
      </div>
    )
  }

  // 3) Sin convocatoria / parada
  return (
    <div style={card}>
      <span style={{ display: 'inline-flex', color: 'var(--mute)' }}><Icon nombre="calendario" size={22} /></span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-soft)' }}>
          {conv.estado === 'parada' ? 'Oposición parada' : 'Sin convocatoria activa'}
        </div>
        <div style={{ fontSize: 14, color: 'var(--mute)', marginTop: 2 }}>Por el momento no hay oposición activa o está parada.</div>
      </div>
      {Enlace}
    </div>
  )
}
