// src/pages/onboarding/OnboardingEmail.tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
    <div className="min-h-screen fade-up flex items-center justify-center p-4" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-sm">
        <Marca />
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderTop: 0, borderRadius: '0 0 18px 18px', padding: 24 }}>
          <Puntos activo={0} />
          <div className="eyebrow" style={{ marginBottom: 6 }}>Paso 1 — Acceso</div>
          <p style={{ fontSize: 13.5, color: 'var(--ink)', fontWeight: 600, margin: '0 0 14px' }}>Introduce tu email para entrar</p>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@email.com" required
              style={{ width: '100%', border: '1px solid var(--border)', borderRadius: 12, background: 'var(--bg)', color: 'var(--ink)', padding: '10px 12px', fontSize: 13.5 }} />
            {error && <p style={{ fontSize: 12, color: 'var(--warn)', margin: 0 }}>{error}</p>}
            <button type="submit" disabled={cargando || !email.trim()} className="btn-editorial btn-acc" style={{ width: '100%', opacity: cargando || !email.trim() ? 0.5 : 1 }}>
              {cargando ? 'Enviando…' : 'Enviar enlace de acceso'}
            </button>
          </form>
          <p style={{ fontSize: 11.5, color: 'var(--mute)', textAlign: 'center', marginTop: 12 }}>Sin contraseña. Te enviamos un enlace mágico gratuito.</p>
        </div>
      </div>
    </div>
  )
}
