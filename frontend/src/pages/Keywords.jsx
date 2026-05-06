import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import TopBar from '../components/shared/TopBar'
import LoadingState from '../components/shared/LoadingState'
import { useCuentaStore } from '../store/cuentaStore'
import { getKeywords } from '../api/keywords'

const fmt = (n, dec = 2) => n != null ? n.toLocaleString('es-ES', { maximumFractionDigits: dec }) : '—'

const MATCH_LABEL = { EXACT: 'Exacta', PHRASE: 'Frase', BROAD: 'Amplia' }
const MATCH_ESTILO = {
  EXACT: 'bg-blue-900/40 text-blue-300 border-blue-800',
  PHRASE: 'bg-purple-900/40 text-purple-300 border-purple-800',
  BROAD: 'bg-slate-800 text-slate-400 border-slate-700',
}

const ORDEN_OPCIONES = [
  { id: 'cost', label: 'Mayor gasto' },
  { id: 'cpa', label: 'Mayor CPA' },
  { id: 'ctr_asc', label: 'Menor CTR' },
  { id: 'qs_asc', label: 'Menor Quality Score' },
]

function QSBadge({ qs }) {
  if (!qs) return <span className="text-slate-600">—</span>
  const color = qs >= 7 ? 'text-green-400' : qs >= 4 ? 'text-yellow-400' : 'text-red-400'
  return <span className={`font-bold ${color}`}>{qs}/10</span>
}

export default function Keywords() {
  const cuentaActivaId = useCuentaStore(s => s.cuentaActivaId)
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
      if (orden === 'cost') return b.cost - a.cost
      if (orden === 'cpa') return b.cpa - a.cpa
      if (orden === 'ctr_asc') return a.ctr - b.ctr
      if (orden === 'qs_asc') return (a.qualityScore ?? 10) - (b.qualityScore ?? 10)
      return 0
    })

  const totalKeywords = data?.keywords?.length ?? 0
  const sinConversiones = (data?.keywords ?? []).filter(k => k.conversions === 0).length
  const cpaMedio = keywords.filter(k => k.cpa > 0).reduce((s, k) => s + k.cpa, 0) / (keywords.filter(k => k.cpa > 0).length || 1)

  return (
    <div>
      <TopBar title="Keywords" subtitle="Análisis de palabras clave — últimos 30 días" />
      <div className="p-4 md:p-6 space-y-5 max-w-6xl">

        {!cuentaActivaId && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
            <p className="text-slate-400">Selecciona una cuenta en la barra superior para analizar keywords.</p>
          </div>
        )}

        {isLoading && <LoadingState mensaje="Cargando keywords desde Google Ads..." />}

        {isError && (
          <div className="px-4 py-3 bg-red-900/40 border border-red-700 rounded-xl text-red-300 text-sm">
            {error?.message ?? 'Error cargando keywords'}
          </div>
        )}

        {!isLoading && data && (
          <>
            {/* Resumen */}
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

            {/* Filtros */}
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
                    onClick={() => setOrden(o.id)}
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

            {/* Tabla */}
            {keywords.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
                <p className="text-slate-400 text-sm">
                  {filtroTexto ? 'No hay keywords que coincidan con la búsqueda.' : 'No se encontraron keywords con datos suficientes.'}
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
        )}
      </div>
    </div>
  )
}
