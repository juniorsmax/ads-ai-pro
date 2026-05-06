import { NavLink } from 'react-router-dom'

const ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: '◈' },
  { to: '/campaigns', label: 'Campañas', icon: '◉' },
  { to: '/optimizer', label: 'Optimizer', icon: '↕' },
  { to: '/competitors', label: 'Espía', icon: '⊕' },
  { to: '/settings', label: 'Ajustes', icon: '◌' },
]

export default function MobileNav() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-900 border-t border-slate-800 flex">
      {ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-xs transition-colors ${
              isActive ? 'text-blue-400' : 'text-slate-500'
            }`
          }
        >
          <span className="text-base">{item.icon}</span>
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
