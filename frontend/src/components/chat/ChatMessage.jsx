export default function ChatMessage({ rol, texto }) {
  const esUsuario = rol === 'usuario'
  return (
    <div className={`flex ${esUsuario ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[85%] px-3 py-2 rounded-xl text-sm leading-relaxed ${
        esUsuario
          ? 'bg-blue-600 text-white rounded-br-sm'
          : 'bg-slate-800 text-slate-200 rounded-bl-sm'
      }`}>
        {texto}
      </div>
    </div>
  )
}
