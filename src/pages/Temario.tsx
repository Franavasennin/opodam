import { useNavigate, useParams } from 'react-router-dom'
import { useProgress } from '../hooks/useProgress'
import { obtenerTopics } from '../data/topics'
import { estadoDominio, diasEntre, type EstadoDominio } from '../services/dominio'
import type { Bloque } from '../types'

const CHIP: Record<Exclude<EstadoDominio, 'nuevo'>, { texto: string; color: string; bg: string }> = {
  dominado: { texto: '🟢 Dominado', color: 'var(--accent)', bg: 'var(--accent-soft)' },
  riesgo:   { texto: '🟡 En riesgo', color: '#a07a2c', bg: 'color-mix(in srgb, #a07a2c 14%, transparent)' },
  olvidado: { texto: '🔴 Repasar', color: 'var(--warn)', bg: 'color-mix(in srgb, var(--warn) 14%, transparent)' },
}

export function Temario() {
  const { progreso } = useProgress()
  const navigate = useNavigate()
  const { slug } = useParams<{ slug: string }>()
  const { TEMAS_META } = obtenerTopics(slug ?? 'cgpc')

  const grupos: Record<Bloque, Array<typeof TEMAS_META[number]>> = {
    general: TEMAS_META.filter(t => t.bloque === 'general'),
    especifico: TEMAS_META.filter(t => t.bloque === 'especifico'),
  }

  function renderTema(meta: typeof TEMAS_META[number]) {
    const p = progreso.temas[String(meta.id)]
    const vueltas = p?.vueltas ?? 0
    const aciertos = p?.porcentajeAciertos ?? 0
    const estado = estadoDominio(p)
    const chip = estado === 'nuevo' ? null : CHIP[estado]
    return (
      <button
        key={meta.id}
        onClick={() => navigate(`/oposicion/${slug}/temario/${meta.id}`)}
        className="card"
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '13px 14px',
          textAlign: 'left', cursor: 'pointer', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14,
        }}
      >
        <span className="num-display" style={{
          width: 38, height: 38, borderRadius: 10, background: 'var(--surface-2)',
          border: '1px solid var(--border-soft)', color: 'var(--ink-soft)', fontSize: 18,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>{meta.id}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 13.5, fontWeight: 600, color: 'var(--ink)', letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{meta.titulo}</p>
          <p style={{ margin: '2px 0 0', fontSize: 11.5, color: 'var(--mute)' }}>
            {p?.ultimaRevision
              ? (() => { const d = diasEntre(p.ultimaRevision); return d === 0 ? 'Revisado hoy' : `Hace ${d} día${d === 1 ? '' : 's'}` })()
              : 'Sin estudiar'}
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
          {chip
            ? <span style={{ fontSize: 11, fontWeight: 600, color: chip.color, background: chip.bg, borderRadius: 999, padding: '3px 9px', whiteSpace: 'nowrap' }}>{chip.texto}</span>
            : aciertos > 0
              ? <span className="num-display" style={{ fontSize: 15, color: 'var(--accent)' }}>{aciertos}<span style={{ fontSize: 10 }}>%</span></span>
              : <span style={{ color: 'var(--mute)', fontSize: 16 }}>›</span>}
          {vueltas > 0 && <span className="eyebrow" style={{ letterSpacing: '0.04em' }}>×{vueltas}</span>}
        </div>
      </button>
    )
  }

  return (
    <div className="min-h-screen fade-up" style={{ background: 'var(--bg)' }}>
      <header
        className="sticky top-0 z-10 flex items-center gap-3 px-4"
        style={{ height: 52, borderBottom: '1px solid var(--border-soft)', background: 'color-mix(in srgb, var(--bg) 88%, transparent)', backdropFilter: 'blur(12px)' }}
      >
        <button onClick={() => navigate(`/oposicion/${slug}`)} style={{ background: 'none', border: 0, cursor: 'pointer', color: 'var(--ink)', fontSize: 16 }}>←</button>
        <span style={{ fontWeight: 600, fontSize: 14, letterSpacing: '-0.01em' }}>Temario</span>
      </header>

      <div className="max-w-2xl mx-auto px-4 pt-4 pb-12" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <section>
          <div className="flex items-baseline justify-between px-1 mb-3">
            <h2 className="display" style={{ margin: 0, fontSize: 22, letterSpacing: '-0.01em' }}>Bloque general</h2>
            <span className="eyebrow">{grupos.general.length} temas</span>
          </div>
          <div className="stagger" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{grupos.general.map(renderTema)}</div>
        </section>
        {grupos.especifico.length > 0 && (
          <section>
            <div className="flex items-baseline justify-between px-1 mb-3">
              <h2 className="display" style={{ margin: 0, fontSize: 22, letterSpacing: '-0.01em' }}>Bloque específico</h2>
              <span className="eyebrow">{grupos.especifico.length} temas</span>
            </div>
            <div className="stagger" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{grupos.especifico.map(renderTema)}</div>
          </section>
        )}
      </div>
    </div>
  )
}
