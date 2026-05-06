import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { unirseWaitlist, getWaitlistCount } from '../api/waitlist'

const TIPOS = [
  { id: 'autonomo', label: 'Autónomo / Freelancer' },
  { id: 'empresa', label: 'Empresa / In-house' },
  { id: 'agencia', label: 'Agencia de marketing' },
  { id: 'otro', label: 'Otro' },
]

const BENEFICIOS = [
  { icono: '🎁', titulo: '3 meses gratis', descripcion: 'Acceso gratuito al plan Profesional para los primeros 100 registros.' },
  { icono: '🚀', titulo: 'Acceso anticipado', descripcion: 'Entra a la beta antes que nadie y ayuda a dar forma al producto.' },
  { icono: '💬', titulo: 'Canal directo', descripcion: 'Acceso a grupo privado de WhatsApp con el equipo fundador.' },
]

export default function Waitlist() {
  const [form, setForm] = useState({ email: '', nombre: '', tipo: 'empresa' })
  const [posicion, setPosicion] = useState(null)

  const { data: countData } = useQuery({
    queryKey: ['waitlist-count'],
    queryFn: getWaitlistCount,
    staleTime: 1000 * 60,
  })

  const mutation = useMutation({
    mutationFn: () => unirseWaitlist(form),
    onSuccess: (data) => setPosicion(data.posicion),
  })

  const yaRegistrado = posicion !== null

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* NavBar mínima */}
      <header className="border-b border-slate-800 px-4 h-14 flex items-center justify-between max-w-5xl mx-auto w-full">
        <Link to="/" className="text-base font-bold tracking-tight">
          ADSAI <span className="text-blue-400">PRO</span>
        </Link>
        <Link to="/onboarding" className="text-sm text-slate-400 hover:text-white transition-colors">
          Ya tengo acceso →
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-4xl">
          {yaRegistrado ? (
            /* ── Confirmación ── */
            <div className="text-center max-w-lg mx-auto">
              <div className="text-6xl mb-6">🎉</div>
              <h1 className="text-3xl font-bold text-white mb-3">¡Estás dentro!</h1>
              <p className="text-slate-400 mb-6">
                Eres el <span className="text-white font-semibold">#{posicion}</span> en la lista.
                Te avisaremos en cuanto tu acceso esté listo.
              </p>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-8 text-left space-y-3">
                <p className="text-sm font-medium text-white mb-4">Mientras tanto, puedes:</p>
                <a
                  href="https://www.producthunt.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-sm text-slate-300 hover:text-white transition-colors"
                >
                  <span className="text-orange-400 text-lg">🐱</span>
                  Votar ADSAI PRO en Product Hunt y ayudarnos a llegar al #1
                </a>
                <a
                  href="https://twitter.com/intent/tweet?text=Acabo%20de%20apuntarme%20a%20la%20beta%20de%20ADSAI%20PRO%20%E2%80%94%20la%20primera%20plataforma%20de%20Google%20Ads%20con%20IA%20en%20espa%C3%B1ol%20%F0%9F%87%AA%F0%9F%87%B8%20%40adsaipro"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-sm text-slate-300 hover:text-white transition-colors"
                >
                  <span className="text-sky-400 text-lg">𝕏</span>
                  Compártelo en Twitter y consigue prioridad en la lista
                </a>
              </div>
              <Link to="/" className="text-sm text-slate-500 hover:text-white transition-colors">
                ← Volver a la página principal
              </Link>
            </div>
          ) : (
            /* ── Formulario ── */
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Izquierda — copy */}
              <div>
                {/* Badge PH */}
                <div className="inline-flex items-center gap-2 text-xs text-orange-400 bg-orange-950/50 border border-orange-800/50 rounded-full px-4 py-1.5 mb-6">
                  <span className="text-base">🐱</span>
                  Lanzamiento en Product Hunt España · Mayo 2026
                </div>

                <h1 className="text-4xl font-bold text-white leading-tight mb-4">
                  Sé de los primeros en gestionar Google Ads{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600">
                    con IA en español
                  </span>
                </h1>

                <p className="text-slate-400 mb-8 leading-relaxed">
                  Nos preparamos para el lanzamiento oficial. Los primeros <strong className="text-white">100 registros</strong> obtienen
                  acceso gratuito durante 3 meses al plan Profesional.
                </p>

                {countData?.total > 0 && (
                  <div className="flex items-center gap-2 mb-8">
                    <div className="flex -space-x-2">
                      {['F','M','A','L'].map((l, i) => (
                        <div key={i} className="w-8 h-8 rounded-full bg-blue-600 border-2 border-slate-950 flex items-center justify-center text-xs font-bold text-white">
                          {l}
                        </div>
                      ))}
                    </div>
                    <p className="text-sm text-slate-400">
                      <span className="text-white font-semibold">{countData.total}</span> personas ya apuntadas
                    </p>
                  </div>
                )}

                <div className="space-y-4">
                  {BENEFICIOS.map((b, i) => (
                    <div key={i} className="flex gap-4 items-start">
                      <span className="text-2xl shrink-0">{b.icono}</span>
                      <div>
                        <p className="text-white font-medium text-sm">{b.titulo}</p>
                        <p className="text-slate-500 text-sm">{b.descripcion}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Derecha — formulario */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
                <h2 className="text-lg font-semibold text-white mb-6">Apúntate a la lista de espera</h2>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-slate-400 mb-1.5 block">Nombre (opcional)</label>
                    <input
                      type="text"
                      value={form.nombre}
                      onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))}
                      placeholder="Tu nombre"
                      className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 placeholder:text-slate-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 mb-1.5 block">Email *</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                      placeholder="tu@empresa.com"
                      className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 placeholder:text-slate-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 mb-1.5 block">¿Cómo usarías ADSAI PRO?</label>
                    <div className="grid grid-cols-2 gap-2">
                      {TIPOS.map(t => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setForm(p => ({ ...p, tipo: t.id }))}
                          className={`py-2.5 px-3 text-xs rounded-xl border transition-colors text-left ${
                            form.tipo === t.id
                              ? 'bg-blue-600 border-blue-500 text-white'
                              : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600 hover:text-white'
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {mutation.isError && (
                    <p className="text-xs text-red-400">{mutation.error?.message ?? 'Error al registrarse'}</p>
                  )}

                  <button
                    type="button"
                    onClick={() => mutation.mutate()}
                    disabled={!form.email.trim() || mutation.isPending}
                    className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-colors disabled:opacity-40 text-sm"
                  >
                    {mutation.isPending ? 'Guardando...' : 'Quiero acceso anticipado →'}
                  </button>

                  <p className="text-xs text-slate-600 text-center">
                    Sin spam. Solo te avisamos cuando tu acceso esté listo.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
