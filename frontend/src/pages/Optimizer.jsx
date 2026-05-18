import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import TopBar from '../components/shared/TopBar'
import RecomendacionCard from '../components/optimizer/RecomendacionCard'
import LoadingState from '../components/shared/LoadingState'
import { optimizarCuenta } from '../api/ai'
import { getCuentas } from '../api/accounts'
import { analytics } from '../lib/analytics'

export default function Optimizer() {
  const [cuentaId, setCuentaId] = useState(null)
  const [objetivos, setObjetivos] = useState({ cpaObjetivo: '', roasObjetivo: '', presupuestoMensual: '' })

  const { data: cuentas = [] } = useQuery({
    queryKey: ['cuentas'],
    queryFn: getCuentas,
  })

  const mutation = useMutation({
    mutationFn: () => optimizarCuenta(cuentaId, {
      cpaObjetivo: objetivos.cpaObjetivo ? Number(objetivos.cpaObjetivo) : null,
      roasObjetivo: objetivos.roasObjetivo ? Number(objetivos.roasObjetivo) : null,
      presupuestoMensual: objetivos.presupuestoMensual ? Number(objetivos.presupuestoMensual) : null,
    }),
    onSuccess: () => analytics.aiOptimizerRun(cuentaId),
  })

  return (
    <div>
      <TopBar title="Optimizador IA" subtitle="Recomendaciones de pujas y presupuesto — Agente 2" />
      <div className="p-6 space-y-6 max-w-3xl">

        {/* Configuración */}
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
              {cuentas.map(c => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">CPA objetivo (€)</label>
              <input
                type="number"
                value={objetivos.cpaObjetivo}
                onChange={e => setObjetivos(p => ({ ...p, cpaObjetivo: e.target.value }))}
                placeholder="Ej: 15"
                className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 placeholder:text-slate-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">ROAS objetivo</label>
              <input
                type="number"
                value={objetivos.roasObjetivo}
                onChange={e => setObjetivos(p => ({ ...p, roasObjetivo: e.target.value }))}
                placeholder="Ej: 3.5"
                className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 placeholder:text-slate-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Presupuesto mes (€)</label>
              <input
                type="number"
                value={objetivos.presupuestoMensual}
                onChange={e => setObjetivos(p => ({ ...p, presupuestoMensual: e.target.value }))}
                placeholder="Ej: 2000"
                className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 placeholder:text-slate-500"
              />
            </div>
          </div>

          <button
            onClick={() => mutation.mutate()}
            disabled={!cuentaId || mutation.isPending}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {mutation.isPending ? 'Analizando cuenta...' : 'Generar recomendaciones →'}
          </button>
        </div>

        {/* Resultados */}
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
                <RecomendacionCard
                  key={i}
                  recomendacion={rec}
                  onAplicar={(r) => console.log('Aplicar:', r)}
                />
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
    </div>
  )
}
