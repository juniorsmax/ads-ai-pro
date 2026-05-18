export default function PageTabs({ tabs, active, onChange }) {
  return (
    <div className="flex border-b border-slate-800 bg-slate-900 overflow-x-auto shrink-0">
      {tabs.map(t => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`px-5 py-3 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors flex items-center gap-2 ${
            active === t.id
              ? 'border-blue-500 text-white'
              : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          {t.label}
          {t.nuevo && (
            <span className="text-xs px-1.5 py-0.5 bg-blue-600 text-white rounded-full leading-none">
              Nuevo
            </span>
          )}
        </button>
      ))}
    </div>
  )
}
