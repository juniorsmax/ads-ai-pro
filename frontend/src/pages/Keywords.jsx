import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import TopBar from '../components/shared/TopBar'
import PageTabs from '../components/shared/PageTabs'
import LoadingState from '../components/shared/LoadingState'
import { useCuentaStore } from '../store/cuentaStore'
import { getKeywords } from '../api/keywords'
import { getQSHistorico, getNgramas } from '../api/auditoria'
import { analytics } from '../lib/analytics'

const fmt = (n, dec = 2) => n != null ? n.toLocaleString('es-ES', { maximumFractionDigits: dec }) : '—'

const MATCH_LABEL  = { EXACT: 'Exacta', PHRASE: 'Frase', BROAD: 'Amplia' }
const MATCH_ESTILO = {
  EXACT:  'bg-blue-900/40 text-blue-300 border-blue-800',
  PHRASE: 'bg-purple-900/40 text-purple-300 border-purple-800',
  BROAD:  'bg-slate-800 text-slate-400 border-slate-700',
}
const ORDEN_OPCIONES = [
  { id: 'cost',    label: 'Mayor gasto' },
  { id: 'cpa',     label: 'Mayor CPA' },
  { id: 'ctr_asc', label: 'Menor CTR' },
  { id: 'qs_asc',  label: 'Menor QS' },
]
const TABS = [
  { id: 'keywords',    label: 'Keywords' },
  { id: 'qs-historico', label: 'QS Histórico', nuevo: true },
  { id: 'ngramas',     label: 'N-Gramas', nuevo: true },
]

function QSBadge({ qs }) {
  if (!qs) return <span className="text-slate-600">—</span>
  const color = qs >= 7 ? 'text-green-400' : qs >= 4 ? 'text-yellow-400' : 'text-red-400'
  return <span className={`font-bold ${color}`}>{qs}/10</span>
}

function SinCuenta() {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
      <p className="text-slate-400">Selecciona una cuenta en la barra superior para continuar.</p>
    </div>
  )
}

