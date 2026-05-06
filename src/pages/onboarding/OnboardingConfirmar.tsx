// src/pages/onboarding/OnboardingConfirmar.tsx
import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { enviarMagicLink } from '../../services/supabase'

export default function OnboardingConfirmar() {
  const location = useLocation()
  const email: string = (location.state as { email?: string })?.email ?? ''
  const [reenviado, setReeenviado] = useState(false)
  const [cargando, setCargando] = useState(false)

  async function handleReenviar() {
    if (!email) return
    setCargando(true)
    await enviarMagicLink(email)
    setCargando(false)
    setReeenviado(true)
    setTimeout(() => setReeenviado(false), 5000)
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-t-2xl p-6 text-center text-white">
          <div className="text-4xl mb-1">📘</div>
          <div className="font-bold text-lg">OpoDAM</div>
          <div className="text-sm opacity-80">Prepara tu oposición</div>
        </div>

        <div className="bg-white rounded-b-2xl shadow-lg p-6 text-center">
          <div className="flex gap-1 justify-center mb-4">
            <div className="h-1.5 w-1.5 bg-slate-200 rounded-full" />
            <div className="h-1.5 w-6 bg-blue-600 rounded-full" />
            <div className="h-1.5 w-1.5 bg-slate-200 rounded-full" />
          </div>

          <div className="text-5xl mb-3">✉️</div>
          <p className="text-sm text-slate-700">Enlace enviado a</p>
          <p className="font-bold text-blue-600 text-sm mb-1">{email || 'tu email'}</p>
          <p className="text-xs text-slate-400 mt-2 mb-5">Abre el email y pulsa el enlace para continuar.</p>

          {reenviado && (
            <p className="text-xs text-green-600 mb-2">Enlace reenviado ✓</p>
          )}

          <button
            onClick={handleReenviar}
            disabled={cargando}
            className="w-full bg-slate-100 text-slate-700 rounded-xl py-2.5 text-sm font-semibold disabled:opacity-50"
          >
            {cargando ? 'Enviando...' : 'Reenviar enlace'}
          </button>
        </div>
      </div>
    </div>
  )
}
