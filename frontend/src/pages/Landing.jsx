import { Link } from 'react-router-dom'

// ── Datos ────────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icono: '🇪🇸',
    titulo: '100% en español',
    descripcion: 'Interfaz, alertas, reportes y soporte en español nativo. Sin traducciones automáticas ni jerga anglosajona.',
  },
  {
    icono: '💬',
    titulo: 'IA conversacional',
    descripcion: 'Pregunta "¿Por qué bajó mi CTR?" y la IA analiza tu cuenta en tiempo real y te responde con datos específicos.',
  },
  {
    icono: '📊',
    titulo: 'ROI real, no métricas de vanidad',
    descripcion: 'Foco en beneficio neto. Integramos tu margen para mostrarte cuánto dinero ganaste o perdiste de verdad.',
  },
  {
    icono: '🏢',
    titulo: 'Modo Agencia white-label',
    descripcion: 'Reportes con tu logo, URL personalizada y acceso de cliente con permisos limitados. Sin coste extra.',
  },
  {
    icono: '📱',
    titulo: 'Mobile-first',
    descripcion: 'Dashboard optimizado para móvil con alertas push. Gestiona aprobaciones urgentes desde cualquier lugar.',
  },
  {
    icono: '🕵️',
    titulo: 'Espía competitivo integrado',
    descripcion: 'Monitoreo de Auction Insights con alertas automáticas cuando un competidor cambia su estrategia.',
  },
]

const PASOS = [
  { numero: '01', titulo: 'Conecta tu cuenta de Google Ads', descripcion: 'OAuth seguro en 30 segundos. Sin compartir contraseñas ni accesos de administrador.' },
  { numero: '02', titulo: 'La IA analiza tu cuenta', descripcion: '8 agentes especializados analizan campañas, pujas, copies y competidores automáticamente.' },
  { numero: '03', titulo: 'Actúa con datos, no con intuición', descripcion: 'Recibe recomendaciones concretas en español con el impacto esperado de cada acción.' },
]

const PLANES = [
  {
    nombre: 'Básico',
    precio: '29',
    descripcion: 'Para autónomos y pequeños anunciantes',
    color: 'border-slate-700',
    destacado: false,
    features: [
      '1 cuenta de Google Ads',
      'Dashboard completo',
      'Agente analista IA',
      'Alertas de rendimiento',
      'Chat conversacional',
      'Soporte por email',
    ],
  },
  {
    nombre: 'Profesional',
    precio: '79',
    descripcion: 'Para empresas con campañas activas',
    color: 'border-blue-500',
    destacado: true,
    features: [
      '3 cuentas de Google Ads',
      'Todo lo del plan Básico',
      'Optimizador de pujas IA',
      'Copywriter IA (RSA + PMax)',
      'Espía competitivo',
      'Reportes automáticos PDF',
      'Alertas push móvil',
      'Soporte prioritario',
    ],
  },
  {
    nombre: 'Agencia',
    precio: '199',
    descripcion: 'Para agencias y consultores',
    color: 'border-slate-700',
    destacado: false,
    features: [
      'Cuentas ilimitadas',
      'Todo lo del plan Profesional',
      'White-label completo',
      'Dominio personalizado',
      'Portal de cliente',
      'Reportes white-label',
      'Multi-usuario',
      'SLA y soporte dedicado',
    ],
  },
]

const STATS = [
  { valor: '+73%', label: 'ROI en 4 semanas con IA vs gestión manual' },
  { valor: '400M', label: 'Hispanohablantes sin herramienta nativa' },
  { valor: '-18€', label: 'CPA medio ahorrado por cliente en 30 días' },
]

// ── Componentes ───────────────────────────────────────────────────────────────

