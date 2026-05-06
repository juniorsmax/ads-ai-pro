export default function TopBar({ title, subtitle }) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900">
      <div>
        <h1 className="text-lg font-semibold text-white">{title}</h1>
        {subtitle && <p className="text-sm text-slate-400">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        <button className="text-sm text-slate-400 hover:text-white transition-colors">
          Última actualización: hace 5 min
        </button>
        <button className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors">
          Sincronizar
        </button>
      </div>
    </div>
  )
}
