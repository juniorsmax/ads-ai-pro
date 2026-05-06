import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useCuentaStore } from '../../store/cuentaStore'
import { getCuentas } from '../../api/accounts'

export default function AccountSwitcher() {
  const [abierto, setAbierto] = useState(false)
  const { cuentas, cuentaActivaId, setCuentas, setCuentaActiva } = useCuentaStore()

  const { data } = useQuery({ queryKey: ['cuentas'], queryFn: getCuentas })

  useEffect(() => {
    if (data?.length) setCuentas(data)
  }, [data, setCuentas])

  const activa = cuentas.find(c => c.id === cuentaActivaId)

  if (!cuentas.length) return null

  return (
    <div className="relative">
      <button
        onClick={() => setAbierto(v => !v)}
        className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm text-white transition-colors"
      >
        <span className="w-2 h-2 rounded-full bg-green-400" />
        <span className="max-w-[140px] truncate">{activa?.nombre ?? 'Seleccionar cuenta'}</span>
        <span className="text-slate-400">▾</span>
      </button>

      {abierto && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setAbierto(false)} />
          <div className="absolute left-0 top-full mt-1 z-20 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-xl overflow-hidden">
            <div className="px-3 py-2 border-b border-slate-800">
              <p className="text-xs text-slate-500">Cuentas vinculadas</p>
            </div>
            {cuentas.map(c => (
              <button
                key={c.id}
                onClick={() => { setCuentaActiva(c.id); setAbierto(false) }}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left text-sm transition-colors hover:bg-slate-800 ${
                  c.id === cuentaActivaId ? 'bg-blue-900/30 text-blue-300' : 'text-slate-300'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${c.id === cuentaActivaId ? 'bg-blue-400' : 'bg-slate-600'}`} />
                <div>
                  <p className="font-medium">{c.nombre}</p>
                  <p className="text-xs text-slate-500">ID: {c.customer_id}</p>
                </div>
                {c.id === cuentaActivaId && <span className="ml-auto text-blue-400">✓</span>}
              </button>
            ))}
            <div className="border-t border-slate-800 px-4 py-2">
              <a href="/onboarding" className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
                + Añadir cuenta
              </a>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
