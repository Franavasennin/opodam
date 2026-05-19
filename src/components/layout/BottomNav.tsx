import { NavLink } from 'react-router-dom'

const LINKS = [
  { to: '/',             label: 'Inicio',     icon: '🏠' },
  { to: '/temario',      label: 'Temario',    icon: '📚' },
  { to: '/examen',       label: 'Examen',     icon: '🎯' },
  { to: '/flashcards',   label: 'Flashcards', icon: '🃏' },
  { to: '/estadisticas', label: 'Stats',      icon: '📊' },
  { to: '/perfil',       label: 'Perfil',     icon: '👤' },
]

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 flex md:hidden">
      {LINKS.map(({ to, label, icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center py-2 text-xs gap-1 transition-colors ${isActive ? 'text-marca-600 font-semibold' : 'text-slate-400'}`
          }
        >
          <span className="text-xl">{icon}</span>
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
