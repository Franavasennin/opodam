// src/pages/onboarding/OnboardingEmail.tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { enviarMagicLink } from '../../services/supabase'

export default function OnboardingEmail() {
  const [email, setEmail] = useState('')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setCargando(true)
    setError(null)
    const { error: err } = await enviarMagicLink(email.trim())
    setCargando(false)
    if (err) {
      console.error('[enviarMagicLink] Supabase error:', err)
      setError(`No se pudo enviar el enlace: ${err}`)
      return
    }
    navigate('/onboarding/confirmar', { state: { email } })
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-t-2xl p-6 text-center text-white">
          <div className="text-4xl mb-1">📘</div>
          <div className="font-bold text-lg">OpoDAM</div>
          <div className="text-sm opacity-80">Prepara tu oposición</div>
        </div>

        <div className="bg-white rounded-b-2xl shadow-lg p-6">
          <div className="flex gap-1 justify-center mb-4">
            <div className="h-1.5 w-6 bg-blue-600 rounded-full" />
            <div className="h-1.5 w-1.5 bg-slate-200 rounded-full" />
            <div className="h-1.5 w-1.5 bg-slate-200 rounded-full" />
          </div>

          <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-2">Paso 1 — Acceso</p>
          <p className="text-sm text-slate-700 font-medium mb-4">Introduce tu email para entrar</p>

          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {error && <p className="text-xs text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={cargando || !email.trim()}
              className="w-full bg-blue-600 text-white rounded-xl py-2.5 text-sm font-semibold disabled:opacity-50"
            >
              {cargando ? 'Enviando...' : 'Enviar enlace de acceso'}
            </button>
          </form>

          <p className="text-xs text-slate-400 text-center mt-3">Sin contraseña. Te enviamos un enlace mágico gratuito.</p>
        </div>
      </div>
    </div>
  )
}