function TabKeywords({ cuentaActivaId }) {
  const [orden, setOrden] = useState('cost')
  const [filtroTexto, setFiltroTexto] = useState('')

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['keywords', cuentaActivaId],
    queryFn: () => getKeywords(cuentaActivaId),
    enabled: !!cuentaActivaId,
  })

  const keywords = (data?.keywords ?? [])
    .filter(k => !filtroTexto || k.text.toLowerCase().includes(filtroTexto.toLowerCase()))
    .sort((a, b) => {
      if (orden === 'cost')    return b.cost - a.cost
      if (orden === 'cpa')     return b.cpa - a.cpa
      if (orden === 'ctr_asc') return a.ctr - b.ctr
      if (orden === 'qs_asc')  return (a.qualityScore ?? 10) - (b.qualityScore ?? 10)
      return 0
    })

  const totalKeywords = data?.keywords?.length ?? 0
  const sinConversiones = (data?.keywords ?? []).filter(k => k.conversions === 0).length
  const cpaMedio = keywords.filter(k => k.cpa > 0).reduce((s, k) => s + k.cpa, 0) / (keywords.filter(k => k.cpa > 0).length || 1)

  if (!cuentaActivaId) return <SinCuenta />
  if (isLoading) return <LoadingState mensaje="Cargando keywords desde Google Ads..." />
  if (isError) return (
    <div className="px-4 py-3 bg-red-900/40 border border-red-700 rounded-xl text-red-300 text-sm">
      {error?.message ?? 'Error cargando keywords'}
    </div>
  )

  return (
    <>
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-500 mb-1">Keywords analizadas</p>
          <p className="text-2xl font-bold text-white">{totalKeywords}</p>
          <p className="text-xs text-slate-500 mt-1">con gasto &gt; 5€</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-500 mb-1">Sin conversiones</p>
          <p className="text-2xl font-bold text-red-400">{sinConversiones}</p>
          <p className="text-xs text-slate-500 mt-1">candidatas a pausar</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-500 mb-1">CPA medio</p>
          <p className="text-2xl font-bold text-white">€{fmt(cpaMedio)}</p>
          <p className="text-xs text-slate-500 mt-1">de keywords con conv.</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={filtroTexto}
          onChange={e => setFiltroTexto(e.target.value)}
          placeholder="Buscar keyword..."
          className="flex-1 bg-slate-900 border border-slate-800 text-white text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500 placeholder:text-slate-600"
        />
        <div className="flex gap-2 flex-wrap">
          {ORDEN_OPCIONES.map(o => (
            <button
              key={o.id}
              onClick={() => { setOrden(o.id); analytics.keywordsFiltered(o.id) }}
              className={`text-xs px-3 py-2 rounded-lg border transition-colors ${
                orden === o.id
                  ? 'bg-blue-600 border-blue-500 text-white'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-600 hover:text-white'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {keywords.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
          <p className="text-slate-400 text-sm">
            {filtroTexto ? 'No hay keywords que coincidan.' : 'No se encontraron keywords con datos suficientes.'}
          </p>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between">
            <p className="text-xs text-slate-500 uppercase tracking-wider">
              {keywords.length} keyword{keywords.length !== 1 ? 's' : ''}
              {filtroTexto && ` · filtradas de ${totalKeywords}`}
            </p>
            {data.fromCache && <span className="text-xs text-slate-600">caché</span>}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-500 uppercase border-b border-slate-800">
                  <th className="text-left px-5 py-3 font-normal">Keyword</th>
                  <th className="text-left px-3 py-3 font-normal">Tipo</th>
                  <th className="text-right px-3 py-3 font-normal">Gasto</th>
                  <th className="text-right px-3 py-3 font-normal">Conv.</th>
                  <th className="text-right px-3 py-3 font-normal">CPA</th>
                  <th className="text-right px-3 py-3 font-normal">CTR</th>
                  <th className="text-right px-5 py-3 font-normal">QS</th>
                </tr>
              </thead>
              <tbody>
                {keywords.map((k, i) => {
                  const sinConv = k.conversions === 0
                  const cpaMalo = k.cpa > 0 && k.cpa > cpaMedio * 2
                  return (
                    <tr key={i} className={`border-t border-slate-800 hover:bg-slate-800/40 transition-colors ${sinConv ? 'opacity-70' : ''}`}>
                      <td className="px-5 py-3">
                        <span className="text-white font-medium">{k.text}</span>
                        {sinConv && <span className="ml-2 text-xs text-red-400 border border-red-800 rounded px-1">sin conv.</span>}
                      </td>
                      <td className="px-3 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded border ${MATCH_ESTILO[k.matchType] ?? MATCH_ESTILO.BROAD}`}>
                          {MATCH_LABEL[k.matchType] ?? k.matchType}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right text-slate-300 tabular-nums">€{fmt(k.cost)}</td>
                      <td className="px-3 py-3 text-right text-slate-300 tabular-nums">{fmt(k.conversions, 0)}</td>
                      <td className={`px-3 py-3 text-right tabular-nums font-medium ${cpaMalo ? 'text-red-400' : sinConv ? 'text-slate-600' : 'text-slate-300'}`}>
                        {k.cpa > 0 ? `€${fmt(k.cpa)}` : '—'}
                      </td>
                      <td className="px-3 py-3 text-right text-slate-300 tabular-nums">
                        {k.ctr > 0 ? `${(k.ctr * 100).toFixed(2)}%` : '—'}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <QSBadge qs={k.qualityScore} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  )
}

function TabQSHistorico({ cuentaActivaId }) {
  const { data, isLoading } = useQuery({
    queryKey: ['qs-historico', cuentaActivaId],
    queryFn: () => getQSHistorico(cuentaActivaId),
    enabled: !!cuentaActivaId,
    retry: false,
  })

  if (!cuentaActivaId) return <SinCuenta />

  if (isLoading) return <LoadingState mensaje="Cargando histórico de Quality Score..." />

  if (!data || data.registros?.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-64 text-center">
        <div className="w-14 h-14 bg-slate-800 border border-slate-700 rounded-2xl flex items-center justify-center mb-4 text-2xl">◎</div>
        <p className="text-white font-semibold mb-2">Histórico de Quality Score</p>
        <p className="text-slate-400 text-sm mb-3 max-w-sm">
          El sistema almacenará el Quality Score de tus keywords cada día para que puedas ver la evolución y detectar bajadas.
        </p>
        <div className="px-3 py-2 bg-slate-800 rounded-lg border border-slate-700 mb-3">
          <p className="text-xs text-slate-500 font-mono">GET /api/auditoria/qs-historico/:cuentaId</p>
        </div>
        <p className="text-xs text-slate-600">Los datos comenzarán a acumularse automáticamente con el cron diario.</p>
      </div>
    )
  }

  const colores = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#a855f7']

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-500 mb-1">QS medio actual</p>
          <p className="text-2xl font-bold text-white">{data.qsMedioActual ?? '—'}<span className="text-sm text-slate-500">/10</span></p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-500 mb-1">Keywords con QS &lt; 5</p>
          <p className="text-2xl font-bold text-red-400">{data.bajoQS ?? 0}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-500 mb-1">Días de histórico</p>
          <p className="text-2xl font-bold text-white">{data.diasHistorico ?? 0}</p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <p className="text-xs text-slate-500 uppercase tracking-wider mb-4">Evolución de QS — top 5 keywords</p>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={data.registros}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="fecha" tick={{ fill: '#64748b', fontSize: 11 }} />
            <YAxis domain={[0, 10]} tick={{ fill: '#64748b', fontSize: 11 }} />
            <Tooltip
              contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8 }}
              labelStyle={{ color: '#94a3b8' }}
            />
            {data.keywords?.slice(0, 5).map((kw, i) => (
              <Line key={kw} type="monotone" dataKey={kw} stroke={colores[i]} strokeWidth={2} dot={false} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function TabNgramas({ cuentaActivaId }) {
  const { data, isLoading } = useQuery({
    queryKey: ['ngramas', cuentaActivaId],
    queryFn: () => getNgramas(cuentaActivaId),
    enabled: !!cuentaActivaId,
    retry: false,
  })

  if (!cuentaActivaId) return <SinCuenta />
  if (isLoading) return <LoadingState mensaje="Analizando search terms..." />

  if (!data || data.ngramas?.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-64 text-center">
        <div className="w-14 h-14 bg-slate-800 border border-slate-700 rounded-2xl flex items-center justify-center mb-4 text-2xl">⌖</div>
        <p className="text-white font-semibold mb-2">Análisis N-Gramas</p>
        <p className="text-slate-400 text-sm mb-3 max-w-sm">
          Detecta automáticamente palabras de 1-3 términos en tus search terms que generan gasto sin conversiones. Candidatas ideales para añadir como negativas.
        </p>
        <div className="px-3 py-2 bg-slate-800 rounded-lg border border-slate-700 mb-3">
          <p className="text-xs text-slate-500 font-mono">GET /api/auditoria/ngramas/:cuentaId</p>
        </div>
        <p className="text-xs text-slate-600">Requiere acceso al Search Terms Report de Google Ads.</p>
      </div>
    )
  }

  const totalGasto = data.ngramas.reduce((s, n) => s + (n.gasto ?? 0), 0)

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-500 mb-1">N-gramas detectados</p>
          <p className="text-2xl font-bold text-white">{data.ngramas.length}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-500 mb-1">Gasto sin conversión</p>
          <p className="text-2xl font-bold text-red-400">€{fmt(totalGasto, 0)}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-500 mb-1">Negativas sugeridas</p>
          <p className="text-2xl font-bold text-yellow-400">{data.ngramas.filter(n => n.sugeridaNegativa).length}</p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between">
          <p className="text-xs text-slate-500 uppercase tracking-wider">Terms con mayor gasto sin conversión</p>
          <button className="text-xs text-blue-400 hover:text-blue-300">Exportar CSV</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-500 uppercase border-b border-slate-800">
                <th className="text-left px-5 py-3 font-normal">Término</th>
                <th className="text-right px-3 py-3 font-normal">Apariciones</th>
                <th className="text-right px-3 py-3 font-normal">Gasto</th>
                <th className="text-right px-3 py-3 font-normal">Conv.</th>
                <th className="text-right px-5 py-3 font-normal">Acción</th>
              </tr>
            </thead>
            <tbody>
              {data.ngramas.map((n, i) => (
                <tr key={i} className="border-t border-slate-800 hover:bg-slate-800/40 transition-colors">
                  <td className="px-5 py-3">
                    <span className="text-white font-medium font-mono">{n.termino}</span>
                    {n.sugeridaNegativa && (
                      <span className="ml-2 text-xs text-orange-400 border border-orange-800 rounded px-1">negativa</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-right text-slate-300 tabular-nums">{n.apariciones}</td>
                  <td className="px-3 py-3 text-right text-red-400 tabular-nums font-medium">€{fmt(n.gasto)}</td>
                  <td className="px-3 py-3 text-right text-slate-300 tabular-nums">{n.conversiones ?? 0}</td>
                  <td className="px-5 py-3 text-right">
                    <button className="text-xs px-2 py-1 border border-orange-700 text-orange-400 hover:bg-orange-900/30 rounded transition-colors">
                      + Añadir negativa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default function Keywords() {
  const cuentaActivaId = useCuentaStore(s => s.cuentaActivaId)
  const [tab, setTab] = useState('keywords')

  return (
    <div>
      <TopBar title="Keywords" subtitle="Análisis de palabras clave — últimos 30 días" />
      <PageTabs tabs={TABS} active={tab} onChange={setTab} />
      <div className="p-4 md:p-6 space-y-5 max-w-6xl">
        {tab === 'keywords'     && <TabKeywords     cuentaActivaId={cuentaActivaId} />}
        {tab === 'qs-historico' && <TabQSHistorico  cuentaActivaId={cuentaActivaId} />}
        {tab === 'ngramas'      && <TabNgramas      cuentaActivaId={cuentaActivaId} />}
      </div>
    </div>
  )
}
