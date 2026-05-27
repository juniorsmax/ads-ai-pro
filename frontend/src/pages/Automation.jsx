import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import TopBar from '../components/shared/TopBar'
import PageTabs from '../components/shared/PageTabs'
import LoadingState from '../components/shared/LoadingState'
import { useCuentaStore } from '../store/cuentaStore'
import { getAutomationPreview, executeAutomation, getAutomationLog } from '../api/automation'

const TABS = [
  { id: 'preview',   label: 'Vista previa' },
  { id: 'historial', label: 'Historial' },
]

function TabPreview({ cuentaActivaId }) {
  const queryClient = useQueryClient()

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['automation-preview', cuentaActivaId],
    queryFn: () => getAutomationPreview(cuentaActivaId),
    enabled: !!cuentaActivaId,
    refetchOnMount: false,
  })

  const mutation = useMutation({
    mutationFn: () => executeAutomation(cuentaActivaId),
    onSuccess: () => {
      queryClient.invalidateQueries(['automation-preview', cuentaActivaId])
      queryClient.invalidateQueries(['automation-log', cuentaActivaId])
    },
  })

  const isPlanInsuficiente =
    error?.message === 'plan_insuficiente' ||
    error?.message?.includes('Profesional')

  if (!cuentaActivaId) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
        <p className="text-slate-400">Selecciona una cuenta desde el Dashboard para usar la automatización.</p>
      </div>
    )
  }

  if (isError && isPlanInsuficiente) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center space-y-3">
        <p className="text-white font-medium">Función no disponible en tu plan</p>
        <p className="text-slate-400 text-sm">
          Esta función requiere plan Profesional o Agencia · Actualiza en Facturación
        </p>
        <a
          href="/billing"
          className="inline-block px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          Ver planes →
        </a>
      </div>
    )
  }

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center gap-3">
        <button
          onClick={() => refetch()}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
        >
          {isLoading ? 'Analizando...' : 'Ver qué haría la IA ahora'}
        </button>

        {data?.acciones?.length > 0 && (
          <button
            onClick={() => {
              const confirmed = window.confirm(
                `¿Ejecutar ${data.total} acciones en tu cuenta de Google Ads?`
              )
              if (confirmed) mutation.mutate()
            }}
            disabled={mutation.isPending}
            className="px-4 py-2 border border-blue-600 text-blue-400 hover:bg-blue-600 hover:text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {mutation.isPending ? 'Ejecutando...' : `Ejecutar ahora (${data.total} acciones)`}
          </button>
        )}
      </div>

      {isLoading && <LoadingState mensaje="Calculando acciones recomendadas..." />}

      {isError && !isPlanInsuficiente && (
        <div className="px-4 py-3 bg-red-900/40 border border-red-700 rounded-xl text-red-300 text-sm">
          {error?.message ?? 'Error generando vista previa'}
        </div>
      )}

      {mutation.isSuccess && (
        <div className="px-4 py-3 bg-green-900/30 border border-green-700 rounded-xl text-green-300 text-sm">
          Acciones ejecutadas correctamente
        </div>
      )}

      {data?.acciones?.length > 0 && !isLoading && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-800">
            <p className="text-xs text-slate-500 uppercase tracking-wider">
              Acciones propuestas ({data.total})
            </p>
          </div>
          <div className="divide-y divide-slate-800">
            {data.acciones.map((accion, i) => (
              <div key={i} className="px-5 py-3">
                <p className="font-mono text-sm text-blue-300">{accion.tipo_accion}</p>
                <p className="text-slate-400 text-xs mt-0.5">{accion.motivo}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {data && data.acciones?.length === 0 && !isLoading && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-center">
          <p className="text-slate-400 text-sm">No hay acciones pendientes en este momento.</p>
        </div>
      )}
    </div>
  )
}

function TabHistorial({ cuentaActivaId }) {
  const [page, setPage] = useState(0)

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['automation-log', cuentaActivaId, page],
    queryFn: () => getAutomationLog(cuentaActivaId, page),
    enabled: !!cuentaActivaId,
  })

  const RESULTADO_COLORS = {
    ejecutado: 'text-green-400',
    rechazado: 'text-yellow-400',
    error:     'text-red-400',
  }

  if (!cuentaActivaId) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
        <p className="text-slate-400">Selecciona una cuenta para ver el historial.</p>
      </div>
    )
  }

  if (isLoading) return <LoadingState mensaje="Cargando historial..." />

  if (isError) {
    return (
      <div className="px-4 py-3 bg-red-900/40 border border-red-700 rounded-xl text-red-300 text-sm">
        {error?.message ?? 'Error cargando historial'}
      </div>
    )
  }

  return (
    <div className="space-y-4 max-w-4xl">
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="text-left px-4 py-3 text-xs text-slate-500 uppercase tracking-wider font-semibold">Fecha</th>
              <th className="text-left px-4 py-3 text-xs text-slate-500 uppercase tracking-wider font-semibold">Acción</th>
              <th className="text-left px-4 py-3 text-xs text-slate-500 uppercase tracking-wider font-semibold hidden md:table-cell">Motivo</th>
              <th className="text-left px-4 py-3 text-xs text-slate-500 uppercase tracking-wider font-semibold">Resultado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {data?.log?.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-500 text-sm">
                  No hay acciones registradas aún
                </td>
              </tr>
            )}
            {data?.log?.map((row) => (
              <tr key={row.id} className="hover:bg-slate-800/40 transition-colors">
                <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">
                  {new Date(row.creado_en).toLocaleDateString('es-ES')}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-blue-300">{row.tipo_accion}</td>
                <td className="px-4 py-3 text-slate-400 text-xs hidden md:table-cell">{row.motivo}</td>
                <td className={`px-4 py-3 text-xs font-medium ${RESULTADO_COLORS[row.resultado] ?? 'text-slate-400'}`}>
                  {row.resultado}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => setPage(p => Math.max(0, p - 1))}
          disabled={page === 0}
          className="px-3 py-1.5 border border-slate-700 text-slate-400 hover:text-white text-xs rounded-lg transition-colors disabled:opacity-40"
        >
          ← Anterior
        </button>
        <span className="text-xs text-slate-500">Página {page + 1}</span>
        <button
          onClick={() => setPage(p => p + 1)}
          disabled={!data?.log?.length || data.log.length < 20}
          className="px-3 py-1.5 border border-slate-700 text-slate-400 hover:text-white text-xs rounded-lg transition-colors disabled:opacity-40"
        >
          Siguiente →
        </button>
      </div>
    </div>
  )
}

export default function Automation() {
  const [tab, setTab] = useState('preview')
  const cuentaActivaId = useCuentaStore(s => s.cuentaActivaId)

  return (
    <div>
      <TopBar title="Automatización" subtitle="Acciones autónomas basadas en reglas aprendidas — Agente 9" />
      <PageTabs tabs={TABS} active={tab} onChange={setTab} />
      <div className="p-4 md:p-6">
        {tab === 'preview'   && <TabPreview   cuentaActivaId={cuentaActivaId} />}
        {tab === 'historial' && <TabHistorial cuentaActivaId={cuentaActivaId} />}
      </div>
    </div>
  )
}
