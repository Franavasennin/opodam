import { useEffect, useRef, useState } from 'react'
import type { Tema } from '../../types'
import { preguntarTutor, type MensajeTutor, type ContextoTema } from '../../services/tutor'
import { cargarHistorial, guardarHistorial } from '../../services/tutorHistorial'
import { useProgress } from '../../hooks/useProgress'
import { obtenerTopics } from '../../data/topics'
import { construirPerfilAlumno } from '../../services/perfilAlumno'

interface Props {
  oposicion: string
  tema: Tema
  abierto: boolean
  onCerrar: () => void
}

function construirContexto(oposicion: string, tema: Tema, perfilAlumno: string | null): ContextoTema {
  return {
    oposicion,
    temaId: tema.id,
    titulo: tema.titulo,
    secciones: tema.secciones ?? [],
    flashcards: (tema.flashcards ?? []) as unknown as ContextoTema['flashcards'],
    preguntas: (tema.preguntas ?? []) as unknown as ContextoTema['preguntas'],
    perfilAlumno,
  }
}

export function TutorPanel({ oposicion, tema, abierto, onCerrar }: Props) {
  const { progreso } = useProgress()
  const { TEMAS_META } = obtenerTopics(oposicion)
  const [mensajes, setMensajes] = useState<MensajeTutor[]>([])
  const [input, setInput] = useState('')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const finRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!abierto) return
    cargarHistorial(oposicion, tema.id).then(setMensajes)
  }, [abierto, oposicion, tema.id])

  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensajes, cargando])

  async function enviarTexto(texto: string) {
    const limpio = texto.trim()
    if (!limpio || cargando) return
    setError(null)
    const nuevos: MensajeTutor[] = [...mensajes, { role: 'user', content: limpio }]
    setMensajes(nuevos)
    setInput('')
    setCargando(true)
    const perfil = construirPerfilAlumno(progreso, TEMAS_META)
    const { content, error: err } = await preguntarTutor(nuevos, construirContexto(oposicion, tema, perfil))
    setCargando(false)
    if (err || !content) {
      setError('No se pudo contactar con el tutor, inténtalo de nuevo.')
      return
    }
    const finales: MensajeTutor[] = [...nuevos, { role: 'assistant', content }]
    setMensajes(finales)
    guardarHistorial(oposicion, tema.id, finales)
  }

  const enviar = () => enviarTexto(input)

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar() }
  }

  if (!abierto) return null

  return (
    <div className="fixed inset-0 z-[60] flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onCerrar} />
      <div className="relative w-full max-w-md h-full bg-slate-100 flex flex-col shadow-2xl">
        <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3">
          <span className="font-bold text-slate-900">Tutor</span>
          <span className="text-xs text-slate-400 truncate flex-1">· {tema.titulo}</span>
          <button onClick={onCerrar} aria-label="Cerrar" className="text-slate-400 hover:text-slate-600 text-lg">✕</button>
        </header>

        <main className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {mensajes.length === 0 && !cargando && (
            <div className="rounded-2xl bg-white border border-slate-200 p-4">
              <p className="text-sm font-semibold text-slate-900 mb-1">Hola, soy tu tutor 👨‍🏫</p>
              <p className="text-xs text-slate-600">Pregúntame cualquier duda sobre «{tema.titulo}».</p>
            </div>
          )}
          {mensajes.map((m, i) => (
            <div key={i} className={m.role === 'user'
              ? 'ml-auto max-w-[85%] rounded-2xl bg-marca-600 text-white px-4 py-2.5 text-sm whitespace-pre-wrap'
              : 'mr-auto max-w-[85%] rounded-2xl bg-white border border-slate-200 px-4 py-2.5 text-sm text-slate-800 whitespace-pre-wrap'}>
              {m.content}
            </div>
          ))}
          {cargando && (
            <div className="mr-auto rounded-2xl bg-white border border-slate-200 px-4 py-2.5 text-sm text-slate-400">
              Tutor está escribiendo…
            </div>
          )}
          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">{error}</div>
          )}
          <div ref={finRef} />
        </main>

        <footer className="bg-white border-t border-slate-200 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="flex gap-2 overflow-x-auto pb-2 -mt-1">
            <button
              onClick={() => enviarTexto(`Explícame por qué suelo fallar en «${tema.titulo}» y dame un ejemplo nuevo para no repetir el error.`)}
              disabled={cargando}
              className="shrink-0 text-xs font-semibold rounded-full border border-slate-200 text-slate-600 px-3 py-1.5 hover:bg-slate-50 disabled:opacity-40"
            >🔍 Explícame mi fallo</button>
            <button
              onClick={() => enviarTexto(`Ponme 3 preguntas tipo test nuevas sobre «${tema.titulo}», una a una, esperando mi respuesta antes de corregir.`)}
              disabled={cargando}
              className="shrink-0 text-xs font-semibold rounded-full border border-slate-200 text-slate-600 px-3 py-1.5 hover:bg-slate-50 disabled:opacity-40"
            >📝 3 preguntas nuevas</button>
          </div>
          <div className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribe tu duda… (Enter para enviar)"
              rows={2}
              className="flex-1 resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-marca-600"
            />
            <button
              onClick={enviar}
              disabled={cargando || !input.trim()}
              className="bg-marca-600 hover:bg-marca-700 disabled:opacity-40 text-white text-sm font-semibold rounded-xl px-4 py-2 transition-colors"
            >
              Enviar
            </button>
          </div>
        </footer>
      </div>
    </div>
  )
}
