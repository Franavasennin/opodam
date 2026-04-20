interface BadgeProps {
  children: React.ReactNode
  variant?: 'blue' | 'green' | 'orange' | 'gray'
}

const VARIANTS = {
  blue:   'bg-brand-100 text-brand-700',
  green:  'bg-green-100 text-green-700',
  orange: 'bg-orange-100 text-orange-700',
  gray:   'bg-gray-100 text-gray-600',
}

export function Badge({ children, variant = 'gray' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${VARIANTS[variant]}`}>
      {children}
    </span>
  )
}
