import TopBar from '../components/shared/TopBar'
import KPICard from '../components/dashboard/KPICard'
import PerformanceChart from '../components/dashboard/PerformanceChart'
import CampaignTable from '../components/dashboard/CampaignTable'
import AlertBadge from '../components/dashboard/AlertBadge'
import ChatPanel from '../components/chat/ChatPanel'

const KPI_DATOS = [
  { titulo: 'Gasto total', valor: '€970', cambio: 12, color: 'blue' },
  { titulo: 'Conversiones', valor: '51', cambio: 18, color: 'green' },
  { titulo: 'CPA medio', valor: '€19.02', cambio: -5, color: 'yellow' },
  { titulo: 'ROAS', valor: '3.4x', cambio: 8, color: 'green' },
]

const ALERTAS = [
  { severidad: 'critico', mensaje: 'Campaña "PMax — General" tiene CPA un 200% por encima del objetivo. Acción requerida.' },
  { severidad: 'aviso', mensaje: 'Campaña "Captación — Madrid" bajó CTR un 3% esta semana.' },
  { severidad: 'info', mensaje: 'Presupuesto mensual consumido al 68%. Ritmo normal.' },
]

export default function Dashboard() {
  return (
    <div className="flex h-full">
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar
          title="Dashboard"
          subtitle="Resumen de rendimiento — Mayo 2026"
        />
        <div className="flex-1 p-6 space-y-6 overflow-y-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {KPI_DATOS.map((kpi, i) => <KPICard key={i} {...kpi} />)}
          </div>
          <PerformanceChart />
          <div className="space-y-2">
            <p className="text-xs text-slate-500 uppercase tracking-wider">Alertas activas</p>
            {ALERTAS.map((a, i) => <AlertBadge key={i} {...a} />)}
          </div>
          <CampaignTable />
        </div>
      </div>
      <div className="w-80 hidden xl:flex flex-col border-l border-slate-800 p-4">
        <ChatPanel />
      </div>
    </div>
  )
}
