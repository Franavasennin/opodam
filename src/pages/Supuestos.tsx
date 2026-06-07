import { useNavigate, useParams } from 'react-router-dom'
import * as cgpc from '../data/supuestos/cgpc/index'
import * as pl from '../data/supuestos/policia-local/index'
import * as gc from '../data/supuestos/guardia-civil/index'
import * as aj from '../data/supuestos/aux-judicial/index'
import * as tj from '../data/supuestos/tramitacion-judicial/index'

const MODULOS: Record<string, { SUPUESTOS_META: readonly { id: string; titulo: string }[] }> = {
  'cgpc': cgpc,
  'policia-local': pl,
  'guardia-civil': gc,
  'aux-judicial': aj,
  'tramitacion-judicial': tj,
}

export default function Supuestos() {
  const navigate = useNavigate()
  const { slug } = useParams<{ slug: string }>()
  const modulo = MODULOS[slug ?? 'cgpc']
  const metas = modulo ? modulo.SUPUESTOS_META : []

  return (
    <div className="min-h-screen fade-up" style={{ background: 'var(--bg)' }}>
      <header className="sticky top-0 z-10 flex items-center gap-3 px-4"
        style={{ height: 52, borderBottom: '1px solid var(--border-soft)', background: 'color-mix(in srgb, var(--bg) 88%, transparent)', backdropFilter: 'blur(12px)' }}>
        <button onClick={() => navigate(`/oposicion/${slug}`)} style={{ background: 'none', border: 0, cursor: 'pointer', color: 'var(--ink)', fontSize: 16 }}>←</button>
        <span style={{ fontWeight: 600, fontSize: 14, letterSpacing: '-0.01em' }}>Supuestos prácticos</span>
      </header>

      <main className="max-w-2xl mx-auto px-4 pt-4 pb-12">
        <div className="eyebrow" style={{ marginBottom: 10 }}>Casos tipo examen</div>
        <h1 className="display" style={{ margin: '0 0 18px', fontSize: 30, letterSpacing: '-0.015em' }}>
          Resuelve <span className="display-italic" style={{ color: 'var(--accent)' }}>supuestos reales.</span>
        </h1>

        {metas.length === 0 && (
          <p style={{ color: 'var(--mute)', fontSize: 14, textAlign: 'center', padding: '32px 0' }}>Aún no hay supuestos para esta oposición.</p>
        )}

        <div className="stagger" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {metas.map((m, i) => (
            <button key={m.id} onClick={() => navigate(`/oposicion/${slug}/supuestos/${m.id}`)} className="card"
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '16px', textAlign: 'left', cursor: 'pointer', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16 }}>
              <span className="num-display" style={{ fontSize: 26, color: 'var(--accent)', flexShrink: 0, width: 34, textAlign: 'center' }}>{String(i + 1).padStart(2, '0')}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="eyebrow" style={{ marginBottom: 3 }}>Supuesto</div>
                <div style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--ink)', letterSpacing: '-0.01em' }}>{m.titulo}</div>
              </div>
              <span style={{ color: 'var(--mute)', fontSize: 18 }}>›</span>
            </button>
          ))}
        </div>
      </main>
    </div>
  )
}
