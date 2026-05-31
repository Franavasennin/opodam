import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { OPOSICIONES } from '../data/oposiciones'
import { buscar } from '../services/retrieval'
import { preguntarTutor, type MensajeTutor, type ContextoTema } from '../services/tutor'
import { cargarHistorialGlobal, guardarHistorialGlobal } from '../services/tutorHistorial'
import { generarTestDuda, generarFlashcardsDuda, type FlashcardGenerada } from '../services/practica'
import { MotorTest, type PreguntaTest } from '../components/test/MotorTest'

const topbar: React.CSSProperties = {
  height: 52, borderBottom: '1px solid var(--border-soft)',
  background: 'color-mix(in srgb, var(--bg) 88%, transparent)', backdropFilter: 'blur(12px)',
}

interface Fuente { temaId: number; titulo: string }
interface Msg { role: 'user' | 'assistant'; content: string; fuentes?: Fuente[] }

export default function TutorGlobal() {
  const navigate = useNavigate()
  const { slug } = useParams<{ slug: string }>()
  const oposicion = OPOSICIONES.find(op => op.slug === slug)
  const nombre = oposicion?.nombre ?? 'tu oposición'

  const [mensajes, setMensajes] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const finRef = useRef<HTMLDivElement | null>(null)

  const [ultimaDuda, setUltimaDuda] = useState('')
  const [ultimoContexto, setUltimoContexto] = useState('')
  const [accionCargando, setAccionCargando] = useState<null | 'test' | 'flashcards' | 'resumen'>(null)
  const [testPreguntas, setTestPreguntas] = useState<PreguntaTest[] | null>(null)
  const [flashcards, setFlashcards] = useState<FlashcardGenerada[] | null>(null)

  useEffect(() => { finRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [mensajes, cargando])

  useEffect(() => {
    if (!slug) return
    cargarHistorialGlobal(slug).then(hist => {
      if (hist.length) setMensajes(hist.map(m => ({ role: m.role, content: m.content })))
    })
  }, [slug])

  async function enviar() {
    const texto = input.trim()
    if (!texto || cargando || !slug) return
    setError(null)
    const previos: Msg[] = [...mensajes, { role: 'user', content: texto }]
    setMensajes(previos)
    setInput('')
    setCargando(true)

    // 1) Recuperar fragmentos relevantes de TODA la oposición
    const hits = await buscar(slug, texto, 6)
    const fuentes: Fuente[] = []
    for (const h of hits) {
      if (!fuentes.some(f => f.temaId === h.temaId)) fuentes.push({ temaId: h.temaId, titulo: h.titulo })
    }

    const contextoTexto = hits.map(h => `Tema ${h.temaId} · ${h.titulo}\n${h.texto}`).join('\n\n')
    setUltimaDuda(texto)
    setUltimoContexto(contextoTexto)

    // 2) Construir contexto con los fragmentos y llamar al tutor existente
    const contexto: ContextoTema = {
      oposicion: slug,
      temaId: 0,
      titulo: `Tutor de ${nombre}`,
      secciones: hits.map(h => ({ titulo: `Tema ${h.temaId} · ${h.titulo}`, contenido: h.texto })),
      flashcards: [],
      preguntas: [],
    }
    const historial: MensajeTutor[] = previos.map(m => ({ role: m.role, content: m.content }))
    const { content, error: err } = await preguntarTutor(historial, contexto)
    setCargando(false)
    if (err || !content) { setError('No se pudo contactar con el tutor, inténtalo de nuevo.'); return }
    const nuevos: Msg[] = [...previos, { role: 'assistant', content, fuentes }]
    setMensajes(nuevos)
    if (slug) guardarHistorialGlobal(slug, nuevos.map(m => ({ role: m.role, content: m.content })))
  }

  async function accionTest() {
    if (!ultimaDuda || accionCargando) return
    setAccionCargando('test'); setError(null)
    const { preguntas, error: err } = await generarTestDuda(ultimaDuda, ultimoContexto)
    setAccionCargando(null)
    if (err || !preguntas.length) { setError('No se pudo generar, inténtalo de nuevo.'); return }
    setTestPreguntas(preguntas)
  }
  async function accionFlashcards() {
    if (!ultimaDuda || accionCargando) return
    setAccionCargando('flashcards'); setError(null)
    const { flashcards: fc, error: err } = await generarFlashcardsDuda(ultimaDuda, ultimoContexto)
    setAccionCargando(null)
    if (err || !fc.length) { setError('No se pudo generar, inténtalo de nuevo.'); return }
    setFlashcards(fc)
  }
  async function accionResumen() {
    if (accionCargando || cargando) return
    setAccionCargando('resumen'); setError(null)
    const historial: MensajeTutor[] = [
      ...mensajes.map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: 'Resume tu última respuesta en 3-4 puntos clave, en formato lista.' },
    ]
    const contexto: ContextoTema = {
      oposicion: slug!,
      temaId: 0,
      titulo: `Tutor de ${nombre}`,
      secciones: [],
      flashcards: [],
      preguntas: [],
    }
    const { content, error: err } = await preguntarTutor(historial, contexto)
    setAccionCargando(null)
    if (err || !content) { setError('No se pudo generar el resumen.'); return }
    setMensajes(prev => [...prev, { role: 'assistant', content }])
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar() }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>
      <header className="sticky top-0 z-10 flex items-center gap-3 px-4" style={topbar}>
        <button onClick={() => navigate(`/oposicion/${slug}`)} style={{ background: 'none', border: 0, cursor: 'pointer', color: 'var(--ink)', fontSize: 16 }}>←</button>
        <span style={{ fontWeight: 600, fontSize: 14, letterSpacing: '-0.01em' }}>Tutor</span>
        <span className="num-display" style={{ fontSize: 11.5, color: 'var(--mute)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>· {nombre}</span>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-4">
        <div className="max-w-2xl mx-auto" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {mensajes.length === 0 && !cargando && (
            <div className="card" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 16 }}>
              <p style={{ margin: '0 0 4px', fontSize: 13.5, fontWeight: 600, color: 'var(--ink)' }}>Hola, soy tu tutor 👨‍🏫</p>
              <p style={{ margin: 0, fontSize: 12.5, color: 'var(--mute)', lineHeight: 1.5 }}>
                Pregúntame cualquier duda de <strong>todo el temario</strong> de {nombre}. Busco la respuesta en los temas y te digo de cuál sale.
              </p>
            </div>
          )}
          {mensajes.map((m, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <div style={m.role === 'user'
                ? { maxWidth: '85%', borderRadius: 16, background: 'var(--accent)', color: 'var(--accent-ink)', padding: '10px 14px', fontSize: 13.5, whiteSpace: 'pre-wrap', lineHeight: 1.45 }
                : { maxWidth: '85%', borderRadius: 16, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--ink-soft)', padding: '10px 14px', fontSize: 13.5, whiteSpace: 'pre-wrap', lineHeight: 1.45 }}>
                {m.content}
              </div>
              {m.fuentes && m.fuentes.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6, maxWidth: '85%' }}>
                  {m.fuentes.map(f => (
                    <button key={f.temaId} onClick={() => navigate(`/oposicion/${slug}/temario/${f.temaId}`)}
                      style={{ fontSize: 11, padding: '3px 9px', borderRadius: 999, cursor: 'pointer', background: 'var(--accent-soft)', color: 'var(--accent)', border: '1px solid var(--border-soft)' }}>
                      Tema {f.temaId}
                    </button>
                  ))}
                </div>
              )}
              {m.role === 'assistant' && i === mensajes.length - 1 && !cargando && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                  <button onClick={accionTest} disabled={accionCargando !== null}
                    style={{ fontSize: 11.5, padding: '5px 11px', borderRadius: 999, cursor: 'pointer', background: 'var(--surface)', color: 'var(--ink)', border: '1px solid var(--border)' }}>
                    {accionCargando === 'test' ? 'Generando…' : '📝 Ponérmelo a prueba'}
                  </button>
                  <button onClick={accionFlashcards} disabled={accionCargando !== null}
                    style={{ fontSize: 11.5, padding: '5px 11px', borderRadius: 999, cursor: 'pointer', background: 'var(--surface)', color: 'var(--ink)', border: '1px solid var(--border)' }}>
                    {accionCargando === 'flashcards' ? 'Generando…' : '🃏 Crear flashcards'}
                  </button>
                  <button onClick={accionResumen} disabled={accionCargando !== null}
                    style={{ fontSize: 11.5, padding: '5px 11px', borderRadius: 999, cursor: 'pointer', background: 'var(--surface)', color: 'var(--ink)', border: '1px solid var(--border)' }}>
                    {accionCargando === 'resumen' ? 'Generando…' : '✨ Resúmemelo'}
                  </button>
                </div>
              )}
            </div>
          ))}
          {cargando && <div style={{ marginRight: 'auto', borderRadius: 16, background: 'var(--surface)', border: '1px solid var(--border)', padding: '10px 14px', fontSize: 13.5, color: 'var(--mute)' }}>El tutor está buscando en el temario…</div>}
          {error && <div className="rounded-xl px-3 py-2 text-xs" style={{ background: 'var(--warn-soft)', color: 'var(--warn)' }}>{error}</div>}
          <div ref={finRef} />
        </div>
      </main>

      <footer className="px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]" style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)' }}>
        <div className="max-w-2xl mx-auto flex items-end gap-2">
          <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
            placeholder="Tu duda del temario… (Enter para enviar)" rows={2}
            style={{ flex: 1, resize: 'none', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--ink)', padding: '8px 12px', fontSize: 13.5 }} />
          <button onClick={enviar} disabled={cargando || !input.trim()} className="btn-editorial btn-acc"
            style={{ paddingLeft: 18, paddingRight: 18, opacity: cargando || !input.trim() ? 0.4 : 1 }}>Enviar</button>
        </div>
      </footer>
      {testPreguntas && (
        <div onClick={() => setTestPreguntas(null)} style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', overflowY: 'auto', padding: 16 }}>
          <div onClick={e => e.stopPropagation()} className="card" style={{ maxWidth: 640, width: '100%', marginTop: 24, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <strong style={{ fontSize: 14 }}>Ponte a prueba</strong>
              <button onClick={() => setTestPreguntas(null)} style={{ background: 'none', border: 0, cursor: 'pointer', fontSize: 18, color: 'var(--mute)' }}>✕</button>
            </div>
            <MotorTest preguntas={testPreguntas} titulo="Mini-test del tutor" />
          </div>
        </div>
      )}
      {flashcards && (
        <div onClick={() => setFlashcards(null)} style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', overflowY: 'auto', padding: 16 }}>
          <div onClick={e => e.stopPropagation()} className="card" style={{ maxWidth: 520, width: '100%', marginTop: 24, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <strong style={{ fontSize: 14 }}>Flashcards de la duda</strong>
              <button onClick={() => setFlashcards(null)} style={{ background: 'none', border: 0, cursor: 'pointer', fontSize: 18, color: 'var(--mute)' }}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {flashcards.map((f, i) => (
                <details key={i} style={{ border: '1px solid var(--border)', borderRadius: 12, padding: '10px 12px', background: 'var(--bg)' }}>
                  <summary style={{ cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{f.pregunta}</summary>
                  <p style={{ margin: '8px 0 0', fontSize: 12.5, color: 'var(--ink-soft)', lineHeight: 1.5 }}>{f.respuesta}</p>
                </details>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
