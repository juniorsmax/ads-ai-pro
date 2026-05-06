import { useState, useRef, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useLocation } from 'react-router-dom'
import { enviarFeedback } from '../../api/feedback'

const TIPOS = [
  { id: 'bug', label: 'Error', icono: '🐛', placeholder: 'Describe qué pasó y cómo reproducirlo...' },
  { id: 'sugerencia', label: 'Sugerencia', icono: '💡', placeholder: '¿Qué funcionalidad te gustaría ver?' },
  { id: 'comentario', label: 'Comentario', icono: '💬', placeholder: 'Cuéntanos tu experiencia con ADSAI PRO...' },
]

const NPS_LABELS = { 0: 'Nada probable', 5: 'Neutral', 10: 'Muy probable' }

function PuntuacionNPS({ valor, onChange }) {
  return (
    <div>
      <p className="text-xs text-slate-400 mb-2">
        ¿Con qué probabilidad recomendarías ADSAI PRO? (0–10)
      </p>
      <div className="flex gap-1">
        {Array.from({ length: 11 }, (_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onChange(i)}
            className={`flex-1 py-1.5 text-xs rounded transition-colors font-medium ${
              valor === i
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-white'
            }`}
          >
            {i}
          </button>
        ))}
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-xs text-slate-600">Nada probable</span>
        <span className="text-xs text-slate-600">Muy probable</span>
      </div>
    </div>
  )
}

export default function FeedbackWidget() {
  const [abierto, setAbierto] = useState(false)
  const [tipo, setTipo] = useState('comentario')
  const [mensaje, setMensaje] = useState('')
  const [nps, setNps] = useState(null)
  const [enviado, setEnviado] = useState(false)
  const panelRef = useRef(null)
  const location = useLocation()

  const tipoActual = TIPOS.find(t => t.id === tipo)

  const mutation = useMutation({
    mutationFn: () =>
      enviarFeedback({
        tipo,
        mensaje,
        nps: tipo === 'comentario' ? nps : null,
        pagina: location.pathname,
        metadata: { userAgent: navigator.userAgent },
      }),
    onSuccess: () => {
      setEnviado(true)
      setTimeout(() => {
        setAbierto(false)
        setEnviado(false)
        setMensaje('')
        setNps(null)
        setTipo('comentario')
      }, 2500)
    },
  })

  // Cerrar al hacer clic fuera
  useEffect(() => {
    if (!abierto) return
    function handler(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) setAbierto(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [abierto])

  const puedeEnviar = mensaje.trim().length >= 10 && !mutation.isPending

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 z-50" ref={panelRef}>
      {/* Panel */}
      {abierto && (
        <div className="mb-3 w-80 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
            <p className="text-sm font-medium text-white">Enviar feedback</p>
            <button
              onClick={() => setAbierto(false)}
              className="text-slate-500 hover:text-white transition-colors text-lg leading-none"
            >
              ×
            </button>
          </div>

          {enviado ? (
            <div className="px-4 py-10 text-center">
              <p className="text-2xl mb-3">🙏</p>
              <p className="text-white font-medium mb-1">¡Gracias por tu feedback!</p>
              <p className="text-slate-400 text-sm">Nos ayuda a mejorar ADSAI PRO.</p>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {/* Tabs de tipo */}
              <div className="flex gap-1.5">
                {TIPOS.map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTipo(t.id)}
                    className={`flex-1 py-1.5 text-xs rounded-lg transition-colors ${
                      tipo === t.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                    }`}
                  >
                    {t.icono} {t.label}
                  </button>
                ))}
              </div>

              {/* Textarea */}
              <textarea
                value={mensaje}
                onChange={e => setMensaje(e.target.value)}
                placeholder={tipoActual.placeholder}
                rows={4}
                className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:border-blue-500 placeholder:text-slate-500"
              />

              {/* NPS solo para comentarios */}
              {tipo === 'comentario' && (
                <PuntuacionNPS valor={nps} onChange={setNps} />
              )}

              {/* Página capturada */}
              <p className="text-xs text-slate-600">
                Página: <span className="text-slate-500">{location.pathname}</span>
              </p>

              {/* Error */}
              {mutation.isError && (
                <p className="text-xs text-red-400">{mutation.error?.message ?? 'Error enviando feedback'}</p>
              )}

              {/* Botón enviar */}
              <button
                type="button"
                onClick={() => mutation.mutate()}
                disabled={!puedeEnviar}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-40"
              >
                {mutation.isPending ? 'Enviando...' : 'Enviar feedback →'}
              </button>

              <p className="text-xs text-slate-600 text-center">Mínimo 10 caracteres</p>
            </div>
          )}
        </div>
      )}

      {/* Botón flotante */}
      <button
        onClick={() => setAbierto(v => !v)}
        className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all ${
          abierto
            ? 'bg-slate-700 text-white rotate-180'
            : 'bg-blue-600 hover:bg-blue-500 text-white hover:scale-110'
        }`}
        title="Enviar feedback"
      >
        {abierto ? '×' : '💬'}
      </button>
    </div>
  )
}
