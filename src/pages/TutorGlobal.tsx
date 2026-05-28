import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { OPOSICIONES } from '../data/oposiciones'
import { buscar } from '../services/retrieval'
import { preguntarTutor, type MensajeTutor, type ContextoTema } from '../services/tutor'

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

  useEffect(() => { finRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [mensajes, cargando])

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
    setMensajes([...previos, { role: 'assistant', content, fuentes }])
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
    </div>
  )
}
