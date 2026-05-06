import { useState } from 'react'

export default function ChatInput({ onEnviar, deshabilitado }) {
  const [texto, setTexto] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!texto.trim() || deshabilitado) return
    onEnviar(texto.trim())
    setTexto('')
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 p-3 border-t border-slate-800">
      <input
        type="text"
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder="Pregunta sobre tus campañas..."
        disabled={deshabilitado}
        className="flex-1 bg-slate-800 text-white text-sm px-3 py-2 rounded-lg border border-slate-700 focus:outline-none focus:border-blue-500 placeholder:text-slate-500 disabled:opacity-50"
      />
      <button
        type="submit"
        disabled={deshabilitado || !texto.trim()}
        className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        →
      </button>
    </form>
  )
}
