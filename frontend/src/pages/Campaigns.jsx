import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import TopBar from '../components/shared/TopBar'
import PageTabs from '../components/shared/PageTabs'
import LoadingState from '../components/shared/LoadingState'
import { useCuentaStore } from '../store/cuentaStore'
import { getCampanas } from '../api/campaigns'
import { getPacing, getAbTests } from '../api/auditoria'

const fmt = (n, dec = 0) => n != null ? n.toLocaleString('es-ES', { maximumFractionDigits: dec }) : '—'

const ESTADO_ESTILO = {
  activa:  'bg-green-500/20 text-green-400',
  pausada: 'bg-slate-700 text-slate-400',
  alerta:  'bg-red-500/20 text-red-400',
}

const TABS = [
  { id: 'campanas', label: 'Campañas' },
  { id: 'pacing',   label: 'Budget Pacing', nuevo: true },
  { id: 'abtests',  label: 'A/B Tests', nuevo: true },
]

function estadoCampana(status, cpa, avgCpa) {
  if (status === 'paused') return 'pausada'
  if (cpa > 0 && avgCpa > 0 && cpa > avgCpa * 2) return 'alerta'
  return 'activa'
}

function SinCuenta() {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
      <p className="text-slate-400">Selecciona una cuenta en la barra superior para continuar.</p>
    </div>
  )
}

function TabCampanas({ cuentaActivaId }) {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['campanas', cuentaActivaId],
    queryFn: () => getCampanas(cuentaActivaId),
    enabled: !!cuentaActivaId,
  })

  const campanas = data?.campanas ?? []
  const avgCpa = campanas.length
    ? campanas.filter(c => c.cpa > 0).reduce((s, c) => s + c.cpa, 0) / (campanas.filter(c => c.cpa > 0).length || 1)
    : 0

  if (!cuentaActivaId) return <SinCuenta />
  if (isLoading) return <LoadingState mensaje="Cargando campañas desde Google Ads..." />
  if (isError) return (
    <div className="px-4 py-3 bg-red-900/40 border border-red-700 rounded-xl text-red-300 text-sm">
      {error?.message ?? 'Error cargando campañas'}
    </div>
  )
  if (campanas.length === 0) return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
      <p className="text-slate-400">No se encontraron campañas activas en los últimos 30 días.</p>
    </div>
  )

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
        <p className="text-sm font-medium text-white">
          {campanas.length} campaña{campanas.length !== 1 ? 's' : ''}
        </p>
        <div className="flex items-center gap-3">
          {data?.fromCache && <span className="text-xs text-slate-600">caché</span>}
          <p className="text-xs text-slate-500">Últimos 30 días</p>
        </div>
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
                    <span className={`px-2 py-0.5 rounded-full text-xs ${ESTADO_ESTILO[estado]}`}>{estado}</span>
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
  )
}

