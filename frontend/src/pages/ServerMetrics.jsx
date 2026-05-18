import { useQuery } from '@tanstack/react-query'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { API } from '../api/client'

async function fetchVPSList()            { return API.get('/hostinger/vps') }
async function fetchMetrics(id)          { return API.get(`/hostinger/vps/${id}/metrics`) }
async function fetchHistory(id, period)  { return API.get(`/hostinger/vps/${id}/metrics/history?period=${period}`) }

function GaugeBar({ label, value, max = 100, unit = '%', color = 'blue' }) {
  const pct = Math.min(100, Math.round((value / max) * 100))
  const colorMap = {
    blue:   'bg-blue-500',
    green:  'bg-green-500',
    yellow: 'bg-yellow-500',
    red:    'bg-red-500',
  }
  const barColor = pct >= 90 ? colorMap.red : pct >= 70 ? colorMap.yellow : colorMap[color] ?? colorMap.blue

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-slate-400">{label}</span>
        <span className="text-white font-mono">{value}{unit}</span>
      </div>
      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function StatCard({ label, value, sub, icon }) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
      <div className="flex items-start justify-between mb-2">
        <span className="text-slate-400 text-sm">{label}</span>
        <span className="text-2xl">{icon}</span>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </div>
  )
}

export default function ServerMetrics() {
  const { data: vpsList, isLoading: loadingList, error: errorList } = useQuery({
    queryKey: ['hostinger-vps-list'],
    queryFn: fetchVPSList,
    retry: 1,
  })

  const vpsId = vpsList?.data?.[0]?.id ?? null

  const { data: metrics, isLoading: loadingMetrics } = useQuery({
    queryKey: ['hostinger-metrics', vpsId],
    queryFn: () => fetchMetrics(vpsId),
    enabled: !!vpsId,
    refetchInterval: 60_000, // refresco automático cada 60s
    retry: 1,
  })

  const { data: history } = useQuery({
    queryKey: ['hostinger-history', vpsId, 'day'],
    queryFn: () => fetchHistory(vpsId, 'day'),
    enabled: !!vpsId,
    staleTime: 5 * 60_000,
    retry: 1,
  })

  if (loadingList) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="text-slate-400">Conectando con Hostinger...</div>
      </div>
    )
  }

  if (errorList || !vpsList?.data?.length) {
    return (
      <div className="p-6">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 text-center max-w-lg mx-auto">
          <p className="text-4xl mb-4">🖥️</p>
          <h2 className="text-white text-xl font-bold mb-2">Servidor Hostinger no configurado</h2>
          <p className="text-slate-400 text-sm mb-4">
            Para ver las métricas de tu VPS, añade <code className="bg-slate-700 px-1 rounded">HOSTINGER_API_TOKEN</code> en las variables de entorno del backend.
          </p>
          <p className="text-slate-500 text-xs">
            Esta funcionalidad es exclusiva para clientes con VPS Hostinger y permite correlacionar el rendimiento del servidor con las conversiones de tus campañas.
          </p>
        </div>
      </div>
    )
  }

  const vps    = vpsList.data[0]
  const m      = metrics?.data ?? {}
  const cpuPct = m.cpu_usage_percent ?? 0
  const ramUsed = m.memory_used_mb ?? 0
  const ramTotal = m.memory_total_mb ?? 1
  const ramPct = Math.round((ramUsed / ramTotal) * 100)
  const diskPct = m.disk_usage_percent ?? 0
  const netIn   = m.network_in_mbps ?? 0
  const netOut  = m.network_out_mbps ?? 0
  const historyPoints = history?.data ?? []

  return (
    <div className="p-6 space-y-6">
      {/* Cabecera */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Servidor VPS</h1>
          <p className="text-slate-400 text-sm mt-1">{vps.hostname ?? vps.name} · {vps.ip_address ?? '—'}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${vps.status === 'running' ? 'bg-green-900 text-green-400' : 'bg-red-900 text-red-400'}`}>
          {vps.status === 'running' ? '● Activo' : '● Detenido'}
        </span>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="CPU" value={`${cpuPct}%`} sub={vps.cpu_cores ? `${vps.cpu_cores} núcleos` : null} icon="⚡" />
        <StatCard label="RAM" value={`${ramPct}%`} sub={`${ramUsed} / ${ramTotal} MB`} icon="🧠" />
        <StatCard label="Disco" value={`${diskPct}%`} sub={vps.disk_gb ? `${vps.disk_gb} GB total` : null} icon="💽" />
        <StatCard label="Red" value={`↑${netOut} / ↓${netIn}`} sub="Mbps" icon="🌐" />
      </div>

      {/* Gauges */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 space-y-4">
        <h2 className="text-white font-semibold">Uso en tiempo real</h2>
        <GaugeBar label="CPU" value={cpuPct} color="blue" />
        <GaugeBar label="RAM" value={ramPct} color="green" />
        <GaugeBar label="Disco" value={diskPct} color="yellow" />
      </div>

      {/* Gráfica de historial CPU */}
      {historyPoints.length > 0 && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <h2 className="text-white font-semibold mb-4">CPU — últimas 24h</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={historyPoints}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="time" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} domain={[0, 100]} unit="%" />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                labelStyle={{ color: '#94a3b8' }}
                itemStyle={{ color: '#60a5fa' }}
              />
              <Line type="monotone" dataKey="cpu" stroke="#60a5fa" strokeWidth={2} dot={false} name="CPU %" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Nota de correlación */}
      <div className="bg-blue-950 border border-blue-800 rounded-xl p-4">
        <p className="text-blue-300 text-sm font-medium mb-1">💡 Correlación servidor ↔ campañas</p>
        <p className="text-blue-400 text-xs">
          Si tu servidor tiene picos de CPU/RAM justo cuando llega tráfico de campañas, puede ser señal de que necesitas escalar antes del próximo lanzamiento. Revisa las horas con mayor conversión en el Dashboard y compáralas con los picos de carga del servidor.
        </p>
      </div>
    </div>
  )
}
