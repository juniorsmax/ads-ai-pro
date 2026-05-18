import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import TopBar from '../components/shared/TopBar'
import KPICard from '../components/dashboard/KPICard'
import PerformanceChart from '../components/dashboard/PerformanceChart'
import CampaignTable from '../components/dashboard/CampaignTable'
import AlertBadge from '../components/dashboard/AlertBadge'
import ChatPanel from '../components/chat/ChatPanel'
import LoadingState from '../components/shared/LoadingState'
import { useCuentaStore } from '../store/cuentaStore'
import { getResumenCuenta } from '../api/accounts'
import { getDailyMetrics } from '../api/campaigns'
import { getPacing } from '../api/auditoria'
import { analytics } from '../lib/analytics'

const fmt = (n, dec = 0) => n != null ? n.toLocaleString('es-ES', { maximumFractionDigits: dec }) : '—'

function PacingWidget({ cuentaActivaId }) {
  const { data } = useQuery({
    queryKey: ['pacing', cuentaActivaId],
    queryFn: () => getPacing(cuentaActivaId),
    enabled: !!cuentaActivaId,
    retry: false,
    staleTime: 10 * 60 * 1000,
  })

  if (!data) return null

  const hoy = new Date()
  const diasMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).getDate()
  const diasTranscurridos = hoy.getDate()
  const porcentajeGastado = data.presupuestoMes > 0 ? (data.gastoActual / data.presupuestoMes) * 100 : 0
  const pacingIdeal = (diasTranscurridos / diasMes) * 100
  const desviacion = porcentajeGastado - pacingIdeal
  const estado = desviacion > 10 ? 'overpacing' : desviacion < -10 ? 'underpacing' : 'ok'

  const colorBarra = estado === 'overpacing' ? 'bg-red-500' : estado === 'underpacing' ? 'bg-yellow-500' : 'bg-green-500'
  const etiqueta   = estado === 'overpacing' ? 'Overpacing' : estado === 'underpacing' ? 'Underpacing' : 'En ritmo'
  const colorEtiq  = estado === 'overpacing' ? 'text-red-400' : estado === 'underpacing' ? 'text-yellow-400' : 'text-green-400'

  return (
    <div className="bg-slate-900 border border-slate-800 border-l-2 border-l-blue-600 rounded-xl px-5 py-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-slate-500 uppercase tracking-wider">Budget Pacing</p>
        <span className={`text-xs font-medium ${colorEtiq}`}>{etiqueta}</span>
      </div>
      <div className="flex items-baseline gap-2 mb-2">
        <p className="text-lg font-bold text-white">€{fmt(data.gastoActual, 0)}</p>
        <p className="text-sm text-slate-500">de €{fmt(data.presupuestoMes, 0)}</p>
      </div>
      <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden mb-1">
        <div className={`h-full rounded-full transition-all ${colorBarra}`} style={{ width: `${Math.min(porcentajeGastado, 100)}%` }} />
      </div>
      <div className="flex justify-between text-xs text-slate-600">
        <span>{fmt(porcentajeGastado, 0)}% gastado</span>
        <span>Día {diasTranscurridos}/{diasMes}</span>
      </div>
    </div>
  )
}

function mapearEstado(status, cpa, avgCpa) {
  if (status === 'paused') return 'pausada'
  if (cpa > 0 && avgCpa > 0 && cpa > avgCpa * 2) return 'alerta'
  return 'activa'
}

export default function Dashboard() {
  const cuentaActivaId = useCuentaStore(s => s.cuentaActivaId)

  const { data: resumen, isLoading: cargandoResumen } = useQuery({
    queryKey: ['resumen', cuentaActivaId],
    queryFn: () => getResumenCuenta(cuentaActivaId),
    enabled: !!cuentaActivaId,
  })

  const { data: dailyData, isLoading: cargandoDaily } = useQuery({
    queryKey: ['daily', cuentaActivaId],
    queryFn: () => getDailyMetrics(cuentaActivaId),
    enabled: !!cuentaActivaId,
  })

  const kpis = resumen ? [
    { titulo: 'Gasto total', valor: `€${fmt(resumen.totalCost, 0)}`, cambio: null, color: 'blue' },
    { titulo: 'Conversiones', valor: fmt(resumen.totalConversions, 0), cambio: null, color: 'green' },
    { titulo: 'CPA medio', valor: `€${fmt(resumen.avgCPA, 2)}`, cambio: null, color: 'yellow' },
    { titulo: 'ROAS', valor: `${fmt(resumen.overallROAS, 2)}x`, cambio: null, color: 'green' },
  ] : []

  const avgCpa = resumen?.avgCPA ?? 0
  const campanas = (resumen?.campaigns ?? []).map(c => ({
    nombre: c.name,
    estado: mapearEstado(c.status, c.cpa, avgCpa),
    gasto: `€${fmt(c.cost, 0)}`,
    conversiones: fmt(c.conversions, 0),
    cpa: c.cpa > 0 ? `€${fmt(c.cpa, 2)}` : '—',
    tendencia: '—',
  }))

  if (!cuentaActivaId) {
    return (
      <div>
        <TopBar title="Dashboard" subtitle="Resumen de rendimiento" />
        <div className="p-6 flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-slate-300 font-medium mb-2">No hay cuenta seleccionada</p>
            <a href="/onboarding" className="text-blue-400 text-sm hover:underline">Conectar cuenta de Google Ads →</a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full">
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar title="Dashboard" subtitle={resumen?.dateRange ?? 'Cargando...'} />
        <div className="flex-1 p-6 space-y-6 overflow-y-auto">

          {cargandoResumen && <LoadingState mensaje="Cargando datos de Google Ads..." />}

          {!cargandoResumen && resumen && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {kpis.map((kpi, i) => <KPICard key={i} {...kpi} />)}
              </div>

              <PacingWidget cuentaActivaId={cuentaActivaId} />

              <PerformanceChart datos={dailyData?.datos} cargando={cargandoDaily} />

              {resumen.anomalies?.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-slate-500 uppercase tracking-wider">Alertas activas</p>
                  {resumen.anomalies.map((a, i) => {
                    analytics.alertViewed(a.id ?? i, a.tipo ?? 'kpi', a.level ?? 'aviso', cuentaActivaId)
                    return <AlertBadge key={i} severidad={a.level ?? 'aviso'} mensaje={a.message ?? a} />
                  })}
                </div>
              )}

              <CampaignTable campanas={campanas} />
            </>
          )}
        </div>
      </div>
      <div className="w-80 hidden xl:flex flex-col border-l border-slate-800 p-4">
        <ChatPanel cuentaId={cuentaActivaId} />
      </div>
    </div>
  )
}
