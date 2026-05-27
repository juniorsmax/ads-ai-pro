import { NavLink } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getUsageIA } from '../../api/ai'
import { getUsuarioLocal } from '../../api/auth'

const NAV_GROUPS = [
  {
    label: 'Inicio',
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: '◈' },
    ],
  },
  {
    label: 'Campañas',
    items: [
      { to: '/campaigns', label: 'Campañas', icon: '◉' },
      { to: '/keywords', label: 'Keywords', icon: '◎' },
      { to: '/optimizer', label: 'Optimizador', icon: '↕' },
    ],
  },
  {
    label: 'Contenido',
    items: [
      { to: '/copywriter', label: 'Copywriter', icon: '✎' },
      { to: '/competitors', label: 'Competidores', icon: '⊕' },
    ],
  },
  {
    label: 'Análisis',
    items: [
      { to: '/reports', label: 'Reportes', icon: '◷' },
      { to: '/multiplatform', label: 'Multi-canal', icon: '⊞' },
      { to: '/auditoria', label: 'Auditoría', icon: '✦', nuevo: true },
      { to: '/forecast', label: 'Predicciones IA', icon: '◈', nuevo: true },
    ],
  },
  {
    label: 'Automatización',
    items: [
      { to: '/automation', label: 'Autopilot', icon: '⚡', nuevo: true },
    ],
  },
]

const NAV_SISTEMA = [
  { to: '/server', label: 'Servidor VPS', icon: '⬡' },
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
      <div className="hidden md:block mx-2 px-3 py-2 rounded-lg bg-red-950 border border-red-800">
        <p className="text-xs text-red-400 font-medium">IA pausada</p>
        <p className="text-xs text-red-500">Límite diario alcanzado</p>
      </div>
    )
  }

  if (!limite) return null

  const color = porcentaje >= 90 ? 'bg-red-500' : porcentaje >= 70 ? 'bg-yellow-500' : 'bg-blue-500'

  return (
    <div className="hidden md:block mx-2 px-3 py-2">
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

function NavItem({ item }) {
  return (
    <NavLink
      to={item.to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
          isActive
            ? 'bg-blue-600 text-white'
            : 'text-slate-400 hover:text-white hover:bg-slate-800'
        }`
      }
    >
      <span className="text-base w-4 text-center shrink-0">{item.icon}</span>
      <span className="hidden md:flex items-center gap-2 min-w-0 flex-1">
        <span className="truncate">{item.label}</span>
        {item.nuevo && (
          <span className="text-xs px-1.5 py-0.5 bg-blue-600 text-white rounded-full leading-none shrink-0">
            Nuevo
          </span>
        )}
      </span>
    </NavLink>
  )
}

export default function Sidebar() {
  const usuario = getUsuarioLocal()
  const inicial = (usuario?.nombre ?? usuario?.email ?? 'U')[0].toUpperCase()

  return (
    <aside className="w-16 md:w-56 flex-shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col">
      <div className="p-4 border-b border-slate-800 shrink-0">
        <span className="hidden md:block text-lg font-bold text-white tracking-tight">
          ADSAI <span className="text-blue-400">PRO</span>
        </span>
        <span className="md:hidden text-lg font-bold text-blue-400">A</span>
      </div>

      <nav className="flex-1 px-2 py-3 overflow-y-auto space-y-5">
        {NAV_GROUPS.map(group => (
          <div key={group.label}>
            <p className="hidden md:block px-3 mb-1.5 text-xs text-slate-600 uppercase tracking-widest font-semibold">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map(item => <NavItem key={item.to} item={item} />)}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-slate-800 py-2 shrink-0">
        <p className="hidden md:block px-5 mb-1.5 text-xs text-slate-600 uppercase tracking-widest font-semibold">
          Sistema
        </p>
        <div className="px-2 space-y-0.5">
          {NAV_SISTEMA.map(item => <NavItem key={item.to} item={item} />)}
        </div>
        <UsageBadge />
        <div className="hidden md:flex items-center gap-2 px-5 py-2 mt-1">
          <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-xs text-white font-bold shrink-0">
            {inicial}
          </div>
          <div className="text-xs text-slate-400 min-w-0">
            <p className="text-white font-medium truncate">{usuario?.nombre ?? usuario?.email ?? '—'}</p>
            <p className="text-green-400 capitalize">{usuario?.plan ?? 'Sin plan'}</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
