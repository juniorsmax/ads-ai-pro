import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { API } from '../api/client'

const PLATFORM_META = {
  google_ads:       { label: 'Google Ads',   color: '#4285F4', icon: '🔵' },
  facebook_ads:     { label: 'Facebook Ads', color: '#1877F2', icon: '🔷' },
  google_analytics: { label: 'Google Analytics 4', color: '#E37400', icon: '🟠' },
  linkedin_ads:     { label: 'LinkedIn Ads', color: '#0A66C2', icon: '🔹' },
}

const DATE_RANGES = [
  { value: 'last_7_days',  label: 'Últimos 7 días' },
  { value: 'last_30_days', label: 'Últimos 30 días' },
  { value: 'last_90_days', label: 'Últimos 90 días' },
  { value: 'this_month',   label: 'Este mes' },
  { value: 'last_month',   label: 'Mes anterior' },
]

async function fetchMultiPlatform(accounts, dateRange) {
  return API.post('/supermetrics/multiplatform', { accounts, dateRange })
}

function PlatformCard({ platform, result }) {
  const meta = PLATFORM_META[platform] ?? { label: platform, color: '#64748b', icon: '📊' }

  if (result.error) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 opacity-60">
        <div className="flex items-center gap-2 mb-2">
          <span>{meta.icon}</span>
          <span className="text-white font-medium text-sm">{meta.label}</span>
        </div>
        <p className="text-red-400 text-xs">{result.error}</p>
      </div>
    )
  }

  const rows = result.data?.data ?? []
  const totalSpend = rows.reduce((s, r) => s + parseFloat(r.spend ?? r.cost ?? 0), 0)
  const totalClicks = rows.reduce((s, r) => s + parseInt(r.clicks ?? 0, 10), 0)
  const totalConv = rows.reduce((s, r) => s + parseInt(r.conversions ?? r.actions ?? 0, 10), 0)

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <span>{meta.icon}</span>
        <span className="text-white font-medium text-sm">{meta.label}</span>
        <span className="ml-auto text-xs text-green-400 bg-green-900 px-2 py-0.5 rounded-full">Conectado</span>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-lg font-bold text-white">{totalSpend.toFixed(0)}€</p>
          <p className="text-xs text-slate-400">Gasto</p>
        </div>
        <div>
          <p className="text-lg font-bold text-white">{totalClicks.toLocaleString()}</p>
          <p className="text-xs text-slate-400">Clics</p>
        </div>
        <div>
          <p className="text-lg font-bold text-white">{totalConv.toLocaleString()}</p>
          <p className="text-xs text-slate-400">Conv.</p>
        </div>
      </div>
    </div>
  )
}

function AccountsForm({ onSubmit }) {
  const [accounts, setAccounts] = useState({ googleAds: '', facebookAds: '', ga4: '', linkedinAds: '' })

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 max-w-lg mx-auto">
      <h2 className="text-white font-bold text-lg mb-1">Configurar cuentas</h2>
      <p className="text-slate-400 text-sm mb-4">Introduce los IDs de cuenta de cada plataforma. Deja vacío lo que no uses.</p>
      <div className="space-y-3">
        {[
          { key: 'googleAds',   label: 'Google Ads — ID de cliente (ej: 123-456-7890)' },
          { key: 'facebookAds', label: 'Facebook Ads — Account ID (ej: act_123456789)' },
          { key: 'ga4',         label: 'Google Analytics 4 — Property ID (ej: 123456789)' },
          { key: 'linkedinAds', label: 'LinkedIn Ads — Account ID (ej: 123456789)' },
        ].map(({ key, label }) => (
          <div key={key}>
            <label className="text-slate-300 text-xs block mb-1">{label}</label>
            <input
              type="text"
              value={accounts[key]}
              onChange={e => setAccounts(a => ({ ...a, [key]: e.target.value }))}
              placeholder="—"
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
        ))}
      </div>
      <button
        onClick={() => onSubmit(Object.fromEntries(Object.entries(accounts).filter(([, v]) => v.trim())))}
        className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2 text-sm font-medium transition-colors"
      >
        Ver datos multi-plataforma
      </button>
    </div>
  )
}

