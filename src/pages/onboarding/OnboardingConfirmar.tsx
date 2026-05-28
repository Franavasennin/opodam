// src/pages/onboarding/OnboardingConfirmar.tsx
import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { enviarMagicLink } from '../../services/supabase'

function Marca() {
  return (
    <div className="hero" style={{ borderRadius: '18px 18px 0 0', padding: 24, textAlign: 'center' }}>
      <div className="hero-grain" />
      <div style={{ position: 'relative' }}>
        <div style={{ fontSize: 34 }}>📘</div>
        <div className="display" style={{ fontSize: 24, marginTop: 4 }}>OpoDAM</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.72)' }}>Prepara tu oposición</div>
      </div>
    </div>
  )
}

function Puntos({ activo }: { activo: 0 | 1 | 2 }) {
  return (
    <div className="flex gap-1 justify-center" style={{ marginBottom: 16 }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{ height: 6, width: i === activo ? 24 : 6, borderRadius: 999, background: i === activo ? 'var(--accent)' : 'var(--border)' }} />
      ))}
    </div>
  )
}

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
    <div className="min-h-screen fade-up flex items-center justify-center p-4" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-sm">
        <Marca />
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderTop: 0, borderRadius: '0 0 18px 18px', padding: 24, textAlign: 'center' }}>
          <Puntos activo={1} />
          <div style={{ fontSize: 44, marginBottom: 10 }}>✉️</div>
          <p style={{ fontSize: 13.5, color: 'var(--ink-soft)', margin: 0 }}>Enlace enviado a</p>
          <p className="num-display" style={{ fontWeight: 600, color: 'var(--accent)', fontSize: 13.5, margin: '2px 0 0' }}>{email || 'tu email'}</p>
          <p style={{ fontSize: 12, color: 'var(--mute)', margin: '10px 0 18px' }}>Abre el email y pulsa el enlace para continuar.</p>
          {reenviado && <p style={{ fontSize: 12, color: 'var(--accent)', margin: '0 0 10px' }}>Enlace reenviado ✓</p>}
          <button onClick={handleReenviar} disabled={cargando} className="btn-editorial btn-sec" style={{ width: '100%', opacity: cargando ? 0.5 : 1 }}>
            {cargando ? 'Enviando…' : 'Reenviar enlace'}
          </button>
        </div>
      </div>
    </div>
  )
}
