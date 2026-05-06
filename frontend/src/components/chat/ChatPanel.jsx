import { useState, useRef, useEffect } from 'react'
import ChatMessage from './ChatMessage'
import ChatInput from './ChatInput'
import { chatIAStream } from '../../api/ai'

const BIENVENIDA = {
  rol: 'asistente',
  texto: 'Hola, soy tu asistente de Google Ads. Puedes preguntarme sobre el rendimiento de tus campañas, keywords, o cualquier duda sobre tu cuenta.',
}

const INTENT_LABELS = {
  analyze:  'Analizando tu cuenta...',
  optimize: 'Calculando optimizaciones...',
  copy:     'Generando copies...',
  general:  'Procesando...',
}

function formatJsonEvento(data) {
  if (data.tipo === 'optimizacion') {
    const r = data.data
    let texto = (r.resumenEjecutivo || r.resumen || '') + '\n\n'
    r.recomendaciones?.forEach((rec, i) => {
      const prio = rec.prioridad === 'alta' ? '🔴' : rec.prioridad === 'media' ? '🟡' : '🟢'
      texto += `${i + 1}. ${prio} ${rec.titulo}\n${rec.descripcion}\n↳ ${rec.justificacion}\n\n`
    })
    if (r.alertasPresupuesto?.length) {
      texto += 'Alertas: ' + r.alertasPresupuesto.join(' · ')
    }
    return texto.trim()
  }
  if (data.tipo === 'copy') {
    const r = data.data
    let texto = `Copy ${r.tipo ?? ''} generado (puntuación global: ${r.puntuacionGlobal ?? '—'}/100)\n\n`
    texto += 'Headlines:\n'
    r.headlines?.forEach((h, i) => { texto += `  ${i + 1}. "${h.texto}" (${h.chars} chars)\n` })
    texto += '\nDescripciones:\n'
    r.descriptions?.forEach((d, i) => { texto += `  ${i + 1}. "${d.texto}" (${d.chars} chars)\n` })
    if (r.consejo) texto += `\nConsejo: ${r.consejo}`
    return texto.trim()
  }
  return JSON.stringify(data.data, null, 2)
}

export default function ChatPanel({ cuentaId }) {
  const [mensajes, setMensajes] = useState([BIENVENIDA])
  const [activo, setActivo] = useState(false)
  const [intentLabel, setIntentLabel] = useState(null)
  const bottomRef = useRef(null)

  const enviarMensaje = async (texto) => {
    const historialActual = mensajes.slice(-10)
    setMensajes(prev => [...prev, { rol: 'usuario', texto }])
    setActivo(true)
    setIntentLabel(null)

    // Añadir mensaje de asistente vacío que se irá rellenando
    setMensajes(prev => [...prev, { rol: 'asistente', texto: '', enStreaming: true }])

    try {
      await chatIAStream(texto, historialActual, cuentaId, {}, (event, data) => {
        if (event === 'intent') {
          setIntentLabel(INTENT_LABELS[data.intent] ?? 'Procesando...')

        } else if (event === 'delta') {
          setMensajes(prev => {
            const copia = [...prev]
            const ultimo = copia[copia.length - 1]
            copia[copia.length - 1] = { ...ultimo, texto: ultimo.texto + data.text }
            return copia
          })

        } else if (event === 'json') {
          const textoFormateado = formatJsonEvento(data)
          setMensajes(prev => {
            const copia = [...prev]
            copia[copia.length - 1] = { rol: 'asistente', texto: textoFormateado, enStreaming: true }
            return copia
          })

        } else if (event === 'done') {
          setMensajes(prev => {
            const copia = [...prev]
            copia[copia.length - 1] = { ...copia[copia.length - 1], enStreaming: false }
            return copia
          })

        } else if (event === 'error') {
          setMensajes(prev => {
            const copia = [...prev]
            copia[copia.length - 1] = { rol: 'asistente', texto: data.message, enStreaming: false }
            return copia
          })
        }
      })
    } catch (err) {
      setMensajes(prev => {
        const copia = [...prev]
        copia[copia.length - 1] = {
          rol: 'asistente',
          texto: `Error: ${err.message}. Inténtalo de nuevo.`,
          enStreaming: false,
        }
        return copia
      })
    } finally {
      setActivo(false)
      setIntentLabel(null)
    }
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensajes])

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-800">
        <p className="text-sm font-medium text-white">Asistente IA</p>
        {activo
          ? <p className="text-xs text-yellow-400">{intentLabel ?? '● Pensando...'}</p>
          : <p className="text-xs text-green-400">● En línea</p>
        }
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {mensajes.map((m, i) => <ChatMessage key={i} rol={m.rol} texto={m.texto} enStreaming={m.enStreaming} />)}

        {activo && !mensajes.at(-1)?.enStreaming && (
          <div className="flex gap-1 px-3 py-2">
            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <ChatInput onEnviar={enviarMensaje} deshabilitado={activo} />
    </div>
  )
}
