import { useEffect } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import TopBar from '../components/shared/TopBar'
import { getPlanes, iniciarCheckout, abrirPortalStripe } from '../api/billing'
import { analytics } from '../lib/analytics'

const FEATURES = {
  basico: ['1 cuenta Google Ads', 'Dashboard + análisis IA', '50 consultas al chat/mes', 'Alertas automáticas', 'Reportes semanales'],
  profesional: ['Hasta 5 cuentas Google Ads', 'Todos los agentes IA', 'Chat ilimitado', 'Reportes white-label', 'Inteligencia competitiva', 'Generador de copies'],
  agencia: ['Hasta 25 cuentas', 'White-label completo', 'Portal de cliente', 'Reportes automáticos por email', 'API access', 'Soporte prioritario'],
}

export default function Billing() {
  const [params] = useSearchParams()
  const success = params.get('success')
  const cancel = params.get('cancel')

  useEffect(() => { analytics.billingPageViewed() }, [])

  const { data: planes = [] } = useQuery({ queryKey: ['planes'], queryFn: getPlanes })

  const checkoutMutation = useMutation({
    mutationFn: (plan) => {
      analytics.checkoutStarted(plan)
      return iniciarCheckout(plan)
    },
    onSuccess: ({ url }) => { window.location.href = url },
  })

  const portalMutation = useMutation({
    mutationFn: abrirPortalStripe,
    onSuccess: ({ url }) => { window.location.href = url },
  })

  return (
    <div>
      <TopBar title="Facturación" subtitle="Planes y suscripciones" />
      <div className="p-6 max-w-5xl space-y-6">

        {success && (
          <div className="px-4 py-3 bg-green-900/40 border border-green-700 rounded-xl text-green-300">
            ✓ ¡Pago completado! Tu plan se ha actualizado correctamente.
          </div>
        )}
        {cancel && (
          <div className="px-4 py-3 bg-yellow-900/40 border border-yellow-700 rounded-xl text-yellow-300">
            El proceso de pago fue cancelado. Puedes intentarlo de nuevo cuando quieras.
          </div>
        )}

        {/* Planes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {planes.map(plan => {
            const esAgencia = plan.key === 'agencia'
            return (
              <div key={plan.key} className={`relative bg-slate-900 border rounded-xl p-6 flex flex-col ${
                esAgencia ? 'border-blue-600 ring-1 ring-blue-600' : 'border-slate-800'
              }`}>
                {esAgencia && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-blue-600 text-white text-xs font-medium rounded-full">
                    Más popular
                  </div>
                )}
                <div className="mb-4">
                  <h3 className="text-white font-semibold text-lg">{plan.nombre}</h3>
                  <div className="flex items-end gap-1 mt-2">
                    <span className="text-3xl font-bold text-white">{plan.precio}€</span>
                    <span className="text-slate-400 text-sm mb-1">/mes</span>
                  </div>
                </div>
                <ul className="space-y-2 flex-1 mb-6">
                  {(FEATURES[plan.key] ?? []).map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                      <span className="text-green-400 mt-0.5 shrink-0">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => { analytics.planSelected(plan.key, plan.precio * 100); checkoutMutation.mutate(plan.key) }}
                  disabled={checkoutMutation.isPending}
                  className={`w-full py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    esAgencia
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-slate-800 hover:bg-slate-700 text-white'
                  } disabled:opacity-50`}
                >
                  {checkoutMutation.isPending ? 'Redirigiendo...' : `Suscribirse — ${plan.precio}€/mes`}
                </button>
              </div>
            )
          })}
        </div>

        {/* Portal Stripe */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex items-center justify-between">
          <div>
            <p className="text-white font-medium">Gestionar suscripción</p>
            <p className="text-slate-400 text-sm">Cambia de plan, actualiza el método de pago o cancela desde el portal de Stripe.</p>
          </div>
          <button
            onClick={() => portalMutation.mutate()}
            disabled={portalMutation.isPending}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition-colors shrink-0"
          >
            {portalMutation.isPending ? 'Cargando...' : 'Portal de facturación →'}
          </button>
        </div>
      </div>
    </div>
  )
}
