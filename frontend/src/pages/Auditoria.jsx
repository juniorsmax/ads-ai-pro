import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import TopBar from '../components/shared/TopBar'
import PageTabs from '../components/shared/PageTabs'
import LoadingState from '../components/shared/LoadingState'
import { useCuentaStore } from '../store/cuentaStore'
import { getHealthScore, getPageSpeed } from '../api/auditoria'
import { getIntegraciones } from '../api/integraciones'

const TABS = [
  { id: 'health',        label: 'Health Score' },
  { id: 'pagespeed',     label: 'PageSpeed' },
  { id: 'integraciones', label: 'Integraciones' },
]

const CHECKS_CATEGORIAS = {
  'Keywords':   ['keywords-sin-conv', 'qs-bajo', 'keywords-pausadas', 'ngramas-detectados'],
  'Anuncios':   ['rsa-sin-assets', 'anuncios-desaprobados', 'ctr-bajo', 'politica-violaciones'],
  'Extensiones':['sitelinks', 'llamada', 'precio', 'ubicacion'],
  'Calidad':    ['qs-medio', 'landing-speed', 'relevancia-anuncio', 'ad-strength'],
  'Presupuesto':['budget-pacing', 'campanias-limitadas', 'conversion-tracking'],
}

function ScoreCircle({ score }) {
  const color = score >= 80 ? '#22c55e' : score >= 60 ? '#f59e0b' : '#ef4444'
  const circumference = 2 * Math.PI * 40
  const offset = circumference - (score / 100) * circumference

  return (
    <div className="relative w-28 h-28 flex items-center justify-center">
      <svg className="absolute inset-0 -rotate-90" width="112" height="112" viewBox="0 0 112 112">
        <circle cx="56" cy="56" r="40" fill="none" stroke="#1e293b" strokeWidth="8" />
        <circle cx="56" cy="56" r="40" fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease' }} />
      </svg>
      <div className="text-center">
        <p className="text-3xl font-bold text-white">{score}</p>
        <p className="text-xs text-slate-500">/100</p>
      </div>
    </div>
  )
}

function CheckItem({ check }) {
  const icono = check.estado === 'ok' ? '✓' : check.estado === 'aviso' ? '⚠' : '✗'
  const color = check.estado === 'ok'
    ? 'text-green-400'
    : check.estado === 'aviso'
    ? 'text-yellow-400'
    : 'text-red-400'

  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-slate-800 last:border-0">
      <span className={`text-sm shrink-0 mt-0.5 ${color}`}>{icono}</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-white">{check.titulo}</p>
        {check.descripcion && <p className="text-xs text-slate-500 mt-0.5">{check.descripcion}</p>}
      </div>
      {check.valor && <span className="text-xs text-slate-400 shrink-0">{check.valor}</span>}
    </div>
  )
}

