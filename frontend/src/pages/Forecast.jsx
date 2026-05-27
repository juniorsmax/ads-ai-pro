import { useQuery, useQueryClient } from '@tanstack/react-query'
import TopBar from '../components/shared/TopBar'
import LoadingState from '../components/shared/LoadingState'
import { useCuentaStore } from '../store/cuentaStore'
import { getForecast } from '../api/forecast'

const NIVEL_STYLES = {
  critico: 'bg-red-900/30 border-red-800',
  aviso:   'bg-yellow-900/30 border-yellow-800',
  info:    'bg-slate-800 border-slate-700',
}

const NIVEL_ICONOS = {
  critico: '⚠',
  aviso:   '🔔',
  info:    'ℹ',
}

const CONFIANZA_STYLES = {
  alta:  'bg-green-900/30 border-green-700 text-green-400',
  media: 'bg-yellow-900/30 border-yellow-700 text-yellow-400',
  baja:  'bg-red-900/30 border-red-700 text-red-400',
}

export default function Forecast() {
  const cuentaActivaId = useCuentaStore(s => s.cuentaActivaId)
  const queryClient = useQueryClient()

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['forecast', cuentaActivaId],
    queryFn: () => getForecast(cuentaActivaId),
    enabled: !!cuentaActivaId,
  })

  return (
    <div>
      <TopBar title="Predicciones IA" subtitle="Anticipa problemas antes de que ocurran — Agente 8" />
      <div className="p-4 md:p-6 space-y-6 max-w-4xl">
        {!cuentaActivaId && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
            <p className="text-slate-400">
              Selecciona una cuenta desde el Dashboard para ver predicciones
            </p>
          </div>
        )}

        {cuentaActivaId && isLoading && (
          <LoadingState mensaje="Analizando tendencias..." />
        )}

        {cuentaActivaId && isError && (
          <div className="px-4 py-3 bg-red-900/40 border border-red-700 rounded-xl text-red-300 text-sm">
            {error?.message ?? 'Error generando predicciones'}
          </div>
        )}

        {data && !isLoading && (
          <>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${CONFIANZA_STYLES[data.confianza] ?? CONFIANZA_STYLES.baja}`}>
                    Confianza {data.confianza}
                  </span>
                  {data.fromCache && (
                    <span className="text-xs text-slate-500">Datos en caché</span>
                  )}
                </div>
                <button
                  onClick={() => queryClient.invalidateQueries(['forecast', cuentaActivaId])}
                  className="text-xs px-3 py-1.5 border border-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors"
                >
                  Actualizar predicción
                </button>
              </div>

              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Resumen ejecutivo</p>
                <p className="text-white text-sm leading-relaxed">{data.resumen}</p>
              </div>
            </div>

            {data.alertas?.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs text-slate-500 uppercase tracking-wider px-1">Alertas predictivas</p>
                {data.alertas.map((alerta, i) => (
                  <div
                    key={i}
                    className={`border rounded-xl p-4 space-y-2 ${NIVEL_STYLES[alerta.nivel] ?? NIVEL_STYLES.info}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-base shrink-0">{NIVEL_ICONOS[alerta.nivel] ?? 'ℹ'}</span>
                        <p className="font-medium text-white text-sm">{alerta.titulo}</p>
                      </div>
                      <span className="text-xs px-2 py-0.5 bg-slate-900/60 border border-slate-700 text-slate-400 rounded-full shrink-0">
                        {alerta.horizonte}
                      </span>
                    </div>
                    <p className="text-slate-300 text-sm pl-6">{alerta.prediccion}</p>
                    {alerta.accionSugerida && (
                      <p className="text-slate-500 text-xs pl-6 mt-1">→ {alerta.accionSugerida}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
