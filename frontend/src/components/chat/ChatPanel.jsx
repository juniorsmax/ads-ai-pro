import { useState, useRef, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import ChatMessage from './ChatMessage'
import ChatInput from './ChatInput'
import { chatIA } from '../../api/ai'

const BIENVENIDA = {
  rol: 'asistente',
  texto: 'Hola, soy tu asistente de Google Ads. Puedes preguntarme sobre el rendimiento de tus campañas, keywords, o cualquier duda sobre tu cuenta.',
}

export default function ChatPanel({ cuentaId }) {
  const [mensajes, setMensajes] = useState([BIENVENIDA])
  const bottomRef = useRef(null)

  const mutation = useMutation({
    mutationFn: ({ mensaje }) =>
      chatIA(mensaje, mensajes.slice(-10), cuentaId),
    onSuccess: (data) => {
      setMensajes(prev => [...prev, { rol: 'asistente', texto: data.respuesta }])
    },
    onError: (err) => {
      setMensajes(prev => [...prev, {
        rol: 'asistente',
        texto: `Error: ${err.message}. Inténtalo de nuevo.`,
      }])
    },
  })

  const enviarMensaje = (texto) => {
    setMensajes(prev => [...prev, { rol: 'usuario', texto }])
    mutation.mutate({ mensaje: texto })
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensajes])

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-800">
        <p className="text-sm font-medium text-white">Asistente IA</p>
        <p className="text-xs text-green-400">● En línea</p>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {mensajes.map((m, i) => <ChatMessage key={i} {...m} />)}
        {mutation.isPending && (
          <div className="flex gap-1 px-3 py-2">
            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <ChatInput onEnviar={enviarMensaje} deshabilitado={mutation.isPending} />
    </div>
  )
}
