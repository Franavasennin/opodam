import { useParams, useNavigate } from 'react-router-dom'
import { useProgress } from '../hooks/useProgress'
import { obtenerTopics } from '../data/topics'
import { PanelDebilidades } from '../components/ui/PanelDebilidades'
import { flashcardsPendientesHoy } from '../services/spaced-repetition'
import { retencionMediaGlobal, dominioTema } from '../services/dominio'
import { tasaFalsosSeguros, totalConfianza } from '../services/calibracion'
import {
  cobertura, evolucionNotas, calcularPrediccion, planSemana,
  diasDesdeUltimoSimulacro, type Semaforo,
} from '../services/prediccion'
import { puntosTiempoAcierto, temasRelecturaPasiva } from '../services/tiempo'

const topbar: React.CSSProperties = {
  height: 52, borderBottom: '1px solid var(--border-soft)',
  background: 'color-mix(in srgb, var(--bg) 88%, transparent)', backdropFilter: 'blur(12px)',
}

const SEM_COLOR: Record<Semaforo, string> = { verde: 'var(--accent)', ambar: '#a07a2c', rojo: 'var(--warn)' }
const SEM_TEXTO: Record<Semaforo, string> = {
  verde: 'Vas encaminado. Mantén el ritmo.',
  ambar: 'Vas a medias. Aprieta la cobertura y los repasos.',
  rojo: 'Aún lejos. Prioriza temario y simulacros.',
}

