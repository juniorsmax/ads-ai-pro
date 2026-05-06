import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import TopBar from '../components/shared/TopBar'
import LoadingState from '../components/shared/LoadingState'
import { getCuentas } from '../api/accounts'
import { getCompetitors, refreshCompetitors } from '../api/competitors'

const AMENAZA_ESTILO = {
  alta: 'text-red-400 bg-red-900/30 border-red-800',
  media: 'text-yellow-400 bg-yellow-900/30 border-yellow-800',
  baja: 'text-green-400 bg-green-900/30 border-green-800',
}

const PRIORIDAD_ESTILO = {
  alta: 'border-l-red-500',
  media: 'border-l-yellow-500',
  baja: 'border-l-slate-600',
}

const TENDENCIA_ICONO = { subiendo: '↑', bajando: '↓', estable: '→' }
const TENDENCIA_COLOR = { subiendo: 'text-red-400', bajando: 'text-green-400', estable: 'text-slate-400' }

export default function Competitors() {
  const [cuentaId, setCuentaId] = useState(null)
  const queryClient = useQueryClient()

  const { data: cuentas = [] } = useQuery({ queryKey: ['cuentas'], queryFn: getCuentas })

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['competitors', cuentaId],
    queryFn: () => getCompetitors(cuentaId),
    enabled: !!cuentaId,
  })

  const refreshMutation = useMutation({
    mutationFn: () => refreshCompetitors(cuentaId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['competitors', cuentaId] }),
  })

  return (
    <div>
      <TopBar title="Espía Competitivo" subtitle="Inteligencia de mercado en tiempo real — Agente 5" />
      <div className="p-4 md:p-6 space-y-5 max-w-4xl">

        {/* Selector de cuenta */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <select
            value={cuentaId ?? ''}
            onChange={e => setCuentaId(e.target.value || null)}
            className="flex-1 bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
          >
            <option value="">Selecciona una cuenta...</option>
            {cuentas.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
          {cuentaId && (
            <button
              onClick={() => refreshMutation.mutate()}
              disabled={refreshMutation.isPending || isLoading}
              className="text-xs text-slate-400 hover:text-white px-3 py-2 border border-slate-700 hover:border-slate-500 rounded-lg transition-colors disabled:opacity-40 whitespace-nowrap"
            >
              {refreshMutation.isPending ? 'Refrescando...' : '↺ Actualizar datos'}
            </button>
          )}
        </div>

        {!cuentaId && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-10 text-center">
            <p className="text-2xl mb-3">⊕</p>
            <p className="text-slate-300 font-medium mb-1">Selecciona una cuenta para analizar</p>
            <p className="text-slate-500 text-sm">Analizamos los últimos 30 días de Auction Insights de Google Ads</p>
          </div>
        )}

        {isLoading && <LoadingState mensaje="El agente espía está analizando la competencia..." />}

        {isError && (
          <div className="px-4 py-3 bg-red-900/40 border border-red-700 rounded-xl text-red-300 text-sm">
            {error?.message ?? 'Error obteniendo datos de competidores'}
          </div>
        )}

        {data && (
          <>
            {/* Badge de caché */}
            {data.fromCache && (
              <p className="text-xs text-slate-500 text-right">Datos en caché · actualización cada 24h</p>
            )}

            {/* Resumen */}
            {data.resumen && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl px-5 py-4">
                <p className="text-xs text-slate-500 mb-1 uppercase tracking-wider">Situación competitiva</p>
                <p className="text-slate-200 text-sm">{data.resumen}</p>
              </div>
            )}

            {/* Tabla de competidores */}
            {data.competidoresDestacados?.length > 0 && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-800">
                  <p className="text-xs text-slate-500 uppercase tracking-wider">
                    Competidores detectados ({data.competidoresDestacados.length})
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs text-slate-500 border-b border-slate-800">
                        <th className="text-left px-5 py-3 font-normal">Dominio</th>
                        <th className="text-right px-4 py-3 font-normal">Cuota</th>
                        <th className="text-center px-4 py-3 font-normal">Tendencia</th>
                        <th className="text-center px-4 py-3 font-normal">Amenaza</th>
                        <th className="text-left px-4 py-3 font-normal hidden md:table-cell">Observación</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.competidoresDestacados.map((c, i) => (
                        <tr key={i} className="border-b border-slate-800/60 hover:bg-slate-800/30 transition-colors">
                          <td className="px-5 py-3 text-white font-medium">{c.dominio}</td>
                          <td className="px-4 py-3 text-right text-slate-300 tabular-nums">{c.cuotaImpresion}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`font-bold ${TENDENCIA_COLOR[c.tendencia] ?? 'text-slate-400'}`}>
                              {TENDENCIA_ICONO[c.tendencia] ?? '—'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`text-xs px-2 py-0.5 rounded border ${AMENAZA_ESTILO[c.amenaza] ?? 'text-slate-400 bg-slate-800 border-slate-700'}`}>
                              {c.amenaza ?? '—'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-400 text-xs hidden md:table-cell">{c.observacion}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Movimientos detectados */}
            {data.movimientosDetectados?.length > 0 && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-2">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">Movimientos detectados</p>
                {data.movimientosDetectados.map((m, i) => (
                  <div key={i} className="flex gap-2 text-sm text-slate-300">
                    <span className="text-blue-400 shrink-0">◈</span>
                    <span>{m}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Estrategias de respuesta */}
            {data.estrategias?.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs text-slate-500 uppercase tracking-wider">
                  Estrategias de respuesta ({data.estrategias.length})
                </p>
                {data.estrategias.map((e, i) => (
                  <div
                    key={i}
                    className={`bg-slate-900 border border-slate-800 border-l-2 rounded-xl p-5 ${PRIORIDAD_ESTILO[e.prioridad] ?? 'border-l-slate-600'}`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <p className="text-white font-medium text-sm">{e.titulo}</p>
                      <span className="text-xs text-slate-500 shrink-0 capitalize">{e.prioridad}</span>
                    </div>
                    <p className="text-slate-400 text-sm mb-3">{e.descripcion}</p>
                    {e.impacto && (
                      <p className="text-xs text-blue-400">Impacto esperado: {e.impacto}</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Sin competidores */}
            {data.competidoresDestacados?.length === 0 && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
                <p className="text-slate-400 text-sm">{data.resumen || 'No se detectaron competidores activos en los últimos 30 días.'}</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
