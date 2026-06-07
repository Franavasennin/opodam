// src/pages/onboarding/OnboardingEmail.tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { enviarMagicLink, iniciarSesionGoogle } from '../../services/supabase'

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
          <p style={{ fontSize: 13.5, color: 'var(--ink)', fontWeight: 600, margin: '0 0 14px' }}>Entra para empezar</p>

          <button
            type="button"
            onClick={() => { setError(null); iniciarSesionGoogle().then(({ error: err }) => { if (err) setError(`No se pudo entrar con Google: ${err}`) }) }}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              border: '1px solid var(--border)', borderRadius: 12, background: 'var(--bg)', color: 'var(--ink)',
              padding: '11px 12px', fontSize: 13.5, fontWeight: 600, cursor: 'pointer',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
              <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"/>
              <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z"/>
              <path fill="#FBBC05" d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33z"/>
              <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z"/>
            </svg>
            Entrar con Google
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '14px 0' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            <span style={{ fontSize: 11, color: 'var(--mute)' }}>o con tu email</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>

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
