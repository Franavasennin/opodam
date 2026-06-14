import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useProgress } from '../hooks/useProgress'
import { calcularPuntuacionTest } from '../services/progress'
import { actualizarRendimientoTema } from '../services/examen'
import { registrarLote, contarErrores } from '../services/errores'
import { registrarCalibracion } from '../services/calibracion'
import { elegirTemasMezcla, intercalarPreguntas } from '../services/mezcla'
import { cargarBancoActivo, fusionarBanco } from '../services/banco'
import { getPenalizacion, describirPenalizacion, consejoEstrategia } from '../services/nota'
import { obtenerTopics } from '../data/topics'
import type { Tema, Pregunta, Confianza } from '../types'
import { getPreguntaCorrecta } from '../types'

type PreguntaExt = Pregunta & { temaId: number }
function barajar<T>(a: T[]): T[] { return [...a].sort(() => Math.random() - 0.5) }
const ID_MEZCLA = -1

const LETRAS = ['A', 'B', 'C', 'D', 'E', 'F']

import { TestTopbar } from '../components/test/Shared'

export function Tests() {
  const navigate = useNavigate()
  const { slug } = useParams<{ slug: string }>()
  const { guardarTest, progreso } = useProgress()
  const { cargarTema, TEMAS_META } = obtenerTopics(slug ?? 'cgpc')
  const [temaId, setTemaId] = useState<number | null>(null)
  const [tema, setTema] = useState<Tema | null>(null)
  const [respuestas, setRespuestas] = useState<(number | null)[]>([])
  const [confianza, setConfianza] = useState<(Confianza | null)[]>([])
  const [enviado, setEnviado] = useState(false)
  // P2.5: modo Mezcla. Cuando está activo, `tema` es un tema sintético con
  // preguntas de varios temas (cada una etiquetada con su temaId real).
  const esMezcla = temaId === ID_MEZCLA

  useEffect(() => {
    if (temaId === null || temaId === ID_MEZCLA) return
    cargarTema(temaId).then(async t => {
      // P2.1: fusiona las preguntas locales con el banco activo de Supabase
      // (preguntas nuevas auditadas) para no repetir contenido en 3ª+ vuelta.
      const banco = await cargarBancoActivo(slug ?? 'cgpc', temaId)
      const preguntas = banco.length ? fusionarBanco(t.preguntas, banco) : t.preguntas
      setTema({ ...t, preguntas })
      setRespuestas(new Array(preguntas.length).fill(null))
      setConfianza(new Array(preguntas.length).fill(null))
      setEnviado(false)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [temaId])

  async function iniciarMezcla() {
    const { ids } = elegirTemasMezcla(progreso.temas ?? {}, TEMAS_META.map(m => m.id))
    if (ids.length === 0) return
    const grupos = await Promise.all(
      ids.map(id => cargarTema(id)
        .then(t => ({ temaId: id, preguntas: barajar(t.preguntas) }))
        .catch(() => ({ temaId: id, preguntas: [] as Pregunta[] })))
    )
    const pool = barajar(intercalarPreguntas(grupos, 15)) as PreguntaExt[]
    setTema({ id: ID_MEZCLA, titulo: '🔀 Mezcla inteligente', bloque: '', secciones: [], esquemas: [], mapaMental: { nodos: [] }, flashcards: [], preguntas: pool } as unknown as Tema)
    setRespuestas(new Array(pool.length).fill(null))
    setConfianza(new Array(pool.length).fill(null))
    setEnviado(false)
    setTemaId(ID_MEZCLA)
  }

  const nErrores = contarErrores()
  const pen = getPenalizacion(slug ?? 'cgpc')
  const temasEstudiados = TEMAS_META.filter(m => (progreso.temas?.[String(m.id)]?.vueltas ?? 0) > 0).length

  // ── Selección de tema ──
  if (temaId === null) return (
    <div className="min-h-screen fade-up" style={{ background: 'var(--bg)' }}>
      <TestTopbar title="Tests y simulacros" onBack={() => navigate(`/oposicion/${slug}`)} />
      <main className="max-w-2xl mx-auto px-4 pt-4 pb-12">
        <div className="eyebrow" style={{ marginBottom: 10 }}>Practica preguntas</div>
        <h1 className="display" style={{ margin: '0 0 18px', fontSize: 30, letterSpacing: '-0.015em' }}>
          Elige un tema o haz un <span className="display-italic" style={{ color: 'var(--accent)' }}>simulacro.</span>
        </h1>
        <button onClick={() => navigate(`/oposicion/${slug}/tests/simulacro`)} className="hero" style={{ width: '100%', textAlign: 'left', border: 0, cursor: 'pointer', marginBottom: 18 }}>
          <div className="hero-grain" />
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ fontSize: 26 }}>🎯</span>
            <div style={{ flex: 1 }}>
              <div className="display" style={{ fontSize: 20 }}>Simulacro completo</div>
              <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>Examen cronometrado con preguntas de todos los temas</div>
            </div>
            <span style={{ opacity: 0.7 }}>›</span>
          </div>
        </button>
        {temasEstudiados >= 2 && (
          <button onClick={iniciarMezcla} className="card"
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '13px 14px', textAlign: 'left', cursor: 'pointer', background: 'var(--surface)', border: '1px solid var(--accent)', borderRadius: 14, marginBottom: 18 }}>
            <span style={{ fontSize: 22 }}>🔀</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>Mezcla inteligente</div>
              <div style={{ fontSize: 12, color: 'var(--mute)', marginTop: 2 }}>15 preguntas de varios temas (débil · en riesgo · dominado) — como el examen real</div>
            </div>
            <span style={{ color: 'var(--accent)', fontSize: 16 }}>›</span>
          </button>
        )}
        {nErrores > 0 && (
          <button onClick={() => navigate(`/oposicion/${slug}/repaso-errores`)} className="card"
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '13px 14px', textAlign: 'left', cursor: 'pointer', background: 'var(--surface)', border: '1px solid var(--warn)', borderRadius: 14, marginBottom: 18 }}>
            <span style={{ fontSize: 22 }}>🩹</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>Repasar mis fallos</div>
              <div style={{ fontSize: 12, color: 'var(--mute)', marginTop: 2 }}>{nErrores} {nErrores === 1 ? 'pregunta pendiente' : 'preguntas pendientes'} · acierta 2 veces para graduarla</div>
            </div>
            <span style={{ color: 'var(--warn)', fontSize: 16 }}>›</span>
          </button>
        )}
        <div className="stagger" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {TEMAS_META.map(m => (
            <button key={m.id} onClick={() => setTemaId(m.id)} className="card"
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '13px 14px', textAlign: 'left', cursor: 'pointer', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14 }}>
              <span className="num-display" style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--surface-2)', border: '1px solid var(--border-soft)', color: 'var(--ink-soft)', fontSize: 17, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{m.id}</span>
              <span style={{ flex: 1, minWidth: 0, fontSize: 13.5, fontWeight: 600, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.titulo}</span>
              <span style={{ color: 'var(--mute)', fontSize: 16 }}>›</span>
            </button>
          ))}
        </div>
      </main>
    </div>
  )

  if (!tema) return <div className="min-h-screen flex justify-center py-16" style={{ background: 'var(--bg)', color: 'var(--mute)' }}>Cargando…</div>

  const aciertos = respuestas.filter((r, i) => r === getPreguntaCorrecta(tema.preguntas[i])).length
  const errores  = respuestas.filter((r, i) => r !== null && r !== getPreguntaCorrecta(tema.preguntas[i])).length
  // P1.5: calibración de este test (solo preguntas con confianza declarada)
  const seguroFallo = respuestas.filter((r, i) => confianza[i] === 'seguro' && r !== getPreguntaCorrecta(tema.preguntas[i])).length
  const conConfianza = confianza.filter(c => c !== null).length

  function enviar() {
    // temaId real por pregunta (en mezcla viene en la propia pregunta).
    const idDe = (p: Pregunta) => (p as PreguntaExt).temaId ?? tema!.id
    const items = tema!.preguntas.map((p, i) => ({
      id: p.id,
      temaId: idDe(p),
      acierto: respuestas[i] === getPreguntaCorrecta(p),
      confianza: confianza[i] ?? undefined,
    }))
    if (esMezcla) {
      // Registra el rendimiento en cada tema real (sin tocar vueltas/porcentaje).
      const porTema = new Map<number, { ac: number; er: number; tot: number }>()
      tema!.preguntas.forEach((p, i) => {
        const id = idDe(p)
        const acc = porTema.get(id) ?? { ac: 0, er: 0, tot: 0 }
        acc.tot += 1
        if (respuestas[i] === getPreguntaCorrecta(p)) acc.ac += 1
        else if (respuestas[i] !== null) acc.er += 1
        porTema.set(id, acc)
      })
      porTema.forEach((v, id) => actualizarRendimientoTema(id, v.ac, v.er, v.tot))
    } else {
      guardarTest(tema!.id, aciertos, errores, tema!.preguntas.length)
    }
    registrarLote(items)
    registrarCalibracion(items)
    setEnviado(true)
  }

  // ── Resultado ──
  if (enviado) return (
    <div className="min-h-screen fade-up" style={{ background: 'var(--bg)' }}>
      <TestTopbar title="Resultado" onBack={() => setTemaId(null)} />
      <main className="max-w-2xl mx-auto px-4 pt-4 pb-12" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="card" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, padding: 24, textAlign: 'center' }}>
          <div className="eyebrow" style={{ marginBottom: 6 }}>Nota equivalente</div>
          <div className="num-display" style={{ fontSize: 56, color: 'var(--accent)', lineHeight: 1 }}>
            {calcularPuntuacionTest(aciertos, errores, tema.preguntas.length, pen).toFixed(2)}
          </div>
          <div style={{ fontSize: 12, color: 'var(--mute)', marginTop: 4 }}>sobre 10 · {describirPenalizacion(pen)}</div>
          <div style={{ fontSize: 13.5, color: 'var(--ink-soft)', marginTop: 12 }}>✅ {aciertos} aciertos · ❌ {errores} errores</div>
        </div>
        {errores > 0 && (
          <div className="card" style={{ background: 'var(--accent-soft)', border: '1px solid var(--accent)', borderRadius: 14, padding: '12px 14px', fontSize: 12.5, color: 'var(--accent)' }}>
            💡 {consejoEstrategia(pen)}
          </div>
        )}
        {seguroFallo > 0 && (
          <div className="card" style={{ background: 'var(--warn-soft)', border: '1px solid var(--warn)', borderRadius: 14, padding: '12px 14px', fontSize: 12.5, color: 'var(--warn)' }}>
            ⚠️ <strong>Ilusión de saber:</strong> {seguroFallo} {seguroFallo === 1 ? 'pregunta que marcaste "Seguro" y fallaste' : 'preguntas que marcaste "Seguro" y fallaste'}. Son las más peligrosas en el examen — entran al cuaderno con prioridad.
          </div>
        )}
        {conConfianza > 0 && seguroFallo === 0 && (
          <div className="card" style={{ background: 'var(--accent-soft)', border: '1px solid var(--accent)', borderRadius: 14, padding: '12px 14px', fontSize: 12.5, color: 'var(--accent)' }}>
            ✅ Buena calibración: no fallaste ninguna de las que marcaste "Seguro".
          </div>
        )}
        {tema.preguntas.map((p, i) => {
          const ok = respuestas[i] === getPreguntaCorrecta(p)
          return (
            <div key={i} className="card" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 16, borderLeft: `3px solid ${ok ? 'var(--accent)' : 'var(--warn)'}` }}>
              <p style={{ margin: 0, fontSize: 13.5, fontWeight: 600, color: 'var(--ink)' }}>{p.enunciado}</p>
              <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--accent)' }}>Correcta: {p.opciones[getPreguntaCorrecta(p)]}</p>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--mute)', fontStyle: 'italic' }}>{p.explicacion}</p>
            </div>
          )
        })}
        {errores > 0 && (
          <button onClick={() => navigate(`/oposicion/${slug}/repaso-errores`)} className="btn-editorial btn-acc" style={{ width: '100%' }}>
            🩹 Repasar mis fallos ahora
          </button>
        )}
        <button onClick={() => setTemaId(null)} className="btn-editorial btn-sec" style={{ width: '100%' }}>Volver</button>
      </main>
    </div>
  )

  // ── Preguntas ──
  return (
    <div className="min-h-screen fade-up" style={{ background: 'var(--bg)' }}>
      <TestTopbar 
        title={<span style={{ fontWeight: 600, fontSize: 13.5, letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tema.titulo}</span>}
        onBack={() => setTemaId(null)} 
      />
      <main className="max-w-2xl mx-auto px-4 pt-4 pb-12" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {tema.preguntas.map((p, i) => (
          <div key={i} className="card" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 16 }}>
            <p style={{ margin: '0 0 10px', fontSize: 14.5, fontWeight: 600, color: 'var(--ink)', lineHeight: 1.4 }}>
              <span className="num-display" style={{ color: 'var(--mute)', marginRight: 6 }}>{i + 1}.</span>{p.enunciado}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {p.opciones.map((op, j) => {
                const sel = respuestas[i] === j
                return (
                  <button key={j} type="button" className="opt" onClick={() => setRespuestas(r => { const n = [...r]; n[i] = j; return n })}
                    style={sel ? { borderColor: 'var(--accent)', background: 'var(--accent-soft)', color: 'var(--accent)' } : undefined}>
                    <span style={{ width: 22, height: 22, flexShrink: 0, borderRadius: 6, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: sel ? 'var(--accent-ink)' : 'var(--mute)', background: sel ? 'var(--accent)' : 'var(--surface)', border: `1px solid ${sel ? 'var(--accent)' : 'var(--border)'}` }}>{LETRAS[j] ?? j + 1}</span>
                    <span>{op}</span>
                  </button>
                )
              })}
            </div>
            {respuestas[i] !== null && (
              <div className="flex items-center gap-2" style={{ marginTop: 10 }}>
                <span style={{ fontSize: 11.5, color: 'var(--mute)' }}>¿Cómo de seguro?</span>
                {(['seguro', 'dudo'] as const).map(c => {
                  const activo = confianza[i] === c
                  const color = c === 'seguro' ? 'var(--accent)' : '#a07a2c'
                  return (
                    <button key={c} type="button" onClick={() => setConfianza(prev => { const n = [...prev]; n[i] = c; return n })}
                      style={{ fontSize: 11.5, fontWeight: 600, cursor: 'pointer', borderRadius: 999, padding: '3px 12px', border: `1px solid ${activo ? color : 'var(--border)'}`, color: activo ? color : 'var(--mute)', background: activo ? 'color-mix(in srgb, ' + color + ' 12%, transparent)' : 'transparent' }}>
                      {c === 'seguro' ? '✔️ Seguro' : '🤔 Dudo'}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        ))}
        <button onClick={enviar} disabled={respuestas.some(r => r === null)} className="btn-editorial btn-acc" style={{ width: '100%', opacity: respuestas.some(r => r === null) ? 0.4 : 1 }}>
          Enviar respuestas
        </button>
      </main>
    </div>
  )
}
