import { useParams } from 'react-router-dom'
import { useProgress } from '../hooks/useProgress'
import { obtenerTopics } from '../data/topics'
import { PanelDebilidades } from '../components/ui/PanelDebilidades'
import { flashcardsPendientesHoy } from '../services/spaced-repetition'

const topbar: React.CSSProperties = {
  height: 52, borderBottom: '1px solid var(--border-soft)',
  background: 'color-mix(in srgb, var(--bg) 88%, transparent)', backdropFilter: 'blur(12px)',
}

export function Estadisticas() {
  const { slug } = useParams<{ slug: string }>()
  const { TEMAS_META } = obtenerTopics(slug ?? 'cgpc')
  const { progreso } = useProgress()
  const horas = Math.floor(progreso.tiempoTotalSegundos / 3600)
  const mins  = Math.floor((progreso.tiempoTotalSegundos % 3600) / 60)

  const conDatos = TEMAS_META
    .map(m => ({
      ...m,
      vueltas: progreso.temas[String(m.id)]?.vueltas ?? 0,
      aciertos: progreso.temas[String(m.id)]?.porcentajeAciertos ?? 0,
    }))
    .filter(t => t.vueltas > 0)

  return (
    <div className="min-h-screen fade-up" style={{ background: 'var(--bg)' }}>
      <header className="sticky top-0 z-10 flex items-center gap-3 px-4" style={topbar}>
        <span style={{ fontWeight: 600, fontSize: 14, letterSpacing: '-0.01em' }}>Estadísticas</span>
      </header>
      <main className="max-w-2xl mx-auto px-4 pt-4 pb-12" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 10 }}>Tu progreso</div>
          <h1 className="display" style={{ margin: 0, fontSize: 30, letterSpacing: '-0.015em' }}>
            Cómo vas <span className="display-italic" style={{ color: 'var(--accent)' }}>de verdad.</span>
          </h1>
        </div>

        <PanelDebilidades rendimiento={progreso.rendimientoPorTema} />

        <div className="grid grid-cols-3 gap-3">
          <div className="card" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 18, textAlign: 'center' }}>
            <div className="num-display" style={{ fontSize: 34, color: 'var(--accent)', lineHeight: 1 }}>{progreso.racha.dias}</div>
            <div style={{ fontSize: 11.5, color: 'var(--mute)', marginTop: 6 }}>Días de racha</div>
          </div>
          <div className="card" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 18, textAlign: 'center' }}>
            <div className="num-display" style={{ fontSize: 34, color: 'var(--accent)', lineHeight: 1 }}>{horas}h {mins}m</div>
            <div style={{ fontSize: 11.5, color: 'var(--mute)', marginTop: 6 }}>Tiempo total</div>
          </div>
          <div className="card" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 18, textAlign: 'center' }}>
            <div className="num-display" style={{ fontSize: 34, color: 'var(--accent)', lineHeight: 1 }}>{flashcardsPendientesHoy(progreso.flashcards).length}</div>
            <div style={{ fontSize: 11.5, color: 'var(--mute)', marginTop: 6 }}>Flashcards hoy</div>
          </div>
        </div>

        {conDatos.length === 0
          ? <p style={{ color: 'var(--mute)', fontSize: 14, textAlign: 'center', padding: '32px 0' }}>Estudia algún tema para ver estadísticas.</p>
          : (
            <div className="card" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 18 }}>
              <div className="eyebrow" style={{ marginBottom: 14 }}>Rendimiento por tema</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {conDatos.map(t => {
                  const color = t.aciertos >= 80 ? 'var(--accent)' : t.aciertos >= 50 ? '#a07a2c' : 'var(--warn)'
                  return (
                    <div key={t.id}>
                      <div className="flex justify-between" style={{ fontSize: 12, color: 'var(--mute)', marginBottom: 5 }}>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: 8 }}>T{t.id} — {t.titulo.slice(0, 28)}</span>
                        <span className="num-display" style={{ flexShrink: 0 }}>🔄×{t.vueltas} · 🎯{t.aciertos}%</span>
                      </div>
                      <div className="bar"><div className="bar-fill" style={{ width: `${t.aciertos}%`, background: color }} /></div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        }
      </main>
    </div>
  )
}
