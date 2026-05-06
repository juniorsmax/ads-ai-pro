import { useQuery } from '@tanstack/react-query'
import TopBar from '../components/shared/TopBar'
import LoadingState from '../components/shared/LoadingState'
import { useCuentaStore } from '../store/cuentaStore'
import { getCampanas } from '../api/campaigns'

const fmt = (n, dec = 0) => n != null ? n.toLocaleString('es-ES', { maximumFractionDigits: dec }) : '—'

const ESTADO_ESTILO = {
  activa: 'bg-green-500/20 text-green-400',
  pausada: 'bg-slate-700 text-slate-400',
  alerta: 'bg-red-500/20 text-red-400',
}

function estadoCampana(status, cpa, avgCpa) {
  if (status === 'paused') return 'pausada'
  if (cpa > 0 && avgCpa > 0 && cpa > avgCpa * 2) return 'alerta'
  return 'activa'
}

export default function Campaigns() {
  const cuentaActivaId = useCuentaStore(s => s.cuentaActivaId)

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['campanas', cuentaActivaId],
    queryFn: () => getCampanas(cuentaActivaId),
    enabled: !!cuentaActivaId,
  })

  const campanas = data?.campanas ?? []
  const avgCpa = campanas.length
    ? campanas.filter(c => c.cpa > 0).reduce((s, c) => s + c.cpa, 0) / (campanas.filter(c => c.cpa > 0).length || 1)
    : 0

  return (
    <div>
      <TopBar
        title="Campañas"
        subtitle="Gestión y métricas — últimos 30 días"
        actions={data?.fromCache && <span className="text-xs text-slate-600">caché</span>}
      />
      <div className="p-4 md:p-6">

        {!cuentaActivaId && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
            <p className="text-slate-400">Selecciona una cuenta en la barra superior para ver las campañas.</p>
          </div>
        )}

        {isLoading && <LoadingState mensaje="Cargando campañas desde Google Ads..." />}

        {isError && (
          <div className="px-4 py-3 bg-red-900/40 border border-red-700 rounded-xl text-red-300 text-sm">
            {error?.message ?? 'Error cargando campañas'}
          </div>
        )}

        {!isLoading && campanas.length === 0 && cuentaActivaId && !isError && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
            <p className="text-slate-400">No se encontraron campañas activas en los últimos 30 días.</p>
          </div>
        )}

        {campanas.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <p className="text-sm font-medium text-white">
                {campanas.length} campaña{campanas.length !== 1 ? 's' : ''}
              </p>
              <p className="text-xs text-slate-500">Últimos 30 días</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-slate-500 uppercase border-b border-slate-800">
                    <th className="text-left px-5 py-3 font-normal">Campaña</th>
                    <th className="text-left px-3 py-3 font-normal">Estado</th>
                    <th className="text-right px-3 py-3 font-normal">Gasto</th>
                    <th className="text-right px-3 py-3 font-normal">Conv.</th>
                    <th className="text-right px-3 py-3 font-normal">CPA</th>
                    <th className="text-right px-3 py-3 font-normal">CTR</th>
                    <th className="text-right px-5 py-3 font-normal">CPC medio</th>
                  </tr>
                </thead>
                <tbody>
                  {campanas.map((c, i) => {
                    const estado = estadoCampana(c.status, c.cpa, avgCpa)
                    return (
                      <tr key={i} className="border-t border-slate-800 hover:bg-slate-800/40 transition-colors">
                        <td className="px-5 py-3 text-white font-medium max-w-xs truncate">{c.name}</td>
                        <td className="px-3 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs ${ESTADO_ESTILO[estado]}`}>
                            {estado}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-right text-slate-300 tabular-nums">€{fmt(c.cost, 0)}</td>
                        <td className="px-3 py-3 text-right text-slate-300 tabular-nums">{fmt(c.conversions, 0)}</td>
                        <td className={`px-3 py-3 text-right tabular-nums font-medium ${estado === 'alerta' ? 'text-red-400' : 'text-slate-300'}`}>
                          {c.cpa > 0 ? `€${fmt(c.cpa, 2)}` : '—'}
                        </td>
                        <td className="px-3 py-3 text-right text-slate-300 tabular-nums">
                          {c.ctr > 0 ? `${(c.ctr * 100).toFixed(2)}%` : '—'}
                        </td>
                        <td className="px-5 py-3 text-right text-slate-300 tabular-nums">
                          {c.avgCpc > 0 ? `€${fmt(c.avgCpc, 2)}` : '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot className="border-t border-slate-700">
                  <tr className="text-xs text-slate-500">
                    <td className="px-5 py-3 font-medium text-slate-400">Total</td>
                    <td />
                    <td className="px-3 py-3 text-right font-medium text-slate-300 tabular-nums">
                      €{fmt(campanas.reduce((s, c) => s + (c.cost ?? 0), 0), 0)}
                    </td>
                    <td className="px-3 py-3 text-right font-medium text-slate-300 tabular-nums">
                      {fmt(campanas.reduce((s, c) => s + (c.conversions ?? 0), 0), 0)}
                    </td>
                    <td colSpan={3} />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
