/**
 * Barra de progreso.
 *
 * Dos arreglos sobre la versión anterior:
 *  - Semántica: no tenía `role="progressbar"` ni `aria-value*`, así que un
 *    lector de pantalla no anunciaba absolutamente nada.
 *  - Nombres: las variantes se llamaban 'blue' | 'green' | 'orange' pero
 *    pintaban terracota, verde y oro. El nombre mentía sobre el color. Ahora
 *    son semánticas ('accent' | 'exito' | 'oro') y los nombres antiguos se
 *    conservan como alias para no romper a quien ya los usa.
 */
type Tono = 'accent' | 'exito' | 'oro'
type TonoLegado = 'blue' | 'green' | 'orange'

const ALIAS: Record<TonoLegado, Tono> = { blue: 'accent', green: 'exito', orange: 'oro' }

const RELLENO: Record<Tono, string> = {
  accent: 'var(--accent)',
  exito:  'var(--accent)',
  oro:    'var(--gold)',
}

interface ProgressBarProps {
  /** Porcentaje 0–100. Se recorta al rango válido. */
  value: number
  color?: Tono | TonoLegado
  /** Texto visible encima de la barra. Si falta, usa `aria-label`. */
  label?: string
  'aria-label'?: string
}

export function ProgressBar({ value, color = 'accent', label, ...resto }: ProgressBarProps) {
  const tono: Tono = (ALIAS as Record<string, Tono>)[color] ?? (color as Tono)
  const pct = Math.round(Math.min(100, Math.max(0, Number.isFinite(value) ? value : 0)))

  return (
    <div className="w-full">
      {label && <span className="text-xs text-slate-500 mb-1 block">{label}</span>}
      <div
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuetext={`${pct}%`}
        aria-label={label ?? resto['aria-label'] ?? 'Progreso'}
        className="h-2 rounded-full overflow-hidden"
        style={{ background: 'var(--border-soft)' }}
      >
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: RELLENO[tono] ?? RELLENO.accent }}
        />
      </div>
    </div>
  )
}
