// src/components/promo/BannerPaywall.tsx
import { useState } from 'react'
import { iniciarCheckout } from '../../services/supabase'

interface Props {
  slug: string
  nombreOposicion: string
}

export function BannerPaywall({ slug, nombreOposicion }: Props) {
  const [cargando, setCargando] = useState(false)

  async function handleSuscribirse() {
    setCargando(true)
    try {
      await iniciarCheckout(slug)
    } catch (e) {
      console.error('[BannerPaywall]', e)
      setCargando(false)
    }
  }

  return (
    <div style={{
      background: 'linear-gradient(135deg, var(--accent, #c0764a) 0%, #9b5a30 100%)',
      borderRadius: 16,
      padding: '20px 24px',
      marginBottom: 24,
      color: '#fff',
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 28 }}>🎯</span>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16, lineHeight: 1.2 }}>
            Accede a todo para {nombreOposicion}
          </div>
          <div style={{ fontSize: 13, opacity: 0.9, marginTop: 2 }}>
            Temario completo · Tests · Tutor IA · Entrenador · Entrevista
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ fontSize: 22, fontWeight: 800 }}>
          19,90 €<span style={{ fontSize: 14, fontWeight: 400, opacity: 0.85 }}>/mes</span>
        </div>
        <button
          onClick={handleSuscribirse}
          disabled={cargando}
          style={{
            background: '#fff',
            color: '#9b5a30',
            border: 'none',
            borderRadius: 10,
            padding: '10px 22px',
            fontWeight: 700,
            fontSize: 15,
            cursor: cargando ? 'wait' : 'pointer',
            opacity: cargando ? 0.7 : 1,
            flexShrink: 0,
          }}
        >
          {cargando ? 'Redirigiendo…' : 'Suscribirme ahora'}
        </button>
      </div>

      <div style={{ fontSize: 12, opacity: 0.75 }}>
        Cancela cuando quieras · Sin permanencia · Pago seguro con Stripe
      </div>
    </div>
  )
}
