import { NavLink } from 'react-router-dom'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: '◈' },
  { to: '/campaigns', label: 'Campañas', icon: '◉' },
  { to: '/keywords', label: 'Keywords', icon: '◎' },
  { to: '/optimizer', label: 'Optimizador', icon: '↕' },
  { to: '/copywriter', label: 'Copywriter', icon: '✎' },
  { to: '/reports', label: 'Reportes', icon: '◷' },
  { to: '/competitors', label: 'Competidores', icon: '⊕' },
]

const NAV_BOTTOM = [
  { to: '/billing', label: 'Facturación', icon: '€' },
  { to: '/settings', label: 'Ajustes', icon: '◌' },
]

export default function Sidebar() {
  return (
    <aside className="w-16 md:w-56 flex-shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col">
      <div className="p-4 border-b border-slate-800">
        <span className="hidden md:block text-lg font-bold text-white tracking-tight">
          ADSAI <span className="text-blue-400">PRO</span>
        </span>
        <span className="md:hidden text-lg font-bold text-blue-400">A</span>
      </div>

      <nav className="flex-1 p-2 space-y-1 mt-2 overflow-y-auto">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`
            }
          >
            <span className="text-base w-4 text-center">{item.icon}</span>
            <span className="hidden md:block">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-2 border-t border-slate-800 space-y-1">
        {NAV_BOTTOM.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`
            }
          >
            <span className="text-base w-4 text-center">{item.icon}</span>
            <span className="hidden md:block">{item.label}</span>
          </NavLink>
        ))}
        <div className="hidden md:flex items-center gap-2 px-3 py-2">
          <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-xs text-white font-bold shrink-0">
            F
          </div>
          <div className="text-xs text-slate-400 min-w-0">
            <p className="text-white font-medium truncate">Filiberto</p>
            <p className="text-green-400">Plan Agencia</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
