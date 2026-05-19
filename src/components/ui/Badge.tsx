interface BadgeProps {
  children: React.ReactNode
  variant?: 'blue' | 'green' | 'orange' | 'gray'
}

const VARIANTS = {
  blue:   'bg-marca-100 text-marca-700',
  green:  'bg-green-100 text-green-700',
  orange: 'bg-acento-100 text-acento-600',
  gray:   'bg-slate-100 text-slate-600',
}

export function Badge({ children, variant = 'gray' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${VARIANTS[variant]}`}>
      {children}
    </span>
  )
}
