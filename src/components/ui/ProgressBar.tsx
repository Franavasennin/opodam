interface ProgressBarProps {
  value: number
  color?: 'blue' | 'green' | 'orange'
  label?: string
}

const COLORS = { blue: 'bg-brand-500', green: 'bg-green-500', orange: 'bg-orange-400' }

export function ProgressBar({ value, color = 'blue', label }: ProgressBarProps) {
  return (
    <div className="w-full">
      {label && <span className="text-xs text-gray-500 mb-1 block">{label}</span>}
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${COLORS[color]}`}
          style={{ width: `${Math.min(100, value)}%` }}
        />
      </div>
    </div>
  )
}
