import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import TopBar from '../components/shared/TopBar'
import PageTabs from '../components/shared/PageTabs'
import RecomendacionCard from '../components/optimizer/RecomendacionCard'
import LoadingState from '../components/shared/LoadingState'
import { optimizarCuenta } from '../api/ai'
import { getPendientes, aprobarCambio, rechazarCambio } from '../api/auditoria'
import { getCuentas } from '../api/accounts'
import { useCuentaStore } from '../store/cuentaStore'
import { analytics } from '../lib/analytics'

const TABS = [
  { id: 'recomendaciones', label: 'Recomendaciones' },
  { id: 'aprobaciones',    label: 'Aprobaciones', nuevo: true },
]

function TabRecomendaciones() {
  const [cuentaId, setCuentaId] = useState(null)
  const [objetivos, setObjetivos] = useState({ cpaObjetivo: '', roasObjetivo: '', presupuestoMensual: '' })

  const { data: cuentas = [] } = useQuery({ queryKey: ['cuentas'], queryFn: getCuentas })

  const mutation = useMutation({
    mutationFn: () => optimizarCuenta(cuentaId, {
      cpaObjetivo:        objetivos.cpaObjetivo        ? Number(objetivos.cpaObjetivo)        : null,
      roasObjetivo:       objetivos.roasObjetivo       ? Number(objetivos.roasObjetivo)       : null,
      presupuestoMensual: objetivos.presupuestoMensual ? Number(objetivos.presupuestoMensual) : null,
    }),
    onSuccess: () => analytics.aiOptimizerRun(cuentaId),
  })

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <p className="text-sm font-medium text-white">Configurar análisis</p>

        <div>
          <label className="text-xs text-slate-400 mb-1 block">Cuenta</label>
          <select
            value={cuentaId ?? ''}
            onChange={e => setCuentaId(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
          >
            <option value="">Selecciona una cuenta...</option>
            {cuentas.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { key: 'cpaObjetivo', label: 'CPA objetivo (€)', placeholder: 'Ej: 15' },
            { key: 'roasObjetivo', label: 'ROAS objetivo', placeholder: 'Ej: 3.5' },
            { key: 'presupuestoMensual', label: 'Presupuesto mes (€)', placeholder: 'Ej: 2000' },
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="text-xs text-slate-400 mb-1 block">{label}</label>
              <input
                type="number"
                value={objetivos[key]}
                onChange={e => setObjetivos(p => ({ ...p, [key]: e.target.value }))}
                placeholder={placeholder}
                className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 placeholder:text-slate-500"
              />
            </div>
          ))}
        </div>

        <button
          onClick={() => mutation.mutate()}
          disabled={!cuentaId || mutation.isPending}
          className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
        >
          {mutation.isPending ? 'Analizando cuenta...' : 'Generar recomendaciones →'}
        </button>
      </div>

      {mutation.isPending && <LoadingState mensaje="El optimizador IA está analizando tu cuenta..." />}

      {mutation.data && (
        <div className="space-y-4">
          {mutation.data.resumen && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl px-5 py-4">
              <p className="text-xs text-slate-500 mb-1">Resumen ejecutivo</p>
              <p className="text-slate-200 text-sm">{mutation.data.resumen}</p>
            </div>
          )}

          {mutation.data.alertasPresupuesto?.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-slate-500 uppercase tracking-wider">Alertas de presupuesto</p>
              {mutation.data.alertasPresupuesto.map((a, i) => (
                <div key={i} className="px-3 py-2 bg-yellow-900/30 border border-yellow-700 rounded-lg text-yellow-300 text-sm">
                  ⚠ {a}
                </div>
              ))}
            </div>
          )}

          <div className="space-y-3">
            <p className="text-xs text-slate-500 uppercase tracking-wider">
              Recomendaciones ({mutation.data.recomendaciones?.length ?? 0})
            </p>
            {mutation.data.recomendaciones?.map((rec, i) => (
              <RecomendacionCard key={i} recomendacion={rec} onAplicar={(r) => console.log('Aplicar:', r)} />
            ))}
          </div>
        </div>
      )}

      {mutation.isError && (
        <div className="px-4 py-3 bg-red-900/40 border border-red-700 rounded-xl text-red-300 text-sm">
          {mutation.error?.message ?? 'Error generando recomendaciones'}
        </div>
      )}
    </div>
  )
}

