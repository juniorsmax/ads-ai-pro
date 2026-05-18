import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { iniciarLoginGoogle, completarCallback, estaAutenticado, getUsuarioLocal } from '../api/auth'
import { getCuentasAccesibles, vincularCuenta } from '../api/accounts'
import { identifyUser, analytics } from '../lib/analytics'
import { clarityIdentify, clarityTag } from '../lib/clarity'

const PASOS = [
  { titulo: 'Conecta tu cuenta Google', descripcion: 'Autoriza el acceso seguro a tu cuenta de Google Ads.' },
  { titulo: 'Selecciona tu cuenta', descripcion: 'Elige qué cuenta de Google Ads quieres gestionar.' },
  { titulo: 'Configuración lista', descripcion: 'Tu dashboard está listo para usar.' },
]

export default function Onboarding() {
  const [paso, setPaso] = useState(0)
  const [cuentas, setCuentas] = useState([])
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  // Manejar callback OAuth
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    if (code) {
      setCargando(true)
      completarCallback(code)
        .then((data) => {
          window.history.replaceState({}, '', '/onboarding')
          // Identificar usuario en PostHog y Clarity con los datos reales del servidor
          if (data?.usuario) {
            const u = data.usuario
            identifyUser(u.id, { email: u.email, plan: u.plan, createdAt: u.created_at })
            clarityIdentify(u.id, null, null, u.email)
            clarityTag('plan', u.plan ?? 'sin_plan')
            analytics.userSignedIn(u.plan)
          }
          setPaso(1)
          return getCuentasAccesibles()
        })
        .then(setCuentas)
        .catch(err => setError(err.message))
        .finally(() => setCargando(false))
    } else if (estaAutenticado()) {
      // Sesión ya activa — re-identificar en caso de recarga de página
      const u = getUsuarioLocal()
      if (u) {
        identifyUser(u.id, { email: u.email, plan: u.plan, createdAt: u.created_at })
        clarityIdentify(u.id, null, null, u.email)
        clarityTag('plan', u.plan ?? 'sin_plan')
      }
      setPaso(1)
      getCuentasAccesibles().then(setCuentas).catch(() => {})
    }
  }, [])

  const handleVincular = async (cuenta) => {
    setCargando(true)
    try {
      await vincularCuenta(cuenta.id, cuenta.descriptiveName)
      analytics.googleAdsLinked(cuenta.id)
      setPaso(2)
    } catch (err) {
      setError(err.message)
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white">
            Bienvenido a <span className="text-blue-400">ADSAI PRO</span>
          </h1>
          <p className="text-slate-400 mt-1">Configura tu cuenta en minutos</p>
        </div>

        {/* Indicador de pasos */}
        <div className="flex justify-center items-center gap-2 mb-8">
          {PASOS.map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                i < paso ? 'bg-green-600 text-white' :
                i === paso ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-500'
              }`}>
                {i < paso ? '✓' : i + 1}
              </div>
              {i < PASOS.length - 1 && (
                <div className={`w-12 h-0.5 ${i < paso ? 'bg-green-600' : 'bg-slate-800'}`} />
              )}
            </div>
          ))}
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 mb-6">
          <h2 className="text-lg font-semibold text-white mb-2">{PASOS[paso].titulo}</h2>
          <p className="text-slate-400 mb-6">{PASOS[paso].descripcion}</p>

          {error && (
            <div className="mb-4 px-3 py-2 bg-red-900/40 border border-red-700 rounded-lg text-red-300 text-sm">
              {error}
            </div>
          )}

          {paso === 0 && (
            <button
              onClick={() => { analytics.onboardingStarted(); iniciarLoginGoogle() }}
              disabled={cargando}
              className="w-full py-3 bg-white text-slate-900 font-medium rounded-lg hover:bg-slate-100 transition-colors flex items-center justify-center gap-3 disabled:opacity-50"
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {cargando ? 'Conectando...' : 'Continuar con Google'}
            </button>
          )}

          {paso === 1 && (
            <div className="space-y-2">
              {cuentas.length === 0 && !cargando && (
                <p className="text-slate-400 text-sm">No se encontraron cuentas de Google Ads.</p>
              )}
              {cargando && <p className="text-slate-400 text-sm">Cargando cuentas...</p>}
              {cuentas.map(c => (
                <button
                  key={c.id}
                  onClick={() => handleVincular(c)}
                  disabled={cargando}
                  className="w-full flex items-center justify-between px-4 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors text-left"
                >
                  <div>
                    <p className="text-white font-medium text-sm">{c.descriptiveName ?? c.id}</p>
                    <p className="text-slate-400 text-xs">ID: {c.id}</p>
                  </div>
                  <span className="text-slate-400 text-sm">→</span>
                </button>
              ))}
            </div>
          )}

          {paso === 2 && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-600/20 rounded-full flex items-center justify-center mx-auto">
                <span className="text-green-400 text-2xl">✓</span>
              </div>
              <p className="text-slate-300">Tu cuenta está conectada y lista.</p>
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                Ir al Dashboard →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
