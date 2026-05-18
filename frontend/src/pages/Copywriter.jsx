import { useState, useRef } from 'react'
import { useMutation } from '@tanstack/react-query'
import TopBar from '../components/shared/TopBar'
import PageTabs from '../components/shared/PageTabs'
import CopyCard from '../components/copywriter/CopyCard'
import LoadingState from '../components/shared/LoadingState'
import { generarCopy } from '../api/ai'
import { analytics } from '../lib/analytics'

const TIPOS = ['RSA', 'PMAX', 'DISPLAY']
const TABS  = [
  { id: 'copywriter', label: 'Copywriter' },
  { id: 'rsa-masivo', label: 'RSA Masivo', nuevo: true },
]

function TabCopywriter() {
  const [tipo, setTipo] = useState('RSA')
  const [keywords, setKeywords] = useState('')
  const [perfilMarca, setPerfilMarca] = useState({ sector: '', tono: 'profesional', usps: '', restricciones: '' })

  const mutation = useMutation({
    mutationFn: () => generarCopy(
      tipo,
      keywords.split(',').map(k => k.trim()).filter(Boolean),
      {
        sector: perfilMarca.sector,
        tono:   perfilMarca.tono,
        usps:   perfilMarca.usps.split(',').map(u => u.trim()).filter(Boolean),
        restricciones: perfilMarca.restricciones,
      },
      []
    ),
    onSuccess: () => analytics.aiCopyGenerated(tipo),
  })

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

          {[
            { key: 'keywords', label: 'Keywords objetivo (separadas por comas)', placeholder: 'reformas cocina Barcelona, reformas baño precio...', type: 'input', state: keywords, setState: setKeywords },
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="text-xs text-slate-400 mb-1 block">{label}</label>
              <input
                type="text"
                value={keywords}
                onChange={e => setKeywords(e.target.value)}
                placeholder={placeholder}
                className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 placeholder:text-slate-500"
              />
            </div>
          ))}

          <div>
            <label className="text-xs text-slate-400 mb-1 block">Sector</label>
            <input type="text" value={perfilMarca.sector} onChange={e => setPerfilMarca(p => ({ ...p, sector: e.target.value }))}
              placeholder="Reformas del hogar, servicios legales..."
              className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 placeholder:text-slate-500" />
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">Tono</label>
            <select value={perfilMarca.tono} onChange={e => setPerfilMarca(p => ({ ...p, tono: e.target.value }))}
              className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500">
              <option value="profesional">Profesional</option>
              <option value="cercano">Cercano y amigable</option>
              <option value="urgente">Urgente / Oferta</option>
              <option value="premium">Premium / Lujo</option>
              <option value="tecnico">Técnico / Experto</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">USPs (separadas por comas)</label>
            <input type="text" value={perfilMarca.usps} onChange={e => setPerfilMarca(p => ({ ...p, usps: e.target.value }))}
              placeholder="20 años de experiencia, presupuesto gratis..."
              className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 placeholder:text-slate-500" />
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">Restricciones</label>
            <input type="text" value={perfilMarca.restricciones} onChange={e => setPerfilMarca(p => ({ ...p, restricciones: e.target.value }))}
              placeholder="No usar 'barato', no mencionar competidores..."
              className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 placeholder:text-slate-500" />
          </div>

          <button onClick={() => mutation.mutate()} disabled={!keywords.trim() || mutation.isPending}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50">
            {mutation.isPending ? 'Generando copies...' : 'Generar copies →'}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {mutation.isPending && <LoadingState mensaje="El copywriter IA está generando tus anuncios..." />}

        {mutation.data && !mutation.isPending && (
          <>
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500 uppercase tracking-wider">Headlines — máx. 30 chars</p>
              <span className="text-sm font-bold text-white">
                Puntuación: <span className={mutation.data.puntuacionGlobal >= 80 ? 'text-green-400' : 'text-yellow-400'}>
                  {mutation.data.puntuacionGlobal}
                </span>
              </span>
            </div>
            <div className="space-y-2">
              {mutation.data.headlines?.map((h, i) => <CopyCard key={i} copy={h} tipo="headline" limite={30} />)}
            </div>
            <p className="text-xs text-slate-500 uppercase tracking-wider mt-4">Descriptions — máx. 90 chars</p>
            <div className="space-y-2">
              {mutation.data.descriptions?.map((d, i) => <CopyCard key={i} copy={d} tipo="description" limite={90} />)}
            </div>
            {mutation.data.alertasPolitica?.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs text-slate-500 uppercase tracking-wider">Alertas de política</p>
                {mutation.data.alertasPolitica.map((a, i) => (
                  <div key={i} className="px-3 py-2 bg-yellow-900/30 border border-yellow-700 rounded-lg text-yellow-300 text-xs">⚠ {a}</div>
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
  )
}

const ESTADO_FILA = {
  pendiente:  { label: 'Pendiente',  cls: 'text-slate-500' },
  generando:  { label: 'Generando…', cls: 'text-blue-400 animate-pulse' },
  completado: { label: 'Listo',      cls: 'text-green-400' },
  error:      { label: 'Error',      cls: 'text-red-400' },
}

function exportarCSV(resultados) {
  const completados = resultados.filter(r => r.estado === 'completado')
  const hs = Array.from({ length: 15 }, (_, i) => `Headline ${i + 1}`)
  const ds = Array.from({ length: 4  }, (_, i) => `Description ${i + 1}`)
  const cab = ['Grupo', ...hs, ...ds]
  const filas = completados.map(r => [
    r.nombre,
    ...Array.from({ length: 15 }, (_, i) => r.data?.headlines?.[i]?.texto ?? ''),
    ...Array.from({ length: 4  }, (_, i) => r.data?.descriptions?.[i]?.texto ?? ''),
  ])
  const csv = [cab, ...filas]
    .map(row => row.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))
    .join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = Object.assign(document.createElement('a'), { href: url, download: 'rsa-masivo.csv' })
  a.click()
  URL.revokeObjectURL(url)
}

function TabRSAMasivo() {
  const [grupos, setGrupos]         = useState('')
  const [sector, setSector]         = useState('')
  const [tono, setTono]             = useState('profesional')
  const [usps, setUsps]             = useState('')
  const [resultados, setResultados] = useState([])
  const [procesando, setProcesando] = useState(false)
  const [expandido, setExpandido]   = useState(null)
  const abortRef = useRef(false)

  async function generarMasivo() {
    const lineas = grupos.split('\n').map(l => l.trim()).filter(Boolean)
    if (!lineas.length) return
    abortRef.current = false

    const filas = lineas.map((linea, i) => ({
      id: i,
      nombre: `Grupo ${i + 1} — ${linea.split(',')[0].trim()}`,
      keywords: linea.split(',').map(k => k.trim()).filter(Boolean),
      estado: 'pendiente',
      data: null,
      error: null,
    }))
    setResultados(filas)
    setProcesando(true)
    setExpandido(null)

    const perfil = {
      sector,
      tono,
      usps: usps.split(',').map(u => u.trim()).filter(Boolean),
      restricciones: '',
    }

    for (let i = 0; i < filas.length; i++) {
      if (abortRef.current) break
      setResultados(prev => prev.map((f, j) => j === i ? { ...f, estado: 'generando' } : f))
      try {
        const data = await generarCopy('RSA', filas[i].keywords, perfil, [])
        setResultados(prev => prev.map((f, j) => j === i ? { ...f, estado: 'completado', data } : f))
        analytics.aiCopyGenerated('RSA_masivo')
      } catch (err) {
        setResultados(prev => prev.map((f, j) => j === i ? { ...f, estado: 'error', error: err.message } : f))
      }
    }
    setProcesando(false)
  }

  const completados = resultados.filter(r => r.estado === 'completado').length
  const total = resultados.length

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">
              Grupos de anuncios — una línea por grupo, keywords separadas por coma
            </label>
            <textarea
              value={grupos}
              onChange={e => setGrupos(e.target.value)}
              rows={6}
              placeholder={`reformas cocina Barcelona, cocina moderna precio, reformas cocina presupuesto
reformas baño Madrid, renovar baño, baño moderno precio
pintor Barcelona, pintor economico, pintura interior`}
              className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-blue-500 placeholder:text-slate-600 font-mono resize-none"
            />
            <p className="text-xs text-slate-600 mt-1">
              {grupos.split('\n').filter(l => l.trim()).length} grupos detectados
            </p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider">Configuración de marca</p>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Sector</label>
            <input type="text" value={sector} onChange={e => setSector(e.target.value)}
              placeholder="Reformas del hogar..."
              className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 placeholder:text-slate-500" />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Tono</label>
            <select value={tono} onChange={e => setTono(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500">
              <option value="profesional">Profesional</option>
              <option value="cercano">Cercano</option>
              <option value="urgente">Urgente</option>
              <option value="premium">Premium</option>
              <option value="tecnico">Técnico</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">USPs (comas)</label>
            <input type="text" value={usps} onChange={e => setUsps(e.target.value)}
              placeholder="20 años exp., garantía..."
              className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 placeholder:text-slate-500" />
          </div>
          <button
            onClick={generarMasivo}
            disabled={!grupos.trim() || procesando}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {procesando ? `Generando ${completados}/${total}…` : 'Generar RSA masivo →'}
          </button>
        </div>
      </div>

      {resultados.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500 uppercase tracking-wider">
              Resultados — {completados}/{total} completados
            </p>
            {completados > 0 && (
              <button
                onClick={() => exportarCSV(resultados)}
                className="text-xs px-3 py-1.5 border border-blue-700 text-blue-400 hover:bg-blue-900/30 rounded-lg transition-colors"
              >
                Descargar CSV para Google Ads Editor
              </button>
            )}
          </div>

          {procesando && (
            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all duration-500"
                style={{ width: `${total > 0 ? (completados / total) * 100 : 0}%` }}
              />
            </div>
          )}

          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            {resultados.map((fila) => (
              <div key={fila.id} className="border-b border-slate-800 last:border-0">
                <button
                  onClick={() => fila.estado === 'completado' && setExpandido(expandido === fila.id ? null : fila.id)}
                  className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-800/30 transition-colors text-left"
                >
                  <div className="min-w-0">
                    <p className="text-sm text-white font-medium truncate">{fila.nombre}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{fila.keywords.join(', ')}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-4">
                    {fila.data?.puntuacionGlobal && (
                      <span className={`text-sm font-bold ${fila.data.puntuacionGlobal >= 80 ? 'text-green-400' : 'text-yellow-400'}`}>
                        {fila.data.puntuacionGlobal}
                      </span>
                    )}
                    <span className={`text-xs ${ESTADO_FILA[fila.estado]?.cls}`}>
                      {ESTADO_FILA[fila.estado]?.label}
                    </span>
                    {fila.estado === 'completado' && (
                      <span className="text-slate-600 text-xs">{expandido === fila.id ? '▲' : '▼'}</span>
                    )}
                  </div>
                </button>

                {expandido === fila.id && fila.data && (
                  <div className="px-5 pb-5 space-y-3 border-t border-slate-800 pt-4">
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Headlines</p>
                      <div className="space-y-1.5">
                        {fila.data.headlines?.map((h, i) => <CopyCard key={i} copy={h} tipo="headline" limite={30} />)}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Descriptions</p>
                      <div className="space-y-1.5">
                        {fila.data.descriptions?.map((d, i) => <CopyCard key={i} copy={d} tipo="description" limite={90} />)}
                      </div>
                    </div>
                  </div>
                )}

                {fila.estado === 'error' && (
                  <div className="px-5 pb-4 text-xs text-red-400">{fila.error}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function Copywriter() {
  const [tab, setTab] = useState('copywriter')

  return (
    <div>
      <TopBar title="Copywriter IA" subtitle="Generador de textos para Google Ads — Agente 3" />
      <PageTabs tabs={TABS} active={tab} onChange={setTab} />
      <div className="p-6">
        {tab === 'copywriter' && <TabCopywriter />}
        {tab === 'rsa-masivo' && <TabRSAMasivo  />}
      </div>
    </div>
  )
}