function BarraPacing({ porcentaje, estado }) {
  const color = estado === 'overpacing' ? 'bg-red-500' : estado === 'underpacing' ? 'bg-yellow-500' : 'bg-green-500'
  const etiqueta = estado === 'overpacing' ? 'Overpacing' : estado === 'underpacing' ? 'Underpacing' : 'En ritmo'
  const estilo = estado === 'overpacing'
    ? 'bg-red-900/20 border-red-700 text-red-400'
    : estado === 'underpacing'
    ? 'bg-yellow-900/20 border-yellow-700 text-yellow-400'
    : 'bg-green-900/20 border-green-700 text-green-400'

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${Math.min(porcentaje, 100)}%` }} />
      </div>
      <span className={`text-xs px-2 py-0.5 rounded border ${estilo}`}>{etiqueta}</span>
    </div>
  )
}

function TabPacing({ cuentaActivaId }) {
  const { data, isLoading } = useQuery({
    queryKey: ['pacing', cuentaActivaId],
    queryFn: () => getPacing(cuentaActivaId),
    enabled: !!cuentaActivaId,
    retry: false,
  })

  if (!cuentaActivaId) return <SinCuenta />
  if (isLoading) return <LoadingState mensaje="Calculando pacing de presupuesto..." />

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-64 text-center">
        <div className="w-14 h-14 bg-slate-800 border border-slate-700 rounded-2xl flex items-center justify-center mb-4 text-2xl">◑</div>
        <p className="text-white font-semibold mb-2">Budget Pacing & Forecasting</p>
        <p className="text-slate-400 text-sm mb-3 max-w-sm">
          Proyecta si el presupuesto mensual se agotará antes de fin de mes (overpacing) o quedará sin ejecutar (underpacing). Alertas automáticas cuando la desviación supera un umbral.
        </p>
        <div className="px-3 py-2 bg-slate-800 rounded-lg border border-slate-700 mb-3">
          <p className="text-xs text-slate-500 font-mono">GET /api/auditoria/pacing/:cuentaId</p>
        </div>
      </div>
    )
  }

  const hoy = new Date()
  const diasMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).getDate()
  const diasTranscurridos = hoy.getDate()
  const pacingIdeal = (diasTranscurridos / diasMes) * 100

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-500 mb-1">Gasto hasta hoy</p>
          <p className="text-2xl font-bold text-white">€{fmt(data.gastoActual, 0)}</p>
          <p className="text-xs text-slate-500 mt-1">de €{fmt(data.presupuestoMes, 0)} mensuales</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-500 mb-1">Proyección fin de mes</p>
          <p className={`text-2xl font-bold ${data.proyeccion > data.presupuestoMes * 1.1 ? 'text-red-400' : data.proyeccion < data.presupuestoMes * 0.85 ? 'text-yellow-400' : 'text-green-400'}`}>
            €{fmt(data.proyeccion, 0)}
          </p>
          <p className="text-xs text-slate-500 mt-1">estimado</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-500 mb-1">Ritmo ideal hoy</p>
          <p className="text-2xl font-bold text-white">{fmt(pacingIdeal, 0)}%</p>
          <p className="text-xs text-slate-500 mt-1">día {diasTranscurridos}/{diasMes}</p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-800">
          <p className="text-xs text-slate-500 uppercase tracking-wider">Pacing por campaña</p>
        </div>
        <div className="divide-y divide-slate-800">
          {data.campanas?.map((c, i) => (
            <div key={i} className="px-5 py-4 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm text-white font-medium truncate max-w-xs">{c.nombre}</p>
                <span className="text-xs text-slate-400 tabular-nums shrink-0 ml-3">
                  €{fmt(c.gastoActual, 0)} / €{fmt(c.presupuesto, 0)}
                </span>
              </div>
              <BarraPacing porcentaje={(c.gastoActual / c.presupuesto) * 100} estado={c.estado} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function SignificanceBadge({ significativo, confianza }) {
  if (!significativo) return <span className="text-xs text-slate-500">Sin datos suficientes</span>
  return (
    <span className={`text-xs px-2 py-0.5 rounded border ${confianza >= 95 ? 'bg-green-900/30 border-green-700 text-green-400' : 'bg-yellow-900/30 border-yellow-700 text-yellow-400'}`}>
      {confianza}% confianza
    </span>
  )
}

function TabABTests({ cuentaActivaId }) {
  const { data, isLoading } = useQuery({
    queryKey: ['abtests', cuentaActivaId],
    queryFn: () => getAbTests(cuentaActivaId),
    enabled: !!cuentaActivaId,
    retry: false,
  })

  if (!cuentaActivaId) return <SinCuenta />
  if (isLoading) return <LoadingState mensaje="Analizando variantes de anuncios..." />

  if (!data || data.tests?.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-64 text-center">
        <div className="w-14 h-14 bg-slate-800 border border-slate-700 rounded-2xl flex items-center justify-center mb-4 text-2xl">⊞</div>
        <p className="text-white font-semibold mb-2">A/B Tests estadísticos</p>
        <p className="text-slate-400 text-sm mb-3 max-w-sm">
          Compara variantes de anuncios RSA con significancia estadística. El sistema determina automáticamente cuándo hay ganador con 95% de confianza.
        </p>
        <div className="px-3 py-2 bg-slate-800 rounded-lg border border-slate-700 mb-3">
          <p className="text-xs text-slate-500 font-mono">GET /api/auditoria/abtests/:cuentaId</p>
        </div>
        <p className="text-xs text-slate-600">Necesita al menos 100 impresiones por variante.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {data.tests.map((test, i) => (
        <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white">{test.campaña}</p>
              <p className="text-xs text-slate-500">{test.grupoAnuncios}</p>
            </div>
            <SignificanceBadge significativo={test.significativo} confianza={test.confianza} />
          </div>
          <div className="grid grid-cols-2 divide-x divide-slate-800">
            {test.variantes?.map((v, j) => (
              <div key={j} className={`p-5 ${v.ganadora ? 'bg-green-900/10' : ''}`}>
                <div className="flex items-start justify-between mb-3">
                  <p className="text-xs text-slate-500 uppercase tracking-wider">
                    {j === 0 ? 'Variante A' : 'Variante B'}
                    {v.ganadora && <span className="ml-2 text-green-400">✓ Ganadora</span>}
                  </p>
                  {v.ganadora && <span className="text-xs px-2 py-0.5 bg-green-900/40 border border-green-700 text-green-400 rounded">Pausar perdedora</span>}
                </div>
                <p className="text-sm text-white mb-3 line-clamp-2">{v.titular}</p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-lg font-bold text-white">{v.ctr?.toFixed(2)}%</p>
                    <p className="text-xs text-slate-500">CTR</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-white">{fmt(v.conversiones, 0)}</p>
                    <p className="text-xs text-slate-500">Conv.</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-white">€{fmt(v.cpa, 2)}</p>
                    <p className="text-xs text-slate-500">CPA</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export default function Campaigns() {
  const cuentaActivaId = useCuentaStore(s => s.cuentaActivaId)
  const [tab, setTab] = useState('campanas')

  return (
    <div>
      <TopBar
        title="Campañas"
        subtitle="Gestión, análisis y optimización"
      />
      <PageTabs tabs={TABS} active={tab} onChange={setTab} />
      <div className="p-4 md:p-6 space-y-5">
        {tab === 'campanas' && <TabCampanas cuentaActivaId={cuentaActivaId} />}
        {tab === 'pacing'   && <TabPacing   cuentaActivaId={cuentaActivaId} />}
        {tab === 'abtests'  && <TabABTests  cuentaActivaId={cuentaActivaId} />}
      </div>
    </div>
  )
}
