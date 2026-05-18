import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import TopBar from '../components/shared/TopBar'
import PageTabs from '../components/shared/PageTabs'
import LoadingState from '../components/shared/LoadingState'
import { generarReporte, getReportes } from '../api/reports'
import { useCuentaStore } from '../store/cuentaStore'
import { analytics } from '../lib/analytics'
import { generarResumenSemanal } from '../api/integraciones'

const PERIODOS = ['Últimos 7 días', 'Últimos 30 días', 'Este mes', 'Mes anterior']
const TABS = [
  { id: 'reportes', label: 'Reportes White-Label' },
  { id: 'resumen',  label: 'Resumen Semanal IA', nuevo: true },
]

function TabReportes() {
  const [periodo, setPeriodo] = useState('Últimos 30 días')
  const [reporteHtml, setReporteHtml] = useState(null)
  const cuentaActivaId = useCuentaStore(s => s.cuentaActivaId)

  const { data: reportes = [], refetch } = useQuery({ queryKey: ['reportes'], queryFn: getReportes })

  const mutation = useMutation({
    mutationFn: () => generarReporte(cuentaActivaId, periodo),
    onSuccess: async (data) => {
      analytics.reportGenerated(cuentaActivaId, periodo)
      refetch()
      if (data.reporteId) {
        const res = await fetch(`/api/reports/${data.reporteId}/html`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('adsai_token')}` },
        })
        setReporteHtml(await res.text())
      }
    },
  })

  return (
    <div className="flex flex-1 overflow-hidden">
      <div className="w-72 flex-shrink-0 border-r border-slate-800 p-5 space-y-5 overflow-y-auto">
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">Nuevo reporte</p>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Período</label>
              <select
                value={periodo}
                onChange={e => setPeriodo(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
              >
                {PERIODOS.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <button
              onClick={() => mutation.mutate()}
              disabled={!cuentaActivaId || mutation.isPending}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {mutation.isPending ? 'Generando...' : 'Generar reporte →'}
            </button>
          </div>
        </div>

        {reportes.length > 0 && (
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">Historial</p>
            <div className="space-y-2">
              {reportes.map(r => (
                <button
                  key={r.id}
                  onClick={async () => {
                    const res = await fetch(`/api/reports/${r.id}/html`, {
                      headers: { Authorization: `Bearer ${localStorage.getItem('adsai_token')}` },
                    })
                    setReporteHtml(await res.text())
                  }}
                  className="w-full text-left px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <p className="text-xs text-white font-medium">{r.cuentas_vinculadas?.nombre ?? 'Cuenta'}</p>
                  <p className="text-xs text-slate-500">{new Date(r.creado_en).toLocaleDateString('es-ES')}</p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-hidden bg-slate-950">
        {mutation.isPending && <LoadingState mensaje="El Agente 6 está generando tu reporte white-label..." />}
        {reporteHtml && !mutation.isPending && (
          <iframe srcDoc={reporteHtml} className="w-full h-full border-0" title="Preview del reporte" />
        )}
        {!reporteHtml && !mutation.isPending && (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4 text-2xl">◷</div>
            <p className="text-slate-400 font-medium">Genera tu primer reporte</p>
            <p className="text-slate-600 text-sm mt-1 max-w-xs">
              Selecciona un período y pulsa "Generar reporte". La IA creará un informe ejecutivo con tu branding.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function TabResumenSemanal() {
  const cuentaActivaId = useCuentaStore(s => s.cuentaActivaId)
  const [resumen, setResumen] = useState(null)
  const [tipoVista, setTipoVista] = useState('ejecutivo')

  const mutation = useMutation({
    mutationFn: () => generarResumenSemanal(cuentaActivaId),
    onSuccess: (data) => setResumen(data),
  })

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-3xl space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-white">Resumen ejecutivo semanal con IA</p>
              <p className="text-xs text-slate-400 mt-1">
                Claude analiza los últimos 7 días y redacta un resumen en español con qué mejoró, qué empeoró y qué hacer esta semana.
              </p>
            </div>
            <div className="flex gap-2 shrink-0 ml-4">
              {['ejecutivo', 'tecnico'].map(v => (
                <button
                  key={v}
                  onClick={() => setTipoVista(v)}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                    tipoVista === v
                      ? 'bg-blue-600 border-blue-500 text-white'
                      : 'border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  {v === 'ejecutivo' ? 'Para el cliente' : 'Versión técnica'}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => mutation.mutate()}
            disabled={!cuentaActivaId || mutation.isPending}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {mutation.isPending ? 'Generando resumen...' : 'Generar resumen semanal →'}
          </button>

          {!cuentaActivaId && (
            <p className="text-xs text-slate-500">Selecciona una cuenta en la barra superior.</p>
          )}
        </div>

        {mutation.isPending && <LoadingState mensaje="Agente IA analizando la semana..." />}

        {mutation.isError && (
          <div className="px-4 py-3 bg-red-900/40 border border-red-700 rounded-xl text-red-300 text-sm">
            {mutation.error?.message ?? 'Error generando el resumen'}
            <p className="text-xs mt-1 opacity-70">Endpoint: POST /api/ai/resumen-semanal</p>
          </div>
        )}

        {resumen && !mutation.isPending && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500 uppercase tracking-wider">Resumen generado</p>
              <div className="flex gap-2">
                <button
                  onClick={() => navigator.clipboard.writeText(tipoVista === 'ejecutivo' ? resumen.ejecutivo : resumen.tecnico)}
                  className="text-xs px-3 py-1.5 border border-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors"
                >
                  Copiar texto
                </button>
              </div>
            </div>

            {resumen.kpisSemana && (
              <div className="grid grid-cols-4 gap-3">
                {Object.entries(resumen.kpisSemana).map(([k, v]) => (
                  <div key={k} className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-center">
                    <p className="text-xs text-slate-500 mb-1">{k}</p>
                    <p className={`text-lg font-bold ${v.tendencia === 'sube' ? 'text-green-400' : v.tendencia === 'baja' ? 'text-red-400' : 'text-white'}`}>
                      {v.valor}
                    </p>
                  </div>
                ))}
              </div>
            )}

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">
                {tipoVista === 'ejecutivo' ? resumen.ejecutivo : resumen.tecnico}
              </p>
            </div>

            {resumen.accionesEstasSemana?.length > 0 && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">Acciones recomendadas esta semana</p>
                <ul className="space-y-2">
                  {resumen.accionesEstasSemana.map((a, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                      <span className="text-blue-400 shrink-0 mt-0.5">→</span>
                      <span>{a}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {!resumen && !mutation.isPending && !mutation.isError && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
            <p className="text-slate-500 text-sm">El resumen aparecerá aquí</p>
            <p className="text-slate-600 text-xs mt-1">Pulsa "Generar resumen semanal" para empezar</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function Reports() {
  const [tab, setTab] = useState('reportes')

  return (
    <div className="h-full flex flex-col">
      <TopBar title="Reportes" subtitle="Reportes white-label y resúmenes ejecutivos — Agente 6" />
      <PageTabs tabs={TABS} active={tab} onChange={setTab} />
      <div className="flex-1 flex overflow-hidden">
        {tab === 'reportes' && <TabReportes />}
        {tab === 'resumen'  && <TabResumenSemanal />}
      </div>
    </div>
  )
}
