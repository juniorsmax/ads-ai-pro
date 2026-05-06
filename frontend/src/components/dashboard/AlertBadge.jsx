const SEVERIDAD = {
  info: { bg: 'bg-blue-900/40', texto: 'text-blue-300', borde: 'border-blue-700', icono: 'ℹ' },
  aviso: { bg: 'bg-yellow-900/40', texto: 'text-yellow-300', borde: 'border-yellow-700', icono: '⚠' },
  critico: { bg: 'bg-red-900/40', texto: 'text-red-300', borde: 'border-red-700', icono: '✕' },
}

export default function AlertBadge({ severidad = 'info', mensaje }) {
  const estilo = SEVERIDAD[severidad]
  return (
    <div className={`flex items-start gap-2 px-3 py-2 rounded-lg border text-sm ${estilo.bg} ${estilo.borde}`}>
      <span className={`${estilo.texto} font-bold mt-0.5`}>{estilo.icono}</span>
      <p className={estilo.texto}>{mensaje}</p>
    </div>
  )
}
