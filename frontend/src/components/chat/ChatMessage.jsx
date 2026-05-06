export default function ChatMessage({ rol, texto, enStreaming }) {
  const esUsuario = rol === 'usuario'
  return (
    <div className={`flex ${esUsuario ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[85%] px-3 py-2 rounded-xl text-sm leading-relaxed whitespace-pre-wrap ${
        esUsuario
          ? 'bg-blue-600 text-white rounded-br-sm'
          : 'bg-slate-800 text-slate-200 rounded-bl-sm'
      }`}>
        {texto}
        {enStreaming && (
          <span className="inline-block w-0.5 h-3.5 bg-blue-400 ml-0.5 align-middle animate-pulse" />
        )}
      </div>
    </div>
  )
}
