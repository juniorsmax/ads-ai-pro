function ScoreBadge({ puntuacion }) {
  const color = puntuacion >= 80 ? 'text-green-400' : puntuacion >= 60 ? 'text-yellow-400' : 'text-red-400'
  return <span className={`text-lg font-bold ${color}`}>{puntuacion}</span>
}

function CharCounter({ chars, limite }) {
  const excede = chars > limite
  return (
    <span className={`text-xs ${excede ? 'text-red-400' : 'text-slate-500'}`}>
      {chars}/{limite} {excede ? '⚠ excede límite' : ''}
    </span>
  )
}

export default function CopyCard({ copy, tipo = 'headline', limite }) {
  const { texto, chars, puntuacion, nota, excedeLimite } = copy

  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
      excedeLimite ? 'border-red-700 bg-red-900/20' : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
    }`}>
      <ScoreBadge puntuacion={puntuacion ?? 0} />
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-medium truncate">{texto}</p>
        {nota && <p className="text-slate-500 text-xs mt-0.5">{nota}</p>}
        <CharCounter chars={chars ?? texto?.length ?? 0} limite={limite} />
      </div>
      <button
        onClick={() => navigator.clipboard.writeText(texto)}
        className="text-slate-500 hover:text-slate-300 text-xs shrink-0"
        title="Copiar"
      >
        ⎘
      </button>
    </div>
  )
}
