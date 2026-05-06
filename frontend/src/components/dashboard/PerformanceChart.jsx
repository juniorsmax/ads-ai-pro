import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const DATOS_DEMO = [
  { fecha: '30 Abr', gasto: 120, conversiones: 8 },
  { fecha: '1 May', gasto: 145, conversiones: 11 },
  { fecha: '2 May', gasto: 132, conversiones: 9 },
  { fecha: '3 May', gasto: 168, conversiones: 14 },
  { fecha: '4 May', gasto: 155, conversiones: 12 },
  { fecha: '5 May', gasto: 190, conversiones: 17 },
  { fecha: '6 May', gasto: 178, conversiones: 15 },
]

export default function PerformanceChart({ datos, cargando = false }) {
  const puntos = datos?.length ? datos : DATOS_DEMO
  const esDemo = !datos?.length

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-medium text-white">Rendimiento — Últimos 30 días</p>
        {esDemo && !cargando && (
          <span className="text-xs text-slate-600 italic">datos de ejemplo</span>
        )}
        {cargando && (
          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        )}
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={puntos}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="fecha" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
            labelStyle={{ color: '#94a3b8' }}
            itemStyle={{ color: '#e2e8f0' }}
          />
          <Line type="monotone" dataKey="gasto" stroke="#3b82f6" strokeWidth={2} dot={false} name="Gasto (€)" />
          <Line type="monotone" dataKey="conversiones" stroke="#22c55e" strokeWidth={2} dot={false} name="Conversiones" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
