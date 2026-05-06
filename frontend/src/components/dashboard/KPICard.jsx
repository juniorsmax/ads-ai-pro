export default function KPICard({ titulo, valor, cambio, unidad = '', color = 'blue' }) {
  const positivo = cambio >= 0
  const colorMap = {
    blue: 'border-blue-600',
    green: 'border-green-500',
    red: 'border-red-500',
    yellow: 'border-yellow-500',
  }

  return (
    <div className={`bg-slate-900 border border-slate-800 border-l-2 ${colorMap[color]} rounded-xl p-5`}>
      <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">{titulo}</p>
      <p className="text-2xl font-bold text-white">
        {unidad}{valor}
      </p>
      {cambio !== undefined && (
        <p className={`text-xs mt-1 ${positivo ? 'text-green-400' : 'text-red-400'}`}>
          {positivo ? '▲' : '▼'} {Math.abs(cambio)}% vs período anterior
        </p>
      )}
    </div>
  )
}
