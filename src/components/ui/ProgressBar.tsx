interface ProgressBarProps {
  value: number
  color?: 'blue' | 'green' | 'orange'
  label?: string
}

const COLORS = { blue: 'bg-marca-600', green: 'bg-green-500', orange: 'bg-acento-600' }

export function ProgressBar({ value, color = 'blue', label }: ProgressBarProps) {
  return (
    <div className="w-full">
      {label && <span className="text-xs text-slate-500 mb-1 block">{label}</span>}
      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${COLORS[color]}`}
          style={{ width: `${Math.min(100, value)}%` }}
        />
      </div>
    </div>
  )
}