function NavBar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur border-b border-slate-800/60">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <span className="text-lg font-bold text-white tracking-tight">
          ADSAI <span className="text-blue-400">PRO</span>
        </span>
        <nav className="hidden md:flex items-center gap-6 text-sm text-slate-400">
          <a href="#features" className="hover:text-white transition-colors">Funciones</a>
          <a href="#como-funciona" className="hover:text-white transition-colors">Cómo funciona</a>
          <a href="#precios" className="hover:text-white transition-colors">Precios</a>
        </nav>
        <div className="flex items-center gap-3">
          <Link to="/dashboard" className="text-sm text-slate-400 hover:text-white transition-colors hidden sm:block">
            Iniciar sesión
          </Link>
          <Link
            to="/waitlist"
            className="text-sm bg-orange-500 hover:bg-orange-400 text-white px-4 py-2 rounded-lg transition-colors font-medium hidden sm:block"
          >
            🐱 Acceso anticipado
          </Link>
          <Link
            to="/onboarding"
            className="text-sm bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg transition-colors font-medium"
          >
            Empezar gratis
          </Link>
        </div>
      </div>
    </header>
  )
}

function MockupDashboard() {
  return (
    <div className="relative w-full max-w-2xl mx-auto select-none pointer-events-none">
      {/* Glow */}
      <div className="absolute -inset-4 bg-blue-600/10 blur-3xl rounded-3xl" />
      {/* Ventana */}
      <div className="relative bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl">
        {/* Barra de título */}
        <div className="flex items-center gap-2 px-4 py-3 bg-slate-800 border-b border-slate-700">
          <div className="w-3 h-3 rounded-full bg-red-500/70" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
          <div className="w-3 h-3 rounded-full bg-green-500/70" />
          <span className="ml-2 text-xs text-slate-500">ADSAI PRO — Dashboard</span>
        </div>
        {/* Contenido del mockup */}
        <div className="flex">
          {/* Mini sidebar */}
          <div className="w-12 bg-slate-900 border-r border-slate-800 flex flex-col items-center py-4 gap-4">
            {['◈','◉','↕','✎','⊕'].map((icon, i) => (
              <div key={i} className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs ${i === 0 ? 'bg-blue-600 text-white' : 'text-slate-600'}`}>
                {icon}
              </div>
            ))}
          </div>
          {/* Main content */}
          <div className="flex-1 p-4 space-y-3">
            {/* KPIs */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: 'Gasto', val: '€970', up: true },
                { label: 'Conversiones', val: '51', up: true },
                { label: 'CPA', val: '€19', up: false },
                { label: 'ROAS', val: '3.4x', up: true },
              ].map((kpi, i) => (
                <div key={i} className="bg-slate-800 rounded-lg p-2">
                  <p className="text-xs text-slate-500">{kpi.label}</p>
                  <p className="text-sm font-bold text-white mt-0.5">{kpi.val}</p>
                  <p className={`text-xs ${kpi.up ? 'text-green-400' : 'text-red-400'}`}>{kpi.up ? '↑ 12%' : '↓ 5%'}</p>
                </div>
              ))}
            </div>
            {/* Chart mock */}
            <div className="bg-slate-800 rounded-lg p-3">
              <p className="text-xs text-slate-500 mb-2">Rendimiento — últimos 30 días</p>
              <div className="flex items-end gap-1 h-16">
                {[40,55,35,70,60,80,65,90,75,85,70,95,80,100,88,72,95,85,78,92,88,96,84,100,90,78,95,88,92,100].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-blue-500/30 rounded-sm"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
            </div>
            {/* Alerta mock */}
            <div className="bg-red-900/30 border border-red-800/60 rounded-lg px-3 py-2 flex items-center gap-2">
              <span className="text-red-400 text-xs">⚠</span>
              <p className="text-xs text-red-300">Campaña "PMax — General" necesita atención: CPA +200%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Secciones ─────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section className="pt-32 pb-24 px-4 text-center relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-blue-600/10 blur-3xl rounded-full pointer-events-none" />

      <div className="relative max-w-4xl mx-auto">
        <Link
          to="/waitlist"
          className="inline-flex items-center gap-2 text-xs text-orange-400 bg-orange-950/50 border border-orange-800/50 rounded-full px-4 py-1.5 mb-8 hover:border-orange-600 transition-colors"
        >
          <span className="text-base">🐱</span>
          Lanzamiento en Product Hunt España · Mayo 2026 — Apúntate para acceso anticipado →
        </Link>

        <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight mb-6">
          Gestiona Google Ads{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600">
            con IA en español
          </span>
        </h1>

        <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          8 agentes de IA analizan, optimizan y vigilan tus campañas mientras tú te centras en hacer crecer tu negocio.
          Todo en español, sin complicaciones.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Link
            to="/waitlist"
            className="w-full sm:w-auto px-8 py-3.5 bg-orange-500 hover:bg-orange-400 text-white font-semibold rounded-xl transition-colors text-base shadow-lg shadow-orange-900/40"
          >
            🐱 Quiero acceso anticipado →
          </Link>
          <Link
            to="/onboarding"
            className="w-full sm:w-auto px-8 py-3.5 border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white font-medium rounded-xl transition-colors text-base"
          >
            Empezar gratis 14 días
          </Link>
        </div>

        <MockupDashboard />

        <p className="text-xs text-slate-600 mt-6">Sin tarjeta de crédito · Cancela cuando quieras · Setup en 5 minutos</p>
      </div>
    </section>
  )
}

function Stats() {
  return (
    <section className="py-16 px-4 border-y border-slate-800">
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
        {STATS.map((s, i) => (
          <div key={i}>
            <p className="text-4xl font-bold text-white mb-2">{s.valor}</p>
            <p className="text-sm text-slate-400">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function Features() {
  return (
    <section id="features" className="py-24 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-xs text-blue-400 uppercase tracking-widest mb-3">Por qué ADSAI PRO</p>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Lo que ninguna otra herramienta ofrece
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto">
            Todas las plataformas de Google Ads están pensadas para el mercado anglosajón.
            Nosotros somos la primera para el hispanohablante.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f, i) => (
            <div
              key={i}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-6 transition-colors group"
            >
              <div className="text-3xl mb-4">{f.icono}</div>
              <h3 className="text-white font-semibold mb-2 group-hover:text-blue-400 transition-colors">{f.titulo}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{f.descripcion}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function ComoFunciona() {
  return (
    <section id="como-funciona" className="py-24 px-4 bg-slate-900/50">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-xs text-blue-400 uppercase tracking-widest mb-3">Proceso</p>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Empieza en 5 minutos</h2>
        </div>

        <div className="space-y-8">
          {PASOS.map((paso, i) => (
            <div key={i} className="flex gap-6 items-start">
              <div className="shrink-0 w-12 h-12 rounded-xl bg-blue-950 border border-blue-800 flex items-center justify-center">
                <span className="text-blue-400 font-bold text-sm">{paso.numero}</span>
              </div>
              <div className="pt-1">
                <h3 className="text-white font-semibold mb-1">{paso.titulo}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{paso.descripcion}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Precios() {
  return (
    <section id="precios" className="py-24 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-xs text-blue-400 uppercase tracking-widest mb-3">Precios</p>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Precios claros, sin sorpresas
          </h2>
          <p className="text-slate-400">14 días gratis en todos los planes. Sin tarjeta de crédito.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANES.map((plan, i) => (
            <div
              key={i}
              className={`bg-slate-900 border-2 ${plan.color} rounded-2xl p-6 flex flex-col relative ${plan.destacado ? 'shadow-xl shadow-blue-900/30' : ''}`}
            >
              {plan.destacado && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap">
                    Más popular
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-white font-bold text-lg mb-1">{plan.nombre}</h3>
                <p className="text-slate-500 text-sm mb-4">{plan.descripcion}</p>
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-bold text-white">{plan.precio}€</span>
                  <span className="text-slate-500 text-sm mb-1">/mes</span>
                </div>
              </div>

              <ul className="space-y-2.5 flex-1 mb-6">
                {plan.features.map((f, j) => (
                  <li key={j} className="flex items-start gap-2 text-sm text-slate-300">
                    <span className="text-green-400 mt-0.5 shrink-0">✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                to="/onboarding"
                className={`block w-full py-3 text-center text-sm font-semibold rounded-xl transition-colors ${
                  plan.destacado
                    ? 'bg-blue-600 hover:bg-blue-500 text-white'
                    : 'border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white'
                }`}
              >
                Empezar gratis →
              </Link>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-slate-600 mt-8">
          ¿Tienes más de 10 cuentas? <a href="mailto:hola@adsaipro.com" className="text-blue-400 hover:underline">Contacta con nosotros</a> para un plan enterprise.
        </p>
      </div>
    </section>
  )
}

function CTAFinal() {
  return (
    <section className="py-24 px-4">
      <div className="max-w-2xl mx-auto text-center">
        <div className="bg-gradient-to-br from-blue-950 to-slate-900 border border-blue-800/50 rounded-3xl p-10 md:p-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            ¿Listo para dejar de perder dinero en Google Ads?
          </h2>
          <p className="text-slate-400 mb-8">
            Únete a los primeros anunciantes hispanohablantes que gestionan sus campañas con IA nativa en español.
          </p>
          <Link
            to="/onboarding"
            className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-colors text-base shadow-lg shadow-blue-900/50"
          >
            Empezar gratis 14 días →
          </Link>
          <p className="text-xs text-slate-600 mt-4">Sin tarjeta · Cancela cuando quieras · Setup en 5 minutos</p>
        </div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="border-t border-slate-800 py-10 px-4">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <span className="text-base font-bold text-white tracking-tight">
          ADSAI <span className="text-blue-400">PRO</span>
        </span>
        <div className="flex flex-wrap gap-6 text-xs text-slate-500">
          <a href="#features" className="hover:text-white transition-colors">Funciones</a>
          <a href="#precios" className="hover:text-white transition-colors">Precios</a>
          <a href="mailto:hola@adsaipro.com" className="hover:text-white transition-colors">Contacto</a>
          <a href="#" className="hover:text-white transition-colors">Privacidad</a>
          <a href="#" className="hover:text-white transition-colors">Términos</a>
        </div>
        <p className="text-xs text-slate-600">© 2026 Zerbitecni · Todos los derechos reservados</p>
      </div>
    </footer>
  )
}

function ProductHunt() {
  return (
    <section className="py-20 px-4 bg-slate-900/40">
      <div className="max-w-3xl mx-auto text-center">
        <p className="text-3xl mb-4">🐱</p>
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
          Lanzamos en Product Hunt España
        </h2>
        <p className="text-slate-400 mb-8 max-w-xl mx-auto">
          Mayo 2026. Apúntate a la lista de espera y sé de los primeros en acceder.
          Los primeros <span className="text-white font-semibold">100 registros</span> obtienen
          3 meses gratis del plan Profesional.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/waitlist"
            className="w-full sm:w-auto px-8 py-3.5 bg-orange-500 hover:bg-orange-400 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-orange-900/30"
          >
            Apuntarme a la lista →
          </Link>
          <a
            href="https://www.producthunt.com"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-8 py-3.5 border border-slate-700 hover:border-orange-700 text-slate-300 hover:text-orange-400 font-medium rounded-xl transition-colors"
          >
            Ver en Product Hunt
          </a>
        </div>

        {/* PH badge placeholder — activar con el enlace real tras el launch */}
        <div className="mt-10 flex justify-center">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl px-6 py-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-800/50 flex items-center justify-center text-2xl">
              🐱
            </div>
            <div className="text-left">
              <p className="text-white font-semibold text-sm">ADSAI PRO</p>
              <p className="text-slate-500 text-xs">Google Ads con IA en español · #1 del día</p>
            </div>
            <div className="ml-4 flex flex-col items-center border border-slate-700 rounded-xl px-4 py-2">
              <span className="text-xs text-slate-500">▲</span>
              <span className="text-white font-bold text-lg leading-none">—</span>
              <span className="text-xs text-slate-500">votos</span>
            </div>
          </div>
        </div>
        <p className="text-xs text-slate-600 mt-3">El contador se activará el día del lanzamiento</p>
      </div>
    </section>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function Landing() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <NavBar />
      <Hero />
      <Stats />
      <Features />
      <ComoFunciona />
      <Precios />
      <ProductHunt />
      <CTAFinal />
      <Footer />
    </div>
  )
}
