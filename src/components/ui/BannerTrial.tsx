import { diasRestantes } from '../../services/suscripcion'

/**
 * Banner informativo de cuenta atrás del trial.
 * Solo se muestra si hay trial_start (rol trial). El gating real es del servidor.
 */
export function BannerTrial({ trialStart, rol }: { trialStart: string | null; rol?: string }) {
  if (rol === 'owner' || rol === 'beta') return null
  const dias = diasRestantes(trialStart)
  if (dias == null) return null

  return (
    <div
      style={{
        margin: '0 16px 12px', padding: '10px 14px', borderRadius: 12,
        background: 'var(--accent-soft)', color: 'var(--accent)',
        fontSize: 12.5, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8,
      }}
    >
      <span>⏳</span>
      <span>
        {dias > 0
          ? `Te quedan ${dias} ${dias === 1 ? 'día' : 'días'} de prueba`
          : 'Tu prueba ha terminado'}
      </span>
    </div>
  )
}
