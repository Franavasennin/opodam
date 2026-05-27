import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { cargarCuestionario, puntuar, interpretacion, type ResultadoRasgo } from '../data/personalidad/index'

const ESCALA = [1, 2, 3, 4, 5]

const topbar: React.CSSProperties = {
  height: 52, borderBottom: '1px solid var(--border-soft)',
  background: 'color-mix(in srgb, var(--bg) 88%, transparent)', backdropFilter: 'blur(12px)',
}

export default function Personalidad() {
  const navigate = useNavigate()
  const { slug } = useParams<{ slug: string }>()
  const items = cargarCuestionario()
  const [respuestas, setRespuestas] = useState<Record<string, number>>({})
  const [resultado, setResultado] = useState<ResultadoRasgo[] | null>(null)

  const completos = Object.keys(respuestas).length
  const total = items.length

  function elegir(id: string, valor: number) {
    setRespuestas(prev => ({ ...prev, [id]: valor }))
  }

  // ── Resultado ──
  if (resultado) {
    return (
      <div className="min-h-screen fade-up" style={{ background: 'var(--bg)' }}>
        <header className="sticky top-0 z-10 flex items-center gap-3 px-4" style={topbar}>
          <button onClick={() => navigate(`/oposicion/${slug}`)} style={{ background: 'none', border: 0, cursor: 'pointer', color: 'var(--ink)', fontSize: 16 }}>←</button>
          <span style={{ fontWeight: 600, fontSize: 14, letterSpacing: '-0.01em' }}>Tu perfil</span>
        </header>
        <main className="max-w-2xl mx-auto px-4 pt-4 pb-12" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p className="rounded-xl px-3 py-2" style={{ fontSize: 11.5, background: 'var(--warn-soft)', color: 'var(--warn)' }}>⚠️ Resultado orientativo, no es un diagnóstico psicológico.</p>
          {resultado.map(r => (
            <div key={r.rasgo} className="card" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 16 }}>
              <div className="flex items-center justify-between">
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>{r.titulo}</span>
                <span className="num-display" style={{ fontSize: 12, color: 'var(--mute)' }}>{r.puntuacion}/100</span>
              </div>
              <div className="bar" style={{ marginTop: 8 }}><div className="bar-fill" style={{ width: `${r.puntuacion}%` }} /></div>
              <p style={{ fontSize: 12.5, color: 'var(--ink-soft)', marginTop: 8, lineHeight: 1.45 }}>{interpretacion(r.rasgo, r.banda)}</p>
            </div>
          ))}
          <button onClick={() => { setRespuestas({}); setResultado(null) }} className="btn-editorial btn-acc" style={{ width: '100%' }}>Repetir test</button>
        </main>
      </div>
    )
  }

  // ── Cuestionario ──
  return (
    <div className="min-h-screen fade-up" style={{ background: 'var(--bg)' }}>
      <header className="sticky top-0 z-10 flex items-center gap-3 px-4" style={topbar}>
        <button onClick={() => navigate(`/oposicion/${slug}`)} style={{ background: 'none', border: 0, cursor: 'pointer', color: 'var(--ink)', fontSize: 16 }}>←</button>
        <span style={{ fontWeight: 600, fontSize: 14, letterSpacing: '-0.01em' }}>Test de personalidad</span>
        <span className="num-display" style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--mute)' }}>{completos}/{total}</span>
      </header>
      <main className="max-w-2xl mx-auto px-4 pt-4 pb-12" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {items.map(it => (
          <div key={it.id} className="card" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 16 }}>
            <p style={{ margin: '0 0 14px', fontSize: 13.5, color: 'var(--ink)', lineHeight: 1.4 }}>{it.texto}</p>
            <div className="flex justify-between items-center">
              {ESCALA.map(v => {
                const sel = respuestas[it.id] === v
                return (
                  <button key={v} type="button" aria-label={`${it.id}-${v}`} onClick={() => elegir(it.id, v)}
                    className="num-display"
                    style={{
                      width: 34, height: 34, borderRadius: '50%', cursor: 'pointer', fontSize: 13,
                      background: sel ? 'var(--accent)' : 'var(--surface-2)',
                      color: sel ? 'var(--accent-ink)' : 'var(--mute)',
                      border: `1.5px solid ${sel ? 'var(--accent)' : 'var(--border)'}`,
                    }}>{v}</button>
                )
              })}
            </div>
            <div className="flex justify-between" style={{ fontSize: 10, color: 'var(--mute)', marginTop: 8 }}><span>En desacuerdo</span><span>De acuerdo</span></div>
          </div>
        ))}
        <button onClick={() => setResultado(puntuar(respuestas))} disabled={completos < total}
          className="btn-editorial btn-acc" style={{ width: '100%', opacity: completos < total ? 0.4 : 1 }}>
          Ver resultado
        </button>
      </main>
    </div>
  )
}