export function Estadisticas() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { TEMAS_META } = obtenerTopics(slug ?? 'cgpc')
  const { progreso } = useProgress()
  const horas = Math.floor(progreso.tiempoTotalSegundos / 3600)
  const mins  = Math.floor((progreso.tiempoTotalSegundos % 3600) / 60)
  const retencion = retencionMediaGlobal(progreso.temas ?? {})
  const cal = progreso.calibracion ?? { seguroAcierto: 0, seguroFallo: 0, dudoAcierto: 0, dudoFallo: 0 }
  const falsosSeguros = tasaFalsosSeguros(cal)

  // ── P2.3 Predicción honesta + plan de la semana ──────────────
  const idsTemas = TEMAS_META.map(m => m.id)
  const coberturaPct = cobertura(progreso.temas ?? {}, idsTemas)
  const prediccion = calcularPrediccion(progreso.historialExamenes ?? [], coberturaPct, retencion)
  const evolucion = evolucionNotas(progreso.historialExamenes ?? [])

  // Peor tema entre los iniciados (menor dominio P1.3) para el plan de la semana.
  const peorTema = TEMAS_META
    .map(m => ({ id: m.id, titulo: m.titulo, dom: dominioTema(progreso.temas?.[String(m.id)]) }))
    .filter(t => (progreso.temas?.[String(t.id)]?.vueltas ?? 0) > 0)
    .sort((a, b) => a.dom - b.dom)[0] ?? null
  const acciones = planSemana({
    peorTema: peorTema ? { id: peorTema.id, titulo: peorTema.titulo.slice(0, 32) } : null,
    flashcardsPendientes: flashcardsPendientesHoy(progreso.flashcards).length,
    diasDesdeUltimoSimulacro: diasDesdeUltimoSimulacro(progreso.historialExamenes ?? []),
    coberturaPct,
  })

  // P2.4: tiempo por tema vs acierto (detección de relectura pasiva).
  const puntosTiempo = puntosTiempoAcierto(progreso.temas ?? {}, progreso.tiempoPorTema ?? {}, TEMAS_META)
  const relecturaPasiva = temasRelecturaPasiva(puntosTiempo)
  const maxMin = Math.max(1, ...puntosTiempo.map(p => p.minutos))

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

        {prediccion.fiable && (
          <div className="card" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 18 }}>
            <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
              <div className="eyebrow">🔮 Nota proyectada</div>
              <span style={{ fontSize: 11, color: SEM_COLOR[prediccion.semaforo] }}>●</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="num-display" style={{ fontSize: 40, lineHeight: 1, color: SEM_COLOR[prediccion.semaforo] }}>{prediccion.nota.toFixed(1)}</span>
              <span style={{ fontSize: 14, color: 'var(--mute)' }}>± {prediccion.banda.toFixed(1)}</span>
            </div>
            <p style={{ fontSize: 12.5, color: 'var(--ink)', margin: '8px 0 0' }}>{SEM_TEXTO[prediccion.semaforo]}</p>
            <p style={{ fontSize: 11, color: 'var(--mute)', margin: '6px 0 0' }}>
              Estimación orientativa sobre {prediccion.nSimulacros} simulacro{prediccion.nSimulacros === 1 ? '' : 's'} (media {prediccion.base.toFixed(1)}),
              cobertura {prediccion.coberturaPct}% del temario y retención {prediccion.retencionPct}%. No es una promesa de aprobado.
            </p>

            {evolucion.length >= 2 && (
              <div style={{ marginTop: 14 }}>
                <div className="eyebrow" style={{ marginBottom: 8 }}>Evolución de nota</div>
                <svg viewBox="0 0 300 70" preserveAspectRatio="none" style={{ width: '100%', height: 70, display: 'block' }}>
                  <line x1="0" y1={70 - (5 / 10) * 70} x2="300" y2={70 - (5 / 10) * 70} stroke="var(--border)" strokeWidth="1" strokeDasharray="3 3" />
                  <polyline
                    fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"
                    points={evolucion.map((e, i) => {
                      const x = evolucion.length === 1 ? 150 : (i / (evolucion.length - 1)) * 300
                      const y = 70 - (Math.max(0, Math.min(10, e.nota)) / 10) * 70
                      return `${x},${y}`
                    }).join(' ')}
                  />
                  {evolucion.map((e, i) => {
                    const x = evolucion.length === 1 ? 150 : (i / (evolucion.length - 1)) * 300
                    const y = 70 - (Math.max(0, Math.min(10, e.nota)) / 10) * 70
                    return <circle key={i} cx={x} cy={y} r="2.5" fill="var(--accent)" />
                  })}
                </svg>
                <div className="flex justify-between" style={{ fontSize: 10.5, color: 'var(--mute)', marginTop: 4 }}>
                  <span>{evolucion[0].fecha.slice(5)}</span>
                  <span style={{ color: 'var(--border-strong, var(--mute))' }}>línea de aprobado (5,0)</span>
                  <span>{evolucion[evolucion.length - 1].fecha.slice(5)}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {acciones.length > 0 && (
          <div className="card" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 18 }}>
            <div className="eyebrow" style={{ marginBottom: 12 }}>📅 Tu plan de esta semana</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {acciones.map((a, i) => (
                <button
                  key={i}
                  onClick={() => a.ruta && navigate(`/oposicion/${slug}/${a.ruta}`)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left', width: '100%',
                    background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 12,
                    padding: '11px 13px', cursor: a.ruta ? 'pointer' : 'default', color: 'var(--ink)', fontSize: 13,
                  }}
                >
                  <span style={{ fontSize: 17, flexShrink: 0 }}>{a.icono}</span>
                  <span style={{ flex: 1 }}>{a.texto}</span>
                  {a.ruta && <span style={{ color: 'var(--mute)', flexShrink: 0 }}>→</span>}
                </button>
              ))}
            </div>
          </div>
        )}

        {puntosTiempo.length > 0 && (
          <div className="card" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 18 }}>
            <div className="eyebrow" style={{ marginBottom: 12 }}>⏱️ Tiempo vs acierto por tema</div>
            <svg viewBox="0 0 300 160" style={{ width: '100%', height: 160, display: 'block' }}>
              {/* ejes */}
              <line x1="30" y1="6" x2="30" y2="138" stroke="var(--border)" strokeWidth="1" />
              <line x1="30" y1="138" x2="294" y2="138" stroke="var(--border)" strokeWidth="1" />
              <line x1="30" y1={6 + (1 - 0.5) * 132} x2="294" y2={6 + (1 - 0.5) * 132} stroke="var(--border)" strokeWidth="1" strokeDasharray="3 3" />
              {puntosTiempo.map(p => {
                const x = 30 + (p.minutos / maxMin) * 258
                const y = 6 + (1 - p.aciertos / 100) * 132
                return (
                  <g key={p.id}>
                    <circle cx={x} cy={y} r={p.alerta ? 5 : 4} fill={p.alerta ? 'var(--warn)' : p.medido ? 'var(--accent)' : 'var(--mute)'} opacity={p.medido ? 0.9 : 0.5} />
                    <text x={x} y={y - 7} fontSize="8" textAnchor="middle" fill="var(--mute)">{p.id}</text>
                  </g>
                )
              })}
              <text x="2" y="12" fontSize="8" fill="var(--mute)">100%</text>
              <text x="6" y="140" fontSize="8" fill="var(--mute)">0%</text>
              <text x="280" y="150" fontSize="8" fill="var(--mute)">min</text>
            </svg>
            {relecturaPasiva.length > 0 ? (
              <p style={{ fontSize: 11.5, color: 'var(--warn)', margin: '8px 0 0' }}>
                ⚠️ {relecturaPasiva.length === 1 ? 'El tema' : 'Los temas'} <b>{relecturaPasiva.map(p => `T${p.id}`).join(', ')}</b>: mucho tiempo y poco acierto. Cambia de método — haz test ANTES de releer.
              </p>
            ) : (
              <p style={{ fontSize: 11.5, color: 'var(--mute)', margin: '8px 0 0' }}>
                Cada punto es un tema. Abajo-derecha (mucho tiempo, poco acierto) = relectura pasiva: cámbialo por tests.
              </p>
            )}
          </div>
        )}

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

        {retencion > 0 && (
          <div className="card" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 18 }}>
            <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
              <div className="eyebrow">🧠 Retención media</div>
              <span className="num-display" style={{ fontSize: 22, color: retencion >= 70 ? 'var(--accent)' : retencion >= 40 ? '#a07a2c' : 'var(--warn)' }}>{retencion}%</span>
            </div>
            <div className="bar"><div className="bar-fill" style={{ width: `${retencion}%`, background: retencion >= 70 ? 'var(--accent)' : retencion >= 40 ? '#a07a2c' : 'var(--warn)' }} /></div>
            <p style={{ fontSize: 11.5, color: 'var(--mute)', margin: '10px 0 0' }}>
              Estimación de cuánto recuerdas de lo estudiado según el tiempo desde tu última revisión. Repasar a tiempo la sube.
            </p>
          </div>
        )}

        {totalConfianza(cal) >= 5 && (
          <div className="card" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 18 }}>
            <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
              <div className="eyebrow">🎯 Calibración</div>
              <span className="num-display" style={{ fontSize: 22, color: falsosSeguros > 20 ? 'var(--warn)' : falsosSeguros > 0 ? '#a07a2c' : 'var(--accent)' }}>{falsosSeguros}%</span>
            </div>
            <div className="grid grid-cols-2 gap-2" style={{ fontSize: 11.5 }}>
              <div style={{ color: 'var(--warn)' }}>⚠️ Seguro + fallo: <b>{cal.seguroFallo}</b></div>
              <div style={{ color: 'var(--accent)' }}>✔️ Seguro + acierto: <b>{cal.seguroAcierto}</b></div>
              <div style={{ color: 'var(--mute)' }}>🤔 Dudo + fallo: <b>{cal.dudoFallo}</b></div>
              <div style={{ color: 'var(--mute)' }}>🤔 Dudo + acierto: <b>{cal.dudoAcierto}</b></div>
            </div>
            <p style={{ fontSize: 11.5, color: 'var(--mute)', margin: '10px 0 0' }}>
              "Falsos seguros" = preguntas que creías dominar y fallaste. Cuanto más baja la cifra, mejor te conoces.
            </p>
          </div>
        )}

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
