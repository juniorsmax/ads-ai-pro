import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import TopBar from '../components/shared/TopBar'
import LoadingState from '../components/shared/LoadingState'
import { generarReporte, getReportes } from '../api/reports'
import { useCuentaStore } from '../store/cuentaStore'

const PERIODOS = ['Últimos 7 días', 'Últimos 30 días', 'Este mes', 'Mes anterior']

export default function Reports() {
  const [periodo, setPeriodo] = useState('Últimos 30 días')
  const [reporteHtml, setReporteHtml] = useState(null)
  const cuentaActivaId = useCuentaStore(s => s.cuentaActivaId)

  const { data: reportes = [], refetch } = useQuery({
    queryKey: ['reportes'],
    queryFn: getReportes,
  })

  const mutation = useMutation({
    mutationFn: () => generarReporte(cuentaActivaId, periodo),
    onSuccess: async (data) => {
      refetch()
      // Cargar HTML del reporte generado
      if (data.reporteId) {
        const res = await fetch(`/api/reports/${data.reporteId}/html`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('adsai_token')}` },
        })
        setReporteHtml(await res.text())
      }
    },
  })

  return (
    <div className="h-full flex flex-col">
      <TopBar title="Reportes" subtitle="Generación de reportes white-label — Agente 6" />
      <div className="flex-1 flex overflow-hidden">

        {/* Panel izquierdo — controles */}
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

          {/* Historial */}
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
                    <p className="text-xs text-white font-medium">
                      {r.cuentas_vinculadas?.nombre ?? 'Cuenta'}
                    </p>
                    <p className="text-xs text-slate-500">
                      {new Date(r.creado_en).toLocaleDateString('es-ES')}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Panel derecho — preview */}
        <div className="flex-1 overflow-hidden bg-slate-950">
          {mutation.isPending && (
            <LoadingState mensaje="El Agente 6 está generando tu reporte white-label..." />
          )}
          {reporteHtml && !mutation.isPending && (
            <iframe
              srcDoc={reporteHtml}
              className="w-full h-full border-0"
              title="Preview del reporte"
            />
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
    </div>
  )
}
