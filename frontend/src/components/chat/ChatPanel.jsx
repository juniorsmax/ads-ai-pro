import { useState } from 'react'
import ChatMessage from './ChatMessage'
import ChatInput from './ChatInput'

const MENSAJES_DEMO = [
  { rol: 'asistente', texto: 'Hola, soy tu asistente de Google Ads. Puedes preguntarme sobre el rendimiento de tus campañas, keywords o cualquier duda sobre tu cuenta.' },
]

export default function ChatPanel() {
  const [mensajes, setMensajes] = useState(MENSAJES_DEMO)
  const [cargando, setCargando] = useState(false)

  const enviarMensaje = async (texto) => {
    const nuevosMensajes = [...mensajes, { rol: 'usuario', texto }]
    setMensajes(nuevosMensajes)
    setCargando(true)

    // TODO: conectar con /api/ai/chat
    setTimeout(() => {
      setMensajes(prev => [...prev, {
        rol: 'asistente',
        texto: 'Estoy analizando tu cuenta... (próximamente conectado a la API de IA)',
      }])
      setCargando(false)
    }, 1000)
  }

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-800">
        <p className="text-sm font-medium text-white">Asistente IA</p>
        <p className="text-xs text-green-400">● En línea</p>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {mensajes.map((m, i) => <ChatMessage key={i} {...m} />)}
        {cargando && (
          <div className="flex gap-1 px-3 py-2">
            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        )}
      </div>
      <ChatInput onEnviar={enviarMensaje} deshabilitado={cargando} />
    </div>
  )
}
