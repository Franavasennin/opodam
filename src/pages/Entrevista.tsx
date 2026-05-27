import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { enviarTurnoEntrevista, type MensajeEntrevista, type ModoEntrevista } from '../services/entrevista'

export default function Entrevista() {
  const navigate = useNavigate()
  const { slug } = useParams<{ slug: string }>()
  const cuerpo = slug ?? 'cgpc'
  const [modo, setModo] = useState<ModoEntrevista | null>(null)
  const [mensajes, setMensajes] = useState<MensajeEntrevista[]>([])
  const [input, setInput] = useState('')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const finRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => { finRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [mensajes, cargando])

  async function pedirTurno(historial: MensajeEntrevista[], m: ModoEntrevista) {
    setCargando(true); setError(null)
    const { content, error: err } = await enviarTurnoEntrevista(historial, cuerpo, m)
    setCargando(false)
    if (err || !content) { setError('No se pudo contactar con el entrevistador, inténtalo de nuevo.'); return }
    setMensajes(prev => [...prev, { role: 'assistant', content }])
  }

  async function elegirModo(m: ModoEntrevista) {
    setModo(m)
    await pedirTurno([{ role: 'user', content: 'Empieza la entrevista, por favor.' }], m)
  }

  async function enviar() {
    const texto = input.trim()
    if (!texto || cargando || !modo) return
    const nuevos: MensajeEntrevista[] = [...mensajes, { role: 'user', content: texto }]
    setMensajes(nuevos); setInput('')
    await pedirTurno(nuevos, modo)
  }

  async function verInforme() {
    if (cargando || !modo) return
    const nuevos: MensajeEntrevista[] = [...mensajes, { role: 'user', content: '[GENERAR_INFORME]' }]
    setMensajes(nuevos)
    await pedirTurno(nuevos, modo)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar() }
  }

  if (!modo) {
    return (
      <div className="min-h-screen bg-slate-50">
        <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
          <button onClick={() => navigate(`/oposicion/${slug}`)} className="text-marca-600 text-sm font-medium">←</button>
          <h1 className="text-lg font-bold text-slate-900">Entrevista</h1>
        </header>
        <main className="p-4 max-w-2xl mx-auto space-y-3">
          <p className="text-sm text-slate-600">Elige un modo de entrenamiento:</p>
          <button onClick={() => elegirModo('practica')}
            className="w-full bg-white border border-slate-200 rounded-2xl shadow-sm px-4 py-4 text-left hover:shadow-md transition-shadow">
            <div className="text-sm font-bold text-slate-900">🎯 Práctica</div>
            <div className="text-xs text-slate-500 mt-0.5">Feedback didáctico tras cada respuesta (método STAR, versión modelo).</div>
          </button>
          <button onClick={() => elegirModo('examen')}
            className="w-full bg-white border border-slate-200 rounded-2xl shadow-sm px-4 py-4 text-left hover:shadow-md transition-shadow">
            <div className="text-sm font-bold text-slate-900">⏱️ Examen real</div>
            <div className="text-xs text-slate-500 mt-0.5">Preguntas encadenadas con presión; el análisis va al informe final.</div>
          </button>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(`/oposicion/${slug}`)} className="text-marca-600 text-sm font-medium">←</button>
        <span className="font-bold text-slate-900">Entrevista</span>
        <span className="text-xs text-slate-400">· {modo === 'examen' ? 'Examen real' : 'Práctica'}</span>
        <button onClick={() => { setModo(null); setMensajes([]); setError(null) }} className="ml-auto text-xs text-marca-600 font-medium">Reiniciar</button>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-4">
        <div className="max-w-2xl mx-auto space-y-3">
          {mensajes.map((m, i) => (
            <div key={i} className={m.role === 'user'
              ? 'ml-auto max-w-[85%] rounded-2xl bg-marca-600 text-white px-4 py-2.5 text-sm whitespace-pre-wrap'
              : 'mr-auto max-w-[85%] rounded-2xl bg-white border border-slate-200 px-4 py-2.5 text-sm text-slate-800 whitespace-pre-wrap'}>
              {m.content}
            </div>
          ))}
          {cargando && <div className="mr-auto rounded-2xl bg-white border border-slate-200 px-4 py-2.5 text-sm text-slate-400">El entrevistador está pensando…</div>}
          {error && <div className="rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">{error}</div>}
          <div ref={finRef} />
        </div>
      </main>

      <footer className="bg-white border-t border-slate-200 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="max-w-2xl mx-auto space-y-2">
          <div className="flex items-end gap-2">
            <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
              placeholder="Tu respuesta… (Enter para enviar)" rows={2}
              className="flex-1 resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-marca-600" />
            <button onClick={enviar} disabled={cargando || !input.trim()}
              className="bg-marca-600 hover:bg-marca-700 disabled:opacity-40 text-white text-sm font-semibold rounded-xl px-4 py-2 transition-colors">Enviar</button>
          </div>
          {mensajes.length > 1 && (
            <button onClick={verInforme} disabled={cargando}
              className="w-full border border-marca-200 text-marca-700 rounded-xl py-2 text-sm font-semibold disabled:opacity-40">
              Terminar y ver informe
            </button>
          )}
        </div>
      </footer>
    </div>
  )
}