function PrioridadBadge({ prioridad }) {
  const estilos = {
    alta:   'bg-red-900/30 border-red-700 text-red-400',
    media:  'bg-yellow-900/30 border-yellow-700 text-yellow-400',
    baja:   'bg-slate-800 border-slate-700 text-slate-400',
  }
  return (
    <span className={`text-xs px-2 py-0.5 rounded border ${estilos[prioridad] ?? estilos.baja}`}>
      {prioridad ?? 'media'}
    </span>
  )
}

function TabAprobaciones() {
  const cuentaActivaId = useCuentaStore(s => s.cuentaActivaId)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['pendientes', cuentaActivaId],
    queryFn: () => getPendientes(cuentaActivaId),
    enabled: !!cuentaActivaId,
    retry: false,
  })

  const aprobar  = useMutation({ mutationFn: aprobarCambio,  onSuccess: () => queryClient.invalidateQueries(['pendientes']) })
  const rechazar = useMutation({ mutationFn: rechazarCambio, onSuccess: () => queryClient.invalidateQueries(['pendientes']) })

  if (!cuentaActivaId) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
        <p className="text-slate-400">Selecciona una cuenta para ver las aprobaciones pendientes.</p>
      </div>
    )
  }

  if (isLoading) return <LoadingState mensaje="Cargando cambios pendientes de aprobación..." />

  if (!data || data.pendientes?.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-64 text-center">
        <div className="w-14 h-14 bg-slate-800 border border-slate-700 rounded-2xl flex items-center justify-center mb-4 text-2xl">✓</div>
        <p className="text-white font-semibold mb-2">Sin cambios pendientes</p>
        <p className="text-slate-400 text-sm mb-3 max-w-sm">
          Los cambios sugeridos por la IA aparecerán aquí para que los apruebes o rechaces antes de aplicarlos a Google Ads.
        </p>
        {!data && (
          <div className="px-3 py-2 bg-slate-800 rounded-lg border border-slate-700 mt-1">
            <p className="text-xs text-slate-500 font-mono">GET /api/optimizer/pendientes/:cuentaId</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-3 max-w-3xl">
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500 uppercase tracking-wider">
          {data.pendientes.length} cambio{data.pendientes.length !== 1 ? 's' : ''} pendiente{data.pendientes.length !== 1 ? 's' : ''}
        </p>
        <p className="text-xs text-slate-600">La IA sugiere — tú decides</p>
      </div>

      {data.pendientes.map((item) => (
        <div key={item.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <PrioridadBadge prioridad={item.prioridad} />
                <span className="text-xs text-slate-500 uppercase">{item.tipo}</span>
              </div>
              <p className="text-white font-medium text-sm">{item.descripcion}</p>
              {item.razon && <p className="text-slate-400 text-xs mt-1">{item.razon}</p>}
            </div>
            {item.impactoEstimado && (
              <div className="text-right shrink-0">
                <p className="text-xs text-slate-500">Impacto estimado</p>
                <p className="text-green-400 font-medium text-sm">{item.impactoEstimado}</p>
              </div>
            )}
          </div>

          {item.detalle && (
            <div className="mb-3 p-3 bg-slate-800 rounded-lg text-xs text-slate-400 font-mono">
              {item.detalle}
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => aprobar.mutate(item.id)}
              disabled={aprobar.isPending}
              className="flex-1 py-2 bg-green-700 hover:bg-green-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              Aprobar cambio
            </button>
            <button
              onClick={() => rechazar.mutate(item.id)}
              disabled={rechazar.isPending}
              className="px-5 py-2 border border-slate-700 hover:border-red-700 text-slate-400 hover:text-red-400 text-sm rounded-lg transition-colors disabled:opacity-50"
            >
              Rechazar
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function Optimizer() {
  const [tab, setTab] = useState('recomendaciones')

  return (
    <div>
      <TopBar title="Optimizador IA" subtitle="Recomendaciones y aprobaciones — Agente 2" />
      <PageTabs tabs={TABS} active={tab} onChange={setTab} />
      <div className="p-6">
        {tab === 'recomendaciones' && <TabRecomendaciones />}
        {tab === 'aprobaciones'    && <TabAprobaciones />}
      </div>
    </div>
  )
}
