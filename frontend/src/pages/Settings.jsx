import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import TopBar from '../components/shared/TopBar'
import PageTabs from '../components/shared/PageTabs'
import { usePushNotifications } from '../hooks/usePushNotifications'
import { testPush } from '../api/push'
import { api } from '../api/client'
import { cerrarSesion } from '../api/auth'
import { guardarTelegram, testTelegram, guardarDiscord, testDiscord, getIntegraciones } from '../api/integraciones'

const TABS = [
  { id: 'general',       label: 'General' },
  { id: 'notificaciones', label: 'Notificaciones' },
  { id: 'apis',          label: 'Integraciones API', nuevo: true },
]

function SeccionCard({ titulo, children }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-800">
        <p className="text-xs text-slate-500 uppercase tracking-wider">{titulo}</p>
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

function FilaConfig({ label, descripcion, children }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-slate-800 last:border-0">
      <div className="min-w-0">
        <p className="text-sm text-white font-medium">{label}</p>
        {descripcion && <p className="text-xs text-slate-500 mt-0.5">{descripcion}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

function TabGeneral() {
  const { estado: pushEstado, soportado: pushSoportado, activar: activarPush, desactivar: desactivarPush } = usePushNotifications()
  const [whiteLabelForm, setWhiteLabelForm] = useState({ nombre: '', logo_url: '', color_primario: '#3b82f6', dominio_personalizado: '' })
  const [guardado, setGuardado] = useState(false)

  const guardarMutation = useMutation({
    mutationFn: () => api.post('/settings/whitelabel', whiteLabelForm),
    onSuccess: () => { setGuardado(true); setTimeout(() => setGuardado(false), 3000) },
  })

  const testMutation = useMutation({ mutationFn: testPush })

  return (
    <div className="space-y-5 max-w-2xl">
      <SeccionCard titulo="Notificaciones Push">
        <FilaConfig label="Alertas en tiempo real" descripcion="Recibe avisos críticos de tus campañas directamente en tu dispositivo">
          {!pushSoportado ? (
            <span className="text-xs text-slate-500">No compatible con este navegador</span>
          ) : pushEstado === 'denegado' ? (
            <span className="text-xs text-red-400">Permiso denegado en el navegador</span>
          ) : pushEstado === 'activo' ? (
            <button onClick={desactivarPush} className="text-xs px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg transition-colors">
              Desactivar
            </button>
          ) : (
            <button onClick={activarPush} disabled={pushEstado === 'solicitando'}
              className="text-xs px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50">
              {pushEstado === 'solicitando' ? 'Activando...' : 'Activar'}
            </button>
          )}
        </FilaConfig>
        {pushEstado === 'activo' && (
          <FilaConfig label="Prueba de notificación" descripcion="Envía una notificación de prueba a este dispositivo">
            <button onClick={() => testMutation.mutate()} disabled={testMutation.isPending}
              className="text-xs px-3 py-1.5 border border-slate-700 hover:border-slate-500 text-slate-400 hover:text-white rounded-lg transition-colors disabled:opacity-50">
              {testMutation.isPending ? 'Enviando...' : 'Enviar prueba'}
            </button>
          </FilaConfig>
        )}
        {pushEstado === 'activo' && (
          <div className="mt-3 flex items-center gap-2 text-xs text-green-400">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse inline-block" />
            Notificaciones activas en este dispositivo
          </div>
        )}
      </SeccionCard>

      <SeccionCard titulo="White-Label — Marca personalizada">
        <div className="space-y-4">
          {[
            { key: 'nombre', label: 'Nombre de la marca', placeholder: 'MiAgencia Ads Pro', type: 'text' },
            { key: 'logo_url', label: 'URL del logo', placeholder: 'https://tuagencia.com/logo.png', type: 'url' },
          ].map(({ key, label, placeholder, type }) => (
            <div key={key}>
              <label className="text-xs text-slate-400 mb-1.5 block">{label}</label>
              <input type={type} value={whiteLabelForm[key]}
                onChange={e => setWhiteLabelForm(p => ({ ...p, [key]: e.target.value }))}
                placeholder={placeholder}
                className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 placeholder:text-slate-500" />
            </div>
          ))}
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">Color principal</label>
            <div className="flex gap-3 items-center">
              <input type="color" value={whiteLabelForm.color_primario}
                onChange={e => setWhiteLabelForm(p => ({ ...p, color_primario: e.target.value }))}
                className="w-10 h-10 rounded-lg border border-slate-700 bg-slate-800 cursor-pointer p-1" />
              <input type="text" value={whiteLabelForm.color_primario}
                onChange={e => setWhiteLabelForm(p => ({ ...p, color_primario: e.target.value }))}
                className="flex-1 bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500" />
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">
              Dominio personalizado
              <span className="ml-2 text-xs text-blue-400 font-normal">Plan Agencia</span>
            </label>
            <input type="text" value={whiteLabelForm.dominio_personalizado}
              onChange={e => setWhiteLabelForm(p => ({ ...p, dominio_personalizado: e.target.value }))}
              placeholder="ads.tuagencia.com"
              className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 placeholder:text-slate-500" />
            <p className="text-xs text-slate-500 mt-1.5">
              Añade un registro CNAME apuntando a <code className="text-blue-400">app.adsaipro.com</code>
            </p>
          </div>
          <button onClick={() => guardarMutation.mutate()} disabled={guardarMutation.isPending}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50">
            {guardarMutation.isPending ? 'Guardando...' : guardado ? 'Guardado correctamente' : 'Guardar configuración'}
          </button>
          {guardarMutation.isError && <p className="text-xs text-red-400">{guardarMutation.error?.message}</p>}
        </div>
      </SeccionCard>

      <SeccionCard titulo="Cuenta">
        <FilaConfig label="Plan actual" descripcion="Facturación y límites de uso">
          <a href="/billing" className="text-xs text-blue-400 hover:text-blue-300">Ver plan →</a>
        </FilaConfig>
        <FilaConfig label="Cerrar sesión" descripcion="">
          <button onClick={cerrarSesion}
            className="text-xs px-3 py-1.5 border border-slate-700 hover:border-red-700 text-slate-400 hover:text-red-400 rounded-lg transition-colors">
            Cerrar sesión
          </button>
        </FilaConfig>
      </SeccionCard>
    </div>
  )
}

function CanalNotif({ titulo, descripcion, icono, children }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-800 flex items-center gap-3">
        <span className="text-xl">{icono}</span>
        <div>
          <p className="text-sm font-medium text-white">{titulo}</p>
          <p className="text-xs text-slate-500">{descripcion}</p>
        </div>
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

function TabNotificaciones() {
  const [telegram, setTelegram]   = useState({ botToken: '', chatId: '' })
  const [discord, setDiscord]     = useState({ webhookUrl: '' })
  const [tgGuardado, setTgGuardado] = useState(false)
  const [dcGuardado, setDcGuardado] = useState(false)

  const guardarTg = useMutation({
    mutationFn: () => guardarTelegram(telegram.botToken, telegram.chatId),
    onSuccess: () => { setTgGuardado(true); setTimeout(() => setTgGuardado(false), 3000) },
  })
  const probarTg = useMutation({ mutationFn: testTelegram })

  const guardarDc = useMutation({
    mutationFn: () => guardarDiscord(discord.webhookUrl),
    onSuccess: () => { setDcGuardado(true); setTimeout(() => setDcGuardado(false), 3000) },
  })
  const probarDc = useMutation({ mutationFn: testDiscord })

  return (
    <div className="space-y-5 max-w-2xl">
      <p className="text-xs text-slate-500">
        Además de las notificaciones push del navegador, puedes recibir alertas críticas directamente en Telegram o Discord.
      </p>

      <CanalNotif titulo="Telegram Bot" icono="✈" descripcion="Alta penetración en LATAM. Alertas instantáneas + comandos bidireccionales.">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Bot Token</label>
              <input type="password" value={telegram.botToken}
                onChange={e => setTelegram(p => ({ ...p, botToken: e.target.value }))}
                placeholder="123456:ABC-DEF..."
                className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 placeholder:text-slate-600" />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Chat ID</label>
              <input type="text" value={telegram.chatId}
                onChange={e => setTelegram(p => ({ ...p, chatId: e.target.value }))}
                placeholder="-100123456789"
                className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 placeholder:text-slate-600" />
            </div>
          </div>
          <p className="text-xs text-slate-600">
            Crea un bot en <span className="text-blue-400">@BotFather</span> → obtén el token → añade el bot a tu grupo → usa <span className="text-blue-400">@getidsbot</span> para el Chat ID.
          </p>
          <div className="flex gap-2">
            <button onClick={() => guardarTg.mutate()} disabled={!telegram.botToken || !telegram.chatId || guardarTg.isPending}
              className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50">
              {guardarTg.isPending ? 'Guardando...' : tgGuardado ? 'Guardado ✓' : 'Guardar'}
            </button>
            <button onClick={() => probarTg.mutate()} disabled={!telegram.botToken || probarTg.isPending}
              className="px-4 py-2 border border-slate-700 hover:border-slate-500 text-slate-400 hover:text-white text-sm rounded-lg transition-colors disabled:opacity-50">
              {probarTg.isPending ? 'Enviando...' : 'Probar'}
            </button>
          </div>
          {probarTg.isSuccess && <p className="text-xs text-green-400">Mensaje de prueba enviado a Telegram.</p>}
          {probarTg.isError   && <p className="text-xs text-red-400">{probarTg.error?.message}</p>}
        </div>
      </CanalNotif>

      <CanalNotif titulo="Discord Webhook" icono="◈" descripcion="Ideal para equipos de agencias. Alertas en canales de Discord con formato enriquecido.">
        <div className="space-y-3">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">URL del Webhook</label>
            <input type="url" value={discord.webhookUrl}
              onChange={e => setDiscord(p => ({ ...p, webhookUrl: e.target.value }))}
              placeholder="https://discord.com/api/webhooks/..."
              className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 placeholder:text-slate-600" />
          </div>
          <p className="text-xs text-slate-600">
            En tu servidor Discord: canal → Editar → Integraciones → Webhooks → Crear webhook → Copiar URL.
          </p>
          <div className="flex gap-2">
            <button onClick={() => guardarDc.mutate()} disabled={!discord.webhookUrl || guardarDc.isPending}
              className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50">
              {guardarDc.isPending ? 'Guardando...' : dcGuardado ? 'Guardado ✓' : 'Guardar'}
            </button>
            <button onClick={() => probarDc.mutate()} disabled={!discord.webhookUrl || probarDc.isPending}
              className="px-4 py-2 border border-slate-700 hover:border-slate-500 text-slate-400 hover:text-white text-sm rounded-lg transition-colors disabled:opacity-50">
              {probarDc.isPending ? 'Enviando...' : 'Probar'}
            </button>
          </div>
          {probarDc.isSuccess && <p className="text-xs text-green-400">Mensaje de prueba enviado a Discord.</p>}
          {probarDc.isError   && <p className="text-xs text-red-400">{probarDc.error?.message}</p>}
        </div>
      </CanalNotif>
    </div>
  )
}

const APIS_CONFIG = [
  {
    id: 'gsc',
    nombre: 'Google Search Console',
    descripcion: 'Keywords orgánicas, CTR, posición media. Detecta canibalización SEO+PPC.',
    icono: '◎',
    color: 'green',
    endpoint: '/api/integraciones/gsc/auth',
    gratuito: true,
  },
  {
    id: 'ga4',
    nombre: 'Google Analytics 4',
    descripcion: 'Comportamiento post-clic, embudos, tasa de rebote por campaña.',
    icono: '◈',
    color: 'blue',
    endpoint: '/api/integraciones/ga4/auth',
    gratuito: true,
  },
  {
    id: 'merchant',
    nombre: 'Google Merchant Center',
    descripcion: 'Auditoría de feed Shopping. Detecta productos desaprobados con alto ROAS.',
    icono: '⊞',
    color: 'yellow',
    endpoint: '/api/integraciones/merchant/auth',
    gratuito: true,
  },
  {
    id: 'gmb',
    nombre: 'Google Business Profile',
    descripcion: 'Sincroniza ubicaciones y horarios para extensiones de anuncio automáticas.',
    icono: '⊕',
    color: 'red',
    endpoint: '/api/integraciones/gmb/auth',
    gratuito: true,
  },
  {
    id: 'pagespeed',
    nombre: 'PageSpeed Insights',
    descripcion: 'Core Web Vitals de tus landing pages. Impacta directamente en el Quality Score.',
    icono: '↕',
    color: 'blue',
    endpoint: null,
    gratuito: true,
    activo: true,
  },
  {
    id: 'frankfurter',
    nombre: 'Tipos de Cambio (BCE)',
    descripcion: 'Tasas de cambio en tiempo real para campañas internacionales. Sin API key.',
    icono: '€',
    color: 'green',
    endpoint: null,
    gratuito: true,
    activo: true,
  },
]

function EstadoBadge({ activo }) {
  if (activo) return (
    <span className="flex items-center gap-1.5 text-xs text-green-400">
      <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
      Conectado
    </span>
  )
  return (
    <span className="flex items-center gap-1.5 text-xs text-slate-500">
      <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
      No conectado
    </span>
  )
}

function TabAPIs() {
  const { data: estadoIntegraciones } = useQuery({
    queryKey: ['integraciones'],
    queryFn: getIntegraciones,
    retry: false,
  })

  return (
    <div className="space-y-3 max-w-2xl">
      <p className="text-xs text-slate-500">
        Todas estas integraciones son gratuitas y amplían los datos disponibles para los agentes IA.
      </p>

      {APIS_CONFIG.map(api => {
        const conectado = api.activo || estadoIntegraciones?.[api.id] === true
        return (
          <div key={api.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-9 h-9 bg-slate-800 border border-slate-700 rounded-lg flex items-center justify-center text-base shrink-0">
                  {api.icono}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-medium text-white">{api.nombre}</p>
                    {api.gratuito && (
                      <span className="text-xs px-1.5 py-0.5 bg-green-900/40 border border-green-700 text-green-400 rounded">Gratis</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">{api.descripcion}</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <EstadoBadge activo={conectado} />
                {!conectado && api.endpoint && (
                  <a
                    href={api.endpoint}
                    className="text-xs px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    Conectar
                  </a>
                )}
                {conectado && (
                  <button className="text-xs px-3 py-1.5 border border-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors">
                    Configurar
                  </button>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function Settings() {
  const [tab, setTab] = useState('general')

  return (
    <div>
      <TopBar title="Ajustes" subtitle="Configuración de cuenta, notificaciones e integraciones" />
      <PageTabs tabs={TABS} active={tab} onChange={setTab} />
      <div className="p-4 md:p-6">
        {tab === 'general'        && <TabGeneral />}
        {tab === 'notificaciones' && <TabNotificaciones />}
        {tab === 'apis'           && <TabAPIs />}
      </div>
    </div>
  )
}