export default function MultiPlatform() {
  const [accounts, setAccounts] = useState(null)
  const [dateRange, setDateRange] = useState('last_30_days')

  const { data, isLoading, error } = useQuery({
    queryKey: ['supermetrics-multi', accounts, dateRange],
    queryFn: () => fetchMultiPlatform(accounts, dateRange),
    enabled: !!accounts,
    staleTime: 30 * 60_000,
    retry: 1,
  })

  // Preparar datos para la gráfica comparativa
  const chartData = data
    ? Object.entries(data).map(([platform, result]) => {
        const meta = PLATFORM_META[platform] ?? { label: platform }
        const rows = result.data?.data ?? []
        return {
          name: meta.label,
          gasto: rows.reduce((s, r) => s + parseFloat(r.spend ?? r.cost ?? 0), 0).toFixed(0),
          clics: rows.reduce((s, r) => s + parseInt(r.clicks ?? 0, 10), 0),
          conversiones: rows.reduce((s, r) => s + parseInt(r.conversions ?? r.actions ?? 0, 10), 0),
        }
      })
    : []

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Multi-plataforma</h1>
          <p className="text-slate-400 text-sm mt-1">Google Ads + Facebook Ads + LinkedIn + GA4 en una vista unificada</p>
        </div>
        {accounts && (
          <div className="flex items-center gap-2">
            <select
              value={dateRange}
              onChange={e => setDateRange(e.target.value)}
              className="bg-slate-700 border border-slate-600 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
            >
              {DATE_RANGES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
            <button
              onClick={() => setAccounts(null)}
              className="text-slate-400 hover:text-white text-sm px-3 py-2 rounded-lg hover:bg-slate-700 transition-colors"
            >
              Cambiar cuentas
            </button>
          </div>
        )}
      </div>

      {!accounts && <AccountsForm onSubmit={setAccounts} />}

      {accounts && isLoading && (
        <div className="flex items-center justify-center h-48">
          <div className="text-slate-400">Cargando datos de todas las plataformas...</div>
        </div>
      )}

      {accounts && error && (
        <div className="bg-red-950 border border-red-800 rounded-xl p-4 text-red-400 text-sm">
          {error.message}
        </div>
      )}

      {data && (
        <>
          {/* Cards por plataforma */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(data).map(([platform, result]) => (
              <PlatformCard key={platform} platform={platform} result={result} />
            ))}
          </div>

          {/* Gráfica comparativa */}
          {chartData.length > 0 && (
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
              <h2 className="text-white font-semibold mb-4">Comparativa de plataformas</h2>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                    labelStyle={{ color: '#94a3b8' }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
                  <Bar dataKey="gasto"       fill="#3b82f6" name="Gasto (€)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="conversiones" fill="#22c55e" name="Conversiones" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Tabla detallada */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-900 text-slate-400">
                <tr>
                  <th className="text-left px-4 py-3">Plataforma</th>
                  <th className="text-right px-4 py-3">Gasto</th>
                  <th className="text-right px-4 py-3">Clics</th>
                  <th className="text-right px-4 py-3">Conversiones</th>
                  <th className="text-right px-4 py-3">CPC medio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {chartData.map(row => (
                  <tr key={row.name} className="text-white hover:bg-slate-700/50 transition-colors">
                    <td className="px-4 py-3">{row.name}</td>
                    <td className="px-4 py-3 text-right font-mono">{parseFloat(row.gasto).toLocaleString()}€</td>
                    <td className="px-4 py-3 text-right font-mono">{row.clics.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right font-mono">{row.conversiones.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right font-mono text-slate-400">
                      {row.clics > 0 ? `${(row.gasto / row.clics).toFixed(2)}€` : '—'}
                    </td>
                  </tr>
                ))}
                <tr className="bg-slate-700/30 font-bold text-white">
                  <td className="px-4 py-3">Total</td>
                  <td className="px-4 py-3 text-right font-mono">{chartData.reduce((s, r) => s + parseFloat(r.gasto), 0).toFixed(0)}€</td>
                  <td className="px-4 py-3 text-right font-mono">{chartData.reduce((s, r) => s + r.clics, 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right font-mono">{chartData.reduce((s, r) => s + r.conversiones, 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-slate-400">—</td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
