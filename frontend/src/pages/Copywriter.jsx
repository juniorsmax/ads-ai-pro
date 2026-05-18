import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import TopBar from '../components/shared/TopBar'
import CopyCard from '../components/copywriter/CopyCard'
import LoadingState from '../components/shared/LoadingState'
import { generarCopy } from '../api/ai'
import { analytics } from '../lib/analytics'
const TIPOS = ['RSA', 'PMAX', 'DISPLAY']

export default function Copywriter() {
  const [tipo, setTipo] = useState('RSA')
  const [keywords, setKeywords] = useState('')
  const [perfilMarca, setPerfilMarca] = useState({
    sector: '',
    tono: 'profesional',
    usps: '',
    restricciones: '',
  })

  const mutation = useMutation({
    mutationFn: () => generarCopy(
      tipo,
      keywords.split(',').map(k => k.trim()).filter(Boolean),
      {
        sector: perfilMarca.sector,
        tono: perfilMarca.tono,
        usps: perfilMarca.usps.split(',').map(u => u.trim()).filter(Boolean),
        restricciones: perfilMarca.restricciones,
      },
      []
    ),
    onSuccess: () => analytics.aiCopyGenerated(tipo),
  })

  const limitesActivos = { headline: 30, description: 90 }

  return (
    <div>
      <TopBar title="Copywriter IA" subtitle="Generador de textos para Google Ads — Agente 3" />
      <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Panel izquierdo — configuración */}
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <p className="text-sm font-medium text-white">Tipo de anuncio</p>
            <div className="flex gap-2">
              {TIPOS.map(t => (
                <button
                  key={t}
                  onClick={() => setTipo(t)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    tipo === t ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">Keywords objetivo (separadas por comas)</label>
              <input
                type="text"
                value={keywords}
                onChange={e => setKeywords(e.target.value)}
                placeholder="reformas cocina Barcelona, reformas baño precio..."
                className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 placeholder:text-slate-500"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">Sector</label>
              <input
                type="text"
                value={perfilMarca.sector}
                onChange={e => setPerfilMarca(p => ({ ...p, sector: e.target.value }))}
                placeholder="Reformas del hogar, servicios legales..."
                className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 placeholder:text-slate-500"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">Tono</label>
              <select
                value={perfilMarca.tono}
                onChange={e => setPerfilMarca(p => ({ ...p, tono: e.target.value }))}
                className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
              >
                <option value="profesional">Profesional</option>
                <option value="cercano">Cercano y amigable</option>
                <option value="urgente">Urgente / Oferta</option>
                <option value="premium">Premium / Lujo</option>
                <option value="tecnico">Técnico / Experto</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">USPs / Ventajas únicas (separadas por comas)</label>
              <input
                type="text"
                value={perfilMarca.usps}
                onChange={e => setPerfilMarca(p => ({ ...p, usps: e.target.value }))}
                placeholder="20 años de experiencia, presupuesto gratis, garantía 2 años..."
                className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 placeholder:text-slate-500"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">Restricciones (palabras prohibidas, etc.)</label>
              <input
                type="text"
                value={perfilMarca.restricciones}
                onChange={e => setPerfilMarca(p => ({ ...p, restricciones: e.target.value }))}
                placeholder="No usar 'barato', no mencionar competidores..."
                className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 placeholder:text-slate-500"
              />
            </div>

            <button
              onClick={() => mutation.mutate()}
              disabled={!keywords.trim() || mutation.isPending}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {mutation.isPending ? 'Generando copies...' : 'Generar copies →'}
            </button>
          </div>
        </div>

        {/* Panel derecho — resultados */}
        <div className="space-y-4">
          {mutation.isPending && <LoadingState mensaje="El copywriter IA está generando tus anuncios..." />}

          {mutation.data && !mutation.isPending && (
            <>
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500 uppercase tracking-wider">Headlines — máx. 30 chars</p>
                <span className="text-sm font-bold text-white">
                  Puntuación global: <span className={mutation.data.puntuacionGlobal >= 80 ? 'text-green-400' : 'text-yellow-400'}>
                    {mutation.data.puntuacionGlobal}
                  </span>
                </span>
              </div>

              <div className="space-y-2">
                {mutation.data.headlines?.map((h, i) => (
                  <CopyCard key={i} copy={h} tipo="headline" limite={30} />
                ))}
              </div>

              <p className="text-xs text-slate-500 uppercase tracking-wider mt-4">Descriptions — máx. 90 chars</p>
              <div className="space-y-2">
                {mutation.data.descriptions?.map((d, i) => (
                  <CopyCard key={i} copy={d} tipo="description" limite={90} />
                ))}
              </div>

              {mutation.data.alertasPolitica?.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs text-slate-500 uppercase tracking-wider">Alertas de política</p>
                  {mutation.data.alertasPolitica.map((a, i) => (
                    <div key={i} className="px-3 py-2 bg-yellow-900/30 border border-yellow-700 rounded-lg text-yellow-300 text-xs">
                      ⚠ {a}
                    </div>
                  ))}
                </div>
              )}

              {mutation.data.consejo && (
                <div className="px-4 py-3 bg-blue-900/30 border border-blue-700 rounded-xl text-blue-300 text-sm">
                  💡 {mutation.data.consejo}
                </div>
              )}
            </>
          )}

          {mutation.isError && (
            <div className="px-4 py-3 bg-red-900/40 border border-red-700 rounded-xl text-red-300 text-sm">
              {mutation.error?.message ?? 'Error generando copies'}
            </div>
          )}

          {!mutation.data && !mutation.isPending && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
              <p className="text-slate-500 text-sm">Los copies generados aparecerán aquí</p>
              <p className="text-slate-600 text-xs mt-1">Rellena el formulario y pulsa "Generar copies"</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
