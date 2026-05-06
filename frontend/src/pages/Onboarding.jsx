import { useState } from 'react'

const PASOS = [
  { titulo: 'Conecta tu cuenta Google', descripcion: 'Autoriza el acceso a tu cuenta de Google Ads.' },
  { titulo: 'Selecciona tu cuenta', descripcion: 'Elige qué cuenta(s) quieres gestionar.' },
  { titulo: 'Configura tu perfil de marca', descripcion: 'Define tu tono, sector y objetivos para el asistente IA.' },
  { titulo: 'Listo para empezar', descripcion: 'Tu dashboard está configurado y listo.' },
]

export default function Onboarding() {
  const [paso, setPaso] = useState(0)

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white">
            Bienvenido a <span className="text-blue-400">ADSAI PRO</span>
          </h1>
          <p className="text-slate-400 mt-1">Configura tu cuenta en 4 pasos</p>
        </div>

        <div className="flex justify-between mb-8">
          {PASOS.map((_, i) => (
            <div key={i} className="flex items-center gap-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                i <= paso ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-500'
              }`}>
                {i + 1}
              </div>
              {i < PASOS.length - 1 && (
                <div className={`w-16 h-0.5 ${i < paso ? 'bg-blue-600' : 'bg-slate-800'}`} />
              )}
            </div>
          ))}
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 mb-6">
          <h2 className="text-lg font-semibold text-white mb-2">{PASOS[paso].titulo}</h2>
          <p className="text-slate-400 mb-6">{PASOS[paso].descripcion}</p>

          {paso === 0 && (
            <button className="w-full py-3 bg-white text-slate-900 font-medium rounded-lg hover:bg-slate-100 transition-colors flex items-center justify-center gap-2">
              <span>G</span> Continuar con Google
            </button>
          )}
        </div>

        <div className="flex justify-between">
          <button
            onClick={() => setPaso(Math.max(0, paso - 1))}
            disabled={paso === 0}
            className="px-4 py-2 text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
          >
            ← Atrás
          </button>
          <button
            onClick={() => setPaso(Math.min(PASOS.length - 1, paso + 1))}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            {paso === PASOS.length - 1 ? 'Finalizar' : 'Siguiente →'}
          </button>
        </div>
      </div>
    </div>
  )
}
