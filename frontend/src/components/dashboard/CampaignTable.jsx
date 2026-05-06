const CAMPANAS_DEMO = [
  { nombre: 'Marca — España', estado: 'activa', gasto: '€342', conversiones: 28, cpa: '€12.2', tendencia: '+8%' },
  { nombre: 'Captación — Madrid', estado: 'activa', gasto: '€218', conversiones: 14, cpa: '€15.6', tendencia: '-3%' },
  { nombre: 'PMax — General', estado: 'alerta', gasto: '€410', conversiones: 9, cpa: '€45.6', tendencia: '-22%' },
  { nombre: 'Remarketing', estado: 'pausada', gasto: '€0', conversiones: 0, cpa: '—', tendencia: '—' },
]

const ESTADO = {
  activa: 'bg-green-500/20 text-green-400',
  pausada: 'bg-slate-700 text-slate-400',
  alerta: 'bg-red-500/20 text-red-400',
}

export default function CampaignTable({ campanas = CAMPANAS_DEMO }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-800">
        <p className="text-sm font-medium text-white">Campañas activas</p>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs text-slate-500 uppercase">
            <th className="text-left px-5 py-3">Campaña</th>
            <th className="text-left px-3 py-3">Estado</th>
            <th className="text-right px-3 py-3">Gasto</th>
            <th className="text-right px-3 py-3">Conv.</th>
            <th className="text-right px-3 py-3">CPA</th>
            <th className="text-right px-5 py-3">Tendencia</th>
          </tr>
        </thead>
        <tbody>
          {campanas.map((c, i) => (
            <tr key={i} className="border-t border-slate-800 hover:bg-slate-800/50 transition-colors">
              <td className="px-5 py-3 text-white font-medium">{c.nombre}</td>
              <td className="px-3 py-3">
                <span className={`px-2 py-0.5 rounded-full text-xs ${ESTADO[c.estado]}`}>
                  {c.estado}
                </span>
              </td>
              <td className="px-3 py-3 text-right text-slate-300">{c.gasto}</td>
              <td className="px-3 py-3 text-right text-slate-300">{c.conversiones}</td>
              <td className="px-3 py-3 text-right text-slate-300">{c.cpa}</td>
              <td className={`px-5 py-3 text-right font-medium ${
                c.tendencia.startsWith('+') ? 'text-green-400' :
                c.tendencia.startsWith('-') ? 'text-red-400' : 'text-slate-500'
              }`}>{c.tendencia}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
