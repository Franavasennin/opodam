import { NavLink } from 'react-router-dom'

const LINKS = [
  { to: '/',             label: 'Inicio',       icon: '🏠' },
  { to: '/temario',      label: 'Temario',      icon: '📚' },
  { to: '/flashcards',   label: 'Flashcards',   icon: '🃏' },
  { to: '/tests',        label: 'Tests',        icon: '📝' },
  { to: '/examen',       label: 'Examen',       icon: '🎯' },
  { to: '/estadisticas', label: 'Estadísticas', icon: '📊' },
  { to: '/perfil',       label: 'Perfil',       icon: '👤' },
]

export function SideNav() {
  return (
    <nav className="hidden md:flex flex-col w-56 min-h-screen bg-marca-900 text-white p-4 gap-1 shrink-0">
      <div className="text-xl font-bold text-marca-100 mb-6 px-3">OpoDAM 🚔</div>
      {LINKS.map(({ to, label, icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${isActive ? 'bg-white/10 text-white font-semibold' : 'text-white/70 hover:bg-white/5'}`
          }
        >
          <span>{icon}</span>
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
