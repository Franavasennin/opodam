import { NavLink } from 'react-router-dom'

const LINKS = [
  { to: '/',             label: 'Inicio',     icon: '🏠' },
  { to: '/temario',      label: 'Temario',    icon: '📚' },
  { to: '/flashcards',   label: 'Flashcards', icon: '🃏' },
  { to: '/tests',        label: 'Tests',      icon: '📝' },
  { to: '/estadisticas', label: 'Stats',      icon: '📊' },
]

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 flex md:hidden">
      {LINKS.map(({ to, label, icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center py-2 text-xs gap-1 transition-colors ${isActive ? 'text-brand-600 font-semibold' : 'text-gray-500'}`
          }
        >
          <span className="text-xl">{icon}</span>
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
