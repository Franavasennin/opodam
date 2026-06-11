import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useProgress } from '../hooks/useProgress'
import { obtenerTopics } from '../data/topics'
import { responderFlashcard } from '../services/spaced-repetition'
import { obtenerSesionHoy, completarSesionDiaria, calcularDebilidades } from '../services/adaptativo'
import { actualizarRendimientoTema } from '../services/examen'
import type { Flashcard, PreguntaExt } from '../types'
import { getPreguntaCorrecta, getFlashcardFront, getFlashcardBack } from '../types'

type Fase = 'cargando' | 'flashcards' | 'minitest' | 'completada'

const LETRAS = ['A', 'B', 'C', 'D', 'E', 'F']

const topbar: React.CSSProperties = {
  height: 52, borderBottom: '1px solid var(--border-soft)',
  background: 'color-mix(in srgb, var(--bg) 88%, transparent)', backdropFilter: 'blur(12px)',
}

export function SesionDiaria() {
  const navigate = useNavigate()
  const { slug } = useParams<{ slug: string }>()
  const { cargarTema, TEMAS_META } = obtenerTopics(slug ?? 'cgpc')
  const { progreso, refrescar } = useProgress()
  const [fase, setFase] = useState<Fase>('cargando')
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [preguntas, setPreguntas] = useState<PreguntaExt[]>([])
  const [fcIndice, setFcIndice] = useState(0)
  const [fcVerRespuesta, setFcVerRespuesta] = useState(false)
  const [pIndice, setPIndice] = useState(0)
  const [respuestas, setRespuestas] = useState<(number | null)[]>([])
  const [mostrandoExplicacion, setMostrandoExplicacion] = useState(false)

  useEffect(() => {
    async function cargar() {
      const sesion = obtenerSesionHoy()
      if (sesion.completada) { setFase('completada'); return }

      // Cargar flashcards pendientes (en paralelo; se ignoran los temas que fallen)
      const fcs: Flashcard[] = []
      const temasFc = await Promise.all(
        TEMAS_META.map(meta => cargarTema(meta.id).catch(() => null))
      )
      for (const tema of temasFc) {
        if (!tema) continue
        tema.flashcards
          .filter(c => sesion.flashcardIds.includes(c.id))
          .forEach(c => fcs.push(c))
      }

      // Cargar preguntas de temas débiles (hasta 10), en paralelo
      const temasDebiles = calcularDebilidades(progreso.rendimientoPorTema, 3)
      const prgs: PreguntaExt[] = []
      const temasDeb = await Promise.all(
        temasDebiles.map(temaId => cargarTema(temaId).then(tema => ({ temaId, tema })).catch(() => null))
      )
      for (const r of temasDeb) {
        if (!r) continue
        const shuffled = [...r.tema.preguntas].sort(() => Math.random() - 0.5).slice(0, 4)
        shuffled.forEach(p => prgs.push({ ...p, temaId: r.temaId }))
      }
      const pregSel = prgs.slice(0, 10)

      setFlashcards(fcs)
      setPreguntas(pregSel)
      setRespuestas(new Array(pregSel.length).fill(null))
      setFase(fcs.length > 0 ? 'flashcards' : pregSel.length > 0 ? 'minitest' : 'completada')
      if (fcs.length === 0 && pregSel.length === 0) { completarSesionDiaria(); refrescar() }
    }
    cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function responderFC(cal: 'facil' | 'dudoso' | 'dificil') {
    if (flashcards[fcIndice]) responderFlashcard(flashcards[fcIndice].id, cal)
    if (fcIndice + 1 >= flashcards.length) {
      if (preguntas.length > 0) setFase('minitest')
      else { completarSesionDiaria(); refrescar(); setFase('completada') }
    } else {
      setFcIndice(i => i + 1)
      setFcVerRespuesta(false)
    }
  }

  function responderPregunta(opcion: number) {
    setRespuestas(r => { const n = [...r]; n[pIndice] = opcion; return n })
    setMostrandoExplicacion(true)
  }

  function siguientePregunta() {
    setMostrandoExplicacion(false)
    if (pIndice + 1 >= preguntas.length) {
      // Calcular y guardar rendimiento por tema
      const porTema: Record<number, { aciertos: number; errores: number; total: number }> = {}
      preguntas.forEach((p, i) => {
        if (!porTema[p.temaId]) porTema[p.temaId] = { aciertos: 0, errores: 0, total: 0 }
        porTema[p.temaId].total++
        if (respuestas[i] === getPreguntaCorrecta(p)) porTema[p.temaId].aciertos++
        else if (respuestas[i] !== null) porTema[p.temaId].errores++
      })
      Object.entries(porTema).forEach(([id, r]) =>
        actualizarRendimientoTema(Number(id), r.aciertos, r.errores, r.total)
      )
      completarSesionDiaria()
      refrescar()
      setFase('completada')
    } else {
      setPIndice(i => i + 1)
    }
  }

  if (fase === 'cargando') {
    return <div className="min-h-screen flex justify-center py-16" style={{ background: 'var(--bg)', color: 'var(--mute)' }}>Preparando sesión…</div>
  }

  // ── Completada ──
  if (fase === 'completada') {
    const aciertos = preguntas.filter((p, i) => respuestas[i] === getPreguntaCorrecta(p)).length
    return (
      <div className="min-h-screen fade-up flex flex-col items-center justify-center text-center px-4" style={{ background: 'var(--bg)' }}>
        <div style={{ fontSize: 60 }}>🎉</div>
        <h1 className="display" style={{ margin: '12px 0 8px', fontSize: 30 }}>¡Sesión <span className="display-italic" style={{ color: 'var(--accent)' }}>completada!</span></h1>
        {preguntas.length > 0 && (
          <p style={{ fontSize: 14, color: 'var(--ink-soft)', margin: '0 0 4px' }}>
            Mini-test: <span className="num-display" style={{ fontWeight: 600, color: 'var(--accent)' }}>{aciertos}/{preguntas.length}</span> correctas
          </p>
        )}
        <p style={{ fontSize: 13.5, color: 'var(--mute)', margin: 0 }}>
          Racha: <span className="num-display" style={{ fontWeight: 600, color: 'var(--accent)' }}>{progreso.racha.dias} días 🔥</span>
        </p>
        <p style={{ fontSize: 11.5, color: 'var(--mute)', margin: '8px 0 20px' }}>Vuelve mañana para la siguiente sesión</p>
        <button onClick={() => navigate(`/oposicion/${slug}`)} className="btn-editorial btn-acc" style={{ maxWidth: 320, width: '100%' }}>Volver al inicio</button>
      </div>
    )
  }

  // ── Flashcards ──
  if (fase === 'flashcards') {
    const card = flashcards[fcIndice]
    return (
      <div className="min-h-screen fade-up" style={{ background: 'var(--bg)' }}>
        <header className="sticky top-0 z-10 flex items-center gap-3 px-4" style={topbar}>
          <span style={{ fontWeight: 600, fontSize: 14, letterSpacing: '-0.01em' }}>⚡ Sesión de hoy</span>
          <span className="num-display" style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--mute)' }}>FC {fcIndice + 1}/{flashcards.length}</span>
        </header>
        <main className="max-w-2xl mx-auto px-4 pt-4 pb-12" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div onClick={() => setFcVerRespuesta(true)} className="card"
            style={{ minHeight: 200, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--ink)', lineHeight: 1.4 }}>{getFlashcardFront(card)}</p>
            {!fcVerRespuesta
              ? <p style={{ fontSize: 12, color: 'var(--mute)', marginTop: 16 }}>Toca para ver la respuesta</p>
              : <p style={{ fontSize: 14, color: 'var(--accent)', fontWeight: 600, marginTop: 16, borderTop: '1px solid var(--border-soft)', paddingTop: 16, width: '100%' }}>{getFlashcardBack(card)}</p>
            }
          </div>
          {fcVerRespuesta && (
            <div className="grid grid-cols-3 gap-2">
              {(['dificil', 'dudoso', 'facil'] as const).map(cal => {
                const color = cal === 'dificil' ? 'var(--warn)' : cal === 'dudoso' ? '#a07a2c' : 'var(--accent)'
                return (
                  <button key={cal} onClick={() => responderFC(cal)}
                    style={{ padding: '10px 0', borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: `1px solid ${color}`, color, background: 'transparent' }}>
                    {cal === 'dificil' ? '😓 Difícil' : cal === 'dudoso' ? '🤔 Dudoso' : '😊 Fácil'}
                  </button>
                )
              })}
            </div>
          )}
          {preguntas.length > 0 && (
            <button onClick={() => setFase('minitest')} style={{ width: '100%', background: 'none', border: 0, cursor: 'pointer', fontSize: 12, color: 'var(--mute)', textDecoration: 'underline' }}>
              Saltar a mini-test →
            </button>
          )}
        </main>
      </div>
    )
  }

  // ── Mini-test ──
  const p = preguntas[pIndice]
  const respActual = respuestas[pIndice]
  return (
    <div className="min-h-screen fade-up" style={{ background: 'var(--bg)' }}>
      <header className="sticky top-0 z-10 flex items-center gap-3 px-4" style={topbar}>
        <span style={{ fontWeight: 600, fontSize: 14, letterSpacing: '-0.01em' }}>⚡ Mini-test</span>
        <span className="num-display" style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--mute)' }}>{pIndice + 1}/{preguntas.length}</span>
      </header>
      <main className="max-w-2xl mx-auto px-4 pt-4 pb-12">
        <div className="card" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 16 }}>
          <p style={{ margin: '0 0 12px', fontSize: 14.5, fontWeight: 600, color: 'var(--ink)', lineHeight: 1.4 }}>{p.enunciado}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {p.opciones.map((op, j) => {
              let extra: React.CSSProperties = {}
              if (mostrandoExplicacion) {
                if (j === getPreguntaCorrecta(p)) extra = { borderColor: 'var(--accent)', background: 'var(--accent-soft)', color: 'var(--accent)' }
                else if (j === respActual) extra = { borderColor: 'var(--warn)', background: 'var(--warn-soft)', color: 'var(--warn)' }
              } else if (respActual === j) {
                extra = { borderColor: 'var(--accent)', background: 'var(--accent-soft)', color: 'var(--accent)' }
              }
              const activo = extra.color != null
              const detalle = p.explicaciones?.[j]
              const esCorr = j === getPreguntaCorrecta(p)
              const esEleg = j === respActual
              return (
                <div key={j} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <button type="button" className="opt" disabled={mostrandoExplicacion} onClick={() => responderPregunta(j)} style={extra}>
                    <span style={{ width: 22, height: 22, flexShrink: 0, borderRadius: 6, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: activo ? 'var(--accent-ink)' : 'var(--mute)', background: activo ? (extra.borderColor as string) : 'var(--surface)', border: `1px solid ${activo ? (extra.borderColor as string) : 'var(--border)'}` }}>{LETRAS[j] ?? j + 1}</span>
                    <span>{op}{mostrandoExplicacion && esEleg && <span style={{ marginLeft: 6, fontSize: 11, opacity: 0.85 }}>· tu respuesta</span>}</span>
                  </button>
                  {mostrandoExplicacion && detalle && (
                    <p style={{ margin: '0 0 0 4px', fontSize: 11.5, color: esCorr ? 'var(--accent)' : esEleg ? 'var(--warn)' : 'var(--mute)', fontStyle: 'italic', lineHeight: 1.45 }}>{detalle}</p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
        {mostrandoExplicacion && (
          <>
            <div className="card" style={{ marginTop: 14, background: 'var(--accent-soft)', border: '1px solid var(--border-soft)', borderRadius: 14, padding: 14 }}>
              <p style={{ margin: 0, fontSize: 12.5, color: 'var(--ink-soft)', lineHeight: 1.5 }}>{p.explicacion}</p>
            </div>
            <button onClick={siguientePregunta} className="btn-editorial btn-acc" style={{ width: '100%', marginTop: 14 }}>
              {pIndice + 1 < preguntas.length ? 'Siguiente →' : 'Finalizar sesión'}
            </button>
          </>
        )}
      </main>
    </div>
  )
}
