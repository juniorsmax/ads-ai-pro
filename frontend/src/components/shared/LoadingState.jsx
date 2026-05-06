export default function LoadingState({ mensaje = 'Cargando datos...' }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-slate-400">{mensaje}</p>
    </div>
  )
}
