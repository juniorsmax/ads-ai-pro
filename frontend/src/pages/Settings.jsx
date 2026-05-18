import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import TopBar from '../components/shared/TopBar'
import { usePushNotifications } from '../hooks/usePushNotifications'
import { testPush } from '../api/push'
import { api } from '../api/client'
import { cerrarSesion } from '../api/auth'

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

export default function Settings() {
  const { estado: pushEstado, soportado: pushSoportado, activar: activarPush, desactivar: desactivarPush } = usePushNotifications()

  const [whiteLabelForm, setWhiteLabelForm] = useState({ nombre: '', logo_url: '', color_primario: '#3b82f6', dominio_personalizado: '' })
  const [guardado, setGuardado] = useState(false)

  const guardarMutation = useMutation({
    mutationFn: () => api.post('/settings/whitelabel', whiteLabelForm),
    onSuccess: () => { setGuardado(true); setTimeout(() => setGuardado(false), 3000) },
  })

  const testMutation = useMutation({ mutationFn: testPush })

  return (
    <div>
      <TopBar title="Ajustes" subtitle="Configuración de cuenta y marca" />
      <div className="p-4 md:p-6 space-y-5 max-w-2xl">

        {/* Notificaciones push */}
        <SeccionCard titulo="Notificaciones Push">
          <FilaConfig
            label="Alertas en tiempo real"
            descripcion="Recibe avisos críticos de tus campañas directamente en tu dispositivo"
          >
            {!pushSoportado ? (
              <span className="text-xs text-slate-500">No compatible con este navegador</span>
            ) : pushEstado === 'denegado' ? (
              <span className="text-xs text-red-400">Permiso denegado en el navegador</span>
            ) : pushEstado === 'activo' ? (
              <button
                onClick={desactivarPush}
                className="text-xs px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg transition-colors"
              >
                Desactivar
              </button>
            ) : (
              <button
                onClick={activarPush}
                disabled={pushEstado === 'solicitando'}
                className="text-xs px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {pushEstado === 'solicitando' ? 'Activando...' : 'Activar'}
              </button>
            )}
          </FilaConfig>

          {pushEstado === 'activo' && (
            <FilaConfig label="Prueba de notificación" descripcion="Envía una notificación de prueba a este dispositivo">
              <button
                onClick={() => testMutation.mutate()}
                disabled={testMutation.isPending}
                className="text-xs px-3 py-1.5 border border-slate-700 hover:border-slate-500 text-slate-400 hover:text-white rounded-lg transition-colors disabled:opacity-50"
              >
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

        {/* White-label */}
        <SeccionCard titulo="White-Label — Marca personalizada">
          <div className="space-y-4">
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">Nombre de la marca</label>
              <input
                type="text"
                value={whiteLabelForm.nombre}
                onChange={e => setWhiteLabelForm(p => ({ ...p, nombre: e.target.value }))}
                placeholder="Ej: MiAgencia Ads Pro"
                className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 placeholder:text-slate-500"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">URL del logo</label>
              <input
                type="url"
                value={whiteLabelForm.logo_url}
                onChange={e => setWhiteLabelForm(p => ({ ...p, logo_url: e.target.value }))}
                placeholder="https://tuagencia.com/logo.png"
                className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 placeholder:text-slate-500"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">Color principal</label>
              <div className="flex gap-3 items-center">
                <input
                  type="color"
                  value={whiteLabelForm.color_primario}
                  onChange={e => setWhiteLabelForm(p => ({ ...p, color_primario: e.target.value }))}
                  className="w-10 h-10 rounded-lg border border-slate-700 bg-slate-800 cursor-pointer p-1"
                />
                <input
                  type="text"
                  value={whiteLabelForm.color_primario}
                  onChange={e => setWhiteLabelForm(p => ({ ...p, color_primario: e.target.value }))}
                  placeholder="#3b82f6"
                  className="flex-1 bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">
                Dominio personalizado
                <span className="ml-2 text-xs text-blue-400 font-normal">Plan Agencia</span>
              </label>
              <input
                type="text"
                value={whiteLabelForm.dominio_personalizado}
                onChange={e => setWhiteLabelForm(p => ({ ...p, dominio_personalizado: e.target.value }))}
                placeholder="ads.tuagencia.com"
                className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 placeholder:text-slate-500"
              />
              <p className="text-xs text-slate-500 mt-1.5">
                Añade un registro CNAME en tu DNS apuntando a <code className="text-blue-400">app.adsaipro.com</code>
              </p>
            </div>

            <button
              onClick={() => guardarMutation.mutate()}
              disabled={guardarMutation.isPending}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {guardarMutation.isPending ? 'Guardando...' : guardado ? 'Guardado correctamente' : 'Guardar configuración'}
            </button>

            {guardarMutation.isError && (
              <p className="text-xs text-red-400">{guardarMutation.error?.message ?? 'Error guardando configuración'}</p>
            )}
          </div>
        </SeccionCard>

        {/* Cuenta */}
        <SeccionCard titulo="Cuenta">
          <FilaConfig label="Plan actual" descripcion="Facturación y límites de uso">
            <a href="/billing" className="text-xs text-blue-400 hover:text-blue-300">
              Ver plan →
            </a>
          </FilaConfig>
          <FilaConfig label="Cerrar sesión" descripcion="">
            <button
              onClick={cerrarSesion}
              className="text-xs px-3 py-1.5 border border-slate-700 hover:border-red-700 text-slate-400 hover:text-red-400 rounded-lg transition-colors"
            >
              Cerrar sesión
            </button>
          </FilaConfig>
        </SeccionCard>

      </div>
    </div>
  )
}