function TabHealthScore() {
  const cuentaActivaId = useCuentaStore(s => s.cuentaActivaId)

  const mutation = useMutation({
    mutationFn: () => getHealthScore(cuentaActivaId),
  })

  if (!cuentaActivaId) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
        <p className="text-slate-400">Selecciona una cuenta en la barra superior para analizar.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {!mutation.data && !mutation.isPending && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center space-y-4">
          <div className="flex justify-center">
            <ScoreCircle score={0} />
          </div>
          <div>
            <p className="text-white font-semibold mb-1">Auditoría de salud de cuenta</p>
            <p className="text-slate-400 text-sm max-w-md mx-auto">
              Analiza más de 15 puntos críticos: keywords sin conversión, anuncios desaprobados, Quality Score bajo, extensiones faltantes, pacing de presupuesto y más.
            </p>
          </div>
          <button
            onClick={() => mutation.mutate()}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Analizar cuenta ahora →
          </button>
        </div>
      )}

      {mutation.isPending && <LoadingState mensaje="Agente IA auditando tu cuenta de Google Ads..." />}

      {mutation.isError && (
        <div className="px-4 py-3 bg-red-900/40 border border-red-700 rounded-xl text-red-300 text-sm">
          {mutation.error?.message ?? 'Error analizando la cuenta'}
          <p className="text-xs mt-1 opacity-70">Endpoint: POST /api/auditoria/health-score</p>
        </div>
      )}

      {mutation.data && !mutation.isPending && (
        <>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center gap-8">
              <ScoreCircle score={mutation.data.score} />
              <div className="flex-1">
                <p className="text-xl font-bold text-white mb-1">{mutation.data.titulo ?? 'Salud de la cuenta'}</p>
                <p className="text-slate-400 text-sm mb-4">{mutation.data.resumen}</p>
                <div className="flex gap-4 text-sm">
                  <span className="text-green-400">✓ {mutation.data.okCount ?? 0} correctos</span>
                  <span className="text-yellow-400">⚠ {mutation.data.avisoCount ?? 0} avisos</span>
                  <span className="text-red-400">✗ {mutation.data.errorCount ?? 0} críticos</span>
                </div>
              </div>
              <button
                onClick={() => mutation.mutate()}
                className="px-4 py-2 border border-slate-700 text-slate-400 hover:text-white text-xs rounded-lg transition-colors shrink-0"
              >
                Repetir análisis
              </button>
            </div>
          </div>

          {Object.entries(mutation.data.categorias ?? {}).map(([cat, checks]) => (
            <div key={cat} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between">
                <p className="text-xs text-slate-500 uppercase tracking-wider">{cat}</p>
                <p className="text-xs text-slate-600">
                  {checks.filter(c => c.estado === 'ok').length}/{checks.length} OK
                </p>
              </div>
              <div className="px-5">
                {checks.map((c, i) => <CheckItem key={i} check={c} />)}
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  )
}

function ScoreBar({ valor, label }) {
  const color = valor >= 90 ? 'bg-green-500' : valor >= 50 ? 'bg-yellow-500' : 'bg-red-500'
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-slate-400">{label}</span>
        <span className={`font-bold ${valor >= 90 ? 'text-green-400' : valor >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>{valor}/100</span>
      </div>
      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${valor}%` }} />
      </div>
    </div>
  )
}

function TabPageSpeed() {
  const [url, setUrl] = useState('')

  const mutation = useMutation({ mutationFn: () => getPageSpeed(url) })

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div>
          <p className="text-sm font-medium text-white mb-1">Analizar velocidad de landing page</p>
          <p className="text-xs text-slate-500">
            El Core Web Vitals score impacta directamente en el Quality Score de tus anuncios y en el coste por clic.
          </p>
        </div>
        <div className="flex gap-3">
          <input
            type="url"
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="https://tudominio.com/landing-page"
            className="flex-1 bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-blue-500 placeholder:text-slate-600"
          />
          <button
            onClick={() => mutation.mutate()}
            disabled={!url.trim() || mutation.isPending}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            {mutation.isPending ? 'Analizando...' : 'Analizar →'}
          </button>
        </div>
      </div>

      {mutation.isPending && <LoadingState mensaje="Analizando Core Web Vitals..." />}

      {mutation.isError && (
        <div className="px-4 py-3 bg-red-900/40 border border-red-700 rounded-xl text-red-300 text-sm">
          {mutation.error?.message ?? 'Error analizando la URL'}
          <p className="text-xs mt-1 opacity-70">Endpoint: POST /api/auditoria/pagespeed</p>
        </div>
      )}

      {mutation.data && !mutation.isPending && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <p className="text-xs text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <span>📱</span> Móvil
              </p>
              <ScoreBar valor={mutation.data.movil?.puntuacion ?? 0} label="Rendimiento" />
              <div className="grid grid-cols-3 gap-3 text-center text-xs">
                {[
                  { label: 'LCP', valor: mutation.data.movil?.lcp },
                  { label: 'FID', valor: mutation.data.movil?.fid },
                  { label: 'CLS', valor: mutation.data.movil?.cls },
                ].map(({ label, valor }) => (
                  <div key={label} className="bg-slate-800 rounded-lg p-2">
                    <p className="text-white font-bold text-sm">{valor ?? '—'}</p>
                    <p className="text-slate-500">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <p className="text-xs text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <span>🖥</span> Escritorio
              </p>
              <ScoreBar valor={mutation.data.escritorio?.puntuacion ?? 0} label="Rendimiento" />
              <div className="grid grid-cols-3 gap-3 text-center text-xs">
                {[
                  { label: 'LCP', valor: mutation.data.escritorio?.lcp },
                  { label: 'FID', valor: mutation.data.escritorio?.fid },
                  { label: 'CLS', valor: mutation.data.escritorio?.cls },
                ].map(({ label, valor }) => (
                  <div key={label} className="bg-slate-800 rounded-lg p-2">
                    <p className="text-white font-bold text-sm">{valor ?? '—'}</p>
                    <p className="text-slate-500">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {mutation.data.impactoQS && (
            <div className={`px-4 py-3 rounded-xl border text-sm ${
              mutation.data.impactoQS === 'positivo'
                ? 'bg-green-900/20 border-green-700 text-green-300'
                : mutation.data.impactoQS === 'negativo'
                ? 'bg-red-900/20 border-red-700 text-red-300'
                : 'bg-yellow-900/20 border-yellow-700 text-yellow-300'
            }`}>
              <strong>Impacto en Quality Score:</strong> {mutation.data.mensajeQS}
            </div>
          )}

          {mutation.data.recomendaciones?.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
              <p className="text-xs text-slate-500 uppercase tracking-wider">Mejoras recomendadas</p>
              {mutation.data.recomendaciones.map((r, i) => (
                <div key={i} className="flex items-start gap-3 text-sm">
                  <span className="text-blue-400 shrink-0 mt-0.5">→</span>
                  <span className="text-slate-300">{r}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {!mutation.data && !mutation.isPending && !mutation.isError && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
          <p className="text-slate-500 text-sm">Introduce la URL de una landing page para analizarla</p>
          <p className="text-slate-600 text-xs mt-1">
            Las landing pages lentas reducen el Quality Score y aumentan el CPC hasta un 30%
          </p>
        </div>
      )}
    </div>
  )
}

const INTEGRACIONES_INFO = [
  {
    id: 'gsc',
    nombre: 'Google Search Console',
    descripcion: 'Importa datos orgánicos para detectar canibalización SEO+PPC.',
    icono: '◎',
    authUrl: '/api/integraciones/gsc/auth',
  },
  {
    id: 'ga4',
    nombre: 'Google Analytics 4',
    descripcion: 'Comportamiento post-clic, embudos y tasa de rebote por campaña.',
    icono: '◈',
    authUrl: '/api/integraciones/ga4/auth',
  },
  {
    id: 'merchant',
    nombre: 'Google Merchant Center',
    descripcion: 'Auditoría de feed Shopping y productos desaprobados.',
    icono: '⊞',
    authUrl: '/api/integraciones/merchant/auth',
  },
  {
    id: 'gmb',
    nombre: 'Google Business Profile',
    descripcion: 'Sincroniza ubicaciones y horarios para extensiones automáticas.',
    icono: '⊕',
    authUrl: '/api/integraciones/gmb/auth',
  },
  {
    id: 'telegram',
    nombre: 'Telegram Bot',
    descripcion: 'Alertas críticas + comandos bidireccionales en Telegram.',
    icono: '✈',
    configUrl: '/settings',
  },
  {
    id: 'discord',
    nombre: 'Discord Webhooks',
    descripcion: 'Notificaciones de campañas en tus canales de Discord.',
    icono: '◉',
    configUrl: '/settings',
  },
  {
    id: 'pagespeed',
    nombre: 'PageSpeed Insights API',
    descripcion: 'Core Web Vitals de tus landing pages. Sin configuración necesaria.',
    icono: '↕',
    activo: true,
  },
  {
    id: 'frankfurter',
    nombre: 'Frankfurter (BCE)',
    descripcion: 'Tipos de cambio en tiempo real. Sin API key requerida.',
    icono: '€',
    activo: true,
  },
]

function TabIntegraciones() {
  const { data: estado } = useQuery({
    queryKey: ['integraciones'],
    queryFn: getIntegraciones,
    retry: false,
  })

  return (
    <div className="space-y-3 max-w-3xl">
      <p className="text-xs text-slate-500">
        Todas las integraciones son gratuitas. Cada una amplía los datos disponibles para los agentes IA y los reportes.
      </p>

      <div className="grid gap-3">
        {INTEGRACIONES_INFO.map(int => {
          const conectado = int.activo || estado?.[int.id] === true
          return (
            <div key={int.id} className={`bg-slate-900 border rounded-xl p-4 flex items-center gap-4 ${conectado ? 'border-slate-700' : 'border-slate-800'}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 border ${conectado ? 'bg-blue-900/30 border-blue-700' : 'bg-slate-800 border-slate-700'}`}>
                {int.icono}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-medium text-white">{int.nombre}</p>
                  <span className="text-xs px-1.5 py-0.5 bg-green-900/40 border border-green-700 text-green-400 rounded">Gratis</span>
                </div>
                <p className="text-xs text-slate-400">{int.descripcion}</p>
              </div>
              <div className="shrink-0 flex flex-col items-end gap-1.5">
                {conectado ? (
                  <>
                    <span className="flex items-center gap-1.5 text-xs text-green-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                      Activo
                    </span>
                    {int.configUrl && (
                      <a href={int.configUrl} className="text-xs text-slate-500 hover:text-slate-300">Configurar</a>
                    )}
                  </>
                ) : (
                  <>
                    <span className="flex items-center gap-1.5 text-xs text-slate-500">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                      No conectado
                    </span>
                    {int.authUrl && (
                      <a href={int.authUrl} className="text-xs px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                        Conectar
                      </a>
                    )}
                    {int.configUrl && (
                      <a href={int.configUrl} className="text-xs px-3 py-1 border border-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors">
                        Configurar
                      </a>
                    )}
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function Auditoria() {
  const [tab, setTab] = useState('health')

  return (
    <div>
      <TopBar title="Auditoría" subtitle="Health Score, velocidad de páginas e integraciones" />
      <PageTabs tabs={TABS} active={tab} onChange={setTab} />
      <div className="p-4 md:p-6">
        {tab === 'health'        && <TabHealthScore />}
        {tab === 'pagespeed'     && <TabPageSpeed />}
        {tab === 'integraciones' && <TabIntegraciones />}
      </div>
    </div>
  )
}
