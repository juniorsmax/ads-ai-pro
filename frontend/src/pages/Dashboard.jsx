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
import { analytics } from '../lib/analytics'

const fmt = (n, dec = 0) => n != null ? n.toLocaleString('es-ES', { maximumFractionDigits: dec }) : '—'

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
