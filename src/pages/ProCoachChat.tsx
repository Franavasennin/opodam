// src/pages/ProCoachChat.tsx
// Chat con el agente DELTA (entrenador físico de oposiciones).
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { enviarMensajeDelta, type MensajeChat, type PerfilDelta, type Cuerpo, type Nivel } from '../services/delta'

const CLAVE_PERFIL = 'opodam.delta.perfil'
const CLAVE_MENSAJES = 'opodam.delta.mensajes'

const CUERPOS: { value: Cuerpo; label: string }[] = [
  { value: 'cgpc', label: 'CGPC — Policía Canaria' },
  { value: 'policia_local', label: 'Policía Local' },
  { value: 'guardia_civil', label: 'Guardia Civil' },
  { value: 'policia_nacional', label: 'Policía Nacional' },
  { value: 'fuerzas_armadas', label: 'Fuerzas Armadas' },
  { value: 'bomberos', label: 'Bomberos' },
]

const NIVELES: { value: Nivel; label: string }[] = [
  { value: 'beginner', label: 'Principiante' },
  { value: 'intermediate', label: 'Intermedio' },
  { value: 'advanced', label: 'Avanzado' },
]

function cargarPerfil(): PerfilDelta {
  try {
    const raw = localStorage.getItem(CLAVE_PERFIL)
    if (!raw) return {}
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

function cargarMensajes(): MensajeChat[] {
  try {
    const raw = localStorage.getItem(CLAVE_MENSAJES)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
  } catch {
    return []
  }
}

export default function ProCoachChat() {
  const navigate = useNavigate()
  const [perfil, setPerfil] = useState<PerfilDelta>(() => cargarPerfil())
  const [mensajes, setMensajes] = useState<MensajeChat[]>(() => cargarMensajes())
  const [input, setInput] = useState('')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mostrarPerfil, setMostrarPerfil] = useState(() => !cargarPerfil().cuerpo)
  const finRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    localStorage.setItem(CLAVE_PERFIL, JSON.stringify(perfil))
  }, [perfil])

  useEffect(() => {
    localStorage.setItem(CLAVE_MENSAJES, JSON.stringify(mensajes))
    finRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensajes])

  async function enviar() {
    const texto = input.trim()
    if (!texto || cargando) return
    setError(null)
    const nuevos: MensajeChat[] = [...mensajes, { role: 'user', content: texto }]
    setMensajes(nuevos)
    setInput('')
    setCargando(true)
    const { content, error: err } = await enviarMensajeDelta(nuevos, perfil)
    setCargando(false)
    if (err || !content) {
      setError(err || 'No se obtuvo respuesta')
      return
    }
    setMensajes(prev => [...prev, { role: 'assistant', content }])
  }

  function limpiarConversacion() {
    if (!confirm('¿Borrar toda la conversación con DELTA?')) return
    setMensajes([])
    setError(null)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      enviar()
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate('/procoach')} className="text-marca-600 text-sm font-medium">
          ← ProCoach AI
        </button>
        <span className="font-bold text-slate-900">DELTA</span>
        <span className="text-xs text-slate-400">· Preparador de oposiciones</span>
        <button
          onClick={() => setMostrarPerfil(v => !v)}
          className="ml-auto text-xs text-marca-600 font-medium"
        >
          {mostrarPerfil ? 'Ocultar perfil' : 'Editar perfil'}
        </button>
      </header>

      {/* Perfil */}
      {mostrarPerfil && (
        <section className="bg-white border-b border-slate-200 px-4 py-3">
          <div className="max-w-2xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="text-xs">
              <span className="block font-semibold text-slate-600 mb-1">Cuerpo / oposición</span>
              <select
                value={perfil.cuerpo ?? ''}
                onChange={e => setPerfil(p => ({ ...p, cuerpo: (e.target.value || undefined) as Cuerpo }))}
                className="w-full rounded-lg border border-slate-200 px-2 py-1.5"
              >
                <option value="">(elige)</option>
                {CUERPOS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </label>
            <label className="text-xs">
              <span className="block font-semibold text-slate-600 mb-1">Nivel físico</span>
              <select
                value={perfil.level ?? ''}
                onChange={e => setPerfil(p => ({ ...p, level: (e.target.value || undefined) as Nivel }))}
                className="w-full rounded-lg border border-slate-200 px-2 py-1.5"
              >
                <option value="">(elige)</option>
                {NIVELES.map(n => <option key={n.value} value={n.value}>{n.label}</option>)}
              </select>
            </label>
            <label className="text-xs">
              <span className="block font-semibold text-slate-600 mb-1">Días/semana</span>
              <input
                type="text"
                value={perfil.weekly_days ?? ''}
                onChange={e => setPerfil(p => ({ ...p, weekly_days: e.target.value }))}
                placeholder="3-4"
                className="w-full rounded-lg border border-slate-200 px-2 py-1.5"
              />
            </label>
            <label className="text-xs">
              <span className="block font-semibold text-slate-600 mb-1">Fecha del examen físico</span>
              <input
                type="date"
                value={perfil.target_date ?? ''}
                onChange={e => setPerfil(p => ({ ...p, target_date: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-2 py-1.5"
              />
            </label>
            <label className="text-xs sm:col-span-2">
              <span className="block font-semibold text-slate-600 mb-1">Lesiones / limitaciones (opcional)</span>
              <input
                type="text"
                value={perfil.injuries ?? ''}
                onChange={e => setPerfil(p => ({ ...p, injuries: e.target.value }))}
                placeholder="Ej.: tendinitis de hombro derecho"
                className="w-full rounded-lg border border-slate-200 px-2 py-1.5"
              />
            </label>
          </div>
        </section>
      )}

      {/* Mensajes */}
      <main className="flex-1 overflow-y-auto px-4 py-4">
        <div className="max-w-2xl mx-auto space-y-3">
          {mensajes.length === 0 && !cargando && (
            <div className="rounded-2xl bg-white border border-slate-200 p-4">
              <p className="text-sm font-semibold text-slate-900 mb-1">Hola, soy DELTA 🛡️</p>
              <p className="text-xs text-slate-600">
                Tu preparador físico para oposiciones. Rellena tu perfil arriba y cuéntame qué necesitas:
                un plan, una sesión, dudas de protocolo o tus marcas actuales.
              </p>
            </div>
          )}

          {mensajes.map((m, i) => (
            <div
              key={i}
              className={m.role === 'user'
                ? 'ml-auto max-w-[85%] rounded-2xl bg-marca-600 text-white px-4 py-2.5 text-sm whitespace-pre-wrap'
                : 'mr-auto max-w-[85%] rounded-2xl bg-white border border-slate-200 px-4 py-2.5 text-sm text-slate-800 whitespace-pre-wrap'}
            >
              {m.content}
            </div>
          ))}

          {cargando && (
            <div className="mr-auto rounded-2xl bg-white border border-slate-200 px-4 py-2.5 text-sm text-slate-400">
              DELTA está escribiendo…
            </div>
          )}

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
              {error}
            </div>
          )}

          <div ref={finRef} />
        </div>
      </main>

      {/* Input */}
      <footer className="bg-white border-t border-slate-200 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="max-w-2xl mx-auto flex items-end gap-2">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe a DELTA… (Enter para enviar, Shift+Enter para salto de línea)"
            rows={2}
            className="flex-1 resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-marca-600"
          />
          <div className="flex flex-col gap-1">
            <button
              onClick={enviar}
              disabled={cargando || !input.trim()}
              className="bg-marca-600 hover:bg-marca-700 disabled:opacity-40 text-white text-sm font-semibold rounded-xl px-4 py-2 transition-colors"
            >
              Enviar
            </button>
            {mensajes.length > 0 && (
              <button
                onClick={limpiarConversacion}
                className="text-[10px] text-slate-400 hover:text-slate-600"
              >
                limpiar
              </button>
            )}
          </div>
        </div>
      </footer>
    </div>
  )
}
