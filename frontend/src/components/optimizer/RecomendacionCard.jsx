const PRIORIDAD = {
  alta: { bg: 'border-red-700 bg-red-900/20', badge: 'bg-red-800 text-red-300', label: 'Alta prioridad' },
  media: { bg: 'border-yellow-700 bg-yellow-900/20', badge: 'bg-yellow-800 text-yellow-300', label: 'Media' },
  baja: { bg: 'border-slate-700 bg-slate-800/50', badge: 'bg-slate-700 text-slate-300', label: 'Baja' },
}

const TIPO_ICONO = {
  puja: '↕',
  presupuesto: '€',
  keyword: '🔑',
  estructura: '⚙',
}

export default function RecomendacionCard({ recomendacion, onAplicar }) {
  const { tipo, prioridad, titulo, descripcion, justificacion, impactoEstimado, aplicable } = recomendacion
  const estilo = PRIORIDAD[prioridad] ?? PRIORIDAD.media

  return (
    <div className={`border rounded-xl p-5 ${estilo.bg}`}>
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{TIPO_ICONO[tipo] ?? '•'}</span>
          <h3 className="text-white font-medium text-sm">{titulo}</h3>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${estilo.badge}`}>
          {estilo.label}
        </span>
      </div>

      <p className="text-slate-300 text-sm mb-2">{descripcion}</p>

      <div className="bg-slate-900/60 rounded-lg px-3 py-2 mb-3">
        <p className="text-xs text-slate-500 mb-0.5">Justificación</p>
        <p className="text-slate-400 text-xs">{justificacion}</p>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-green-400">
          Impacto estimado: {impactoEstimado}
        </span>
        {aplicable && onAplicar && (
          <button
            onClick={() => onAplicar(recomendacion)}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg transition-colors"
          >
            Aplicar →
          </button>
        )}
      </div>
    </div>
  )
}
