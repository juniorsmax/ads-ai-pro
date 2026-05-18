import { NavLink } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getUsageIA } from '../../api/ai'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: '◈' },
  { to: '/campaigns', label: 'Campañas', icon: '◉' },
  { to: '/keywords', label: 'Keywords', icon: '◎' },
  { to: '/optimizer', label: 'Optimizador', icon: '↕' },
  { to: '/copywriter', label: 'Copywriter', icon: '✎' },
  { to: '/reports', label: 'Reportes', icon: '◷' },
  { to: '/competitors',   label: 'Competidores',  icon: '⊕' },
  { to: '/multiplatform', label: 'Multi-canal',   icon: '⊞' },
  { to: '/server',        label: 'Servidor VPS',  icon: '⬡' },
]

const NAV_BOTTOM = [
  { to: '/billing', label: 'Facturación', icon: '€' },
  { to: '/settings', label: 'Ajustes', icon: '◌' },
]

function UsageBadge() {
  const { data } = useQuery({
    queryKey: ['ia-usage'],
    queryFn: getUsageIA,
    staleTime: 5 * 60 * 1000,
    retry: false,
  })

  if (!data) return null
  const { mensajes, iaPausada } = data
  const { usadas, limite, porcentaje } = mensajes

  if (iaPausada) {
    return (
      <div className="hidden md:block px-3 py-2 rounded-lg bg-red-950 border border-red-800">
        <p className="text-xs text-red-400 font-medium">IA pausada</p>
        <p className="text-xs text-red-500">Límite diario alcanzado</p>
      </div>
    )
  }

  if (!limite) return null  // plan ilimitado, no mostrar barra

  const color = porcentaje >= 90 ? 'bg-red-500' : porcentaje >= 70 ? 'bg-yellow-500' : 'bg-blue-500'

  return (
    <div className="hidden md:block px-3 py-2">
      <div className="flex justify-between text-xs text-slate-400 mb-1">
        <span>Mensajes IA</span>
        <span>{usadas}/{limite}</span>
      </div>
      <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${porcentaje}%` }} />
      </div>
    </div>
  )
}

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
        <UsageBadge />
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
