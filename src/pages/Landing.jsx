import { Link } from 'react-router-dom'
import {
  Zap,
  FileText,
  Share2,
  MessageSquare,
  Users,
  Play,
  Mail,
  BookOpen,
  LayoutGrid,
  Check,
  ArrowRight,
  Sparkles,
  Clock,
  Globe,
} from 'lucide-react'

// ─── Datos ───────────────────────────────────────────────────────────────────

const STEPS = [
  {
    icon: FileText,
    title: 'Pega tu contenido',
    desc: 'URL de YouTube, texto de un podcast, artículo o cualquier contenido largo que hayas creado.',
  },
  {
    icon: Sparkles,
    title: 'La IA lo transforma',
    desc: 'Nuestro motor entiende el español real y genera contenido nativo para cada plataforma en segundos.',
  },
  {
    icon: Share2,
    title: 'Publica en todo',
    desc: 'Copia cada formato listo para publicar. Sin editar, sin adaptar. De 1 pieza a 6 formatos al instante.',
  },
]

const FORMATS = [
  { icon: MessageSquare, label: 'Twitter / X',  desc: '5 tweets listos: hook, insight, hilo, dato y CTA' },
  { icon: Users,         label: 'LinkedIn',    desc: '3 posts: storytelling largo, insight corto y lista' },
  { icon: Play,       label: 'Reels / TikTok', desc: 'Guiones de 30, 45 y 60 segundos con estructura' },
  { icon: LayoutGrid, label: 'Carrusel',       desc: '7 slides con portada, puntos clave y CTA final' },
  { icon: Mail,       label: 'Newsletter',     desc: 'Email completo con asunto, cuerpo y CTA' },
  { icon: BookOpen,   label: 'Blog Post',      desc: 'Artículo 600-900 palabras optimizado para SEO' },
]

const PLANS = [
  {
    key: 'free',
    name: 'Explorador',
    price: '0',
    period: 'Gratis para siempre',
    highlight: false,
    features: [
      '3 generaciones al mes',
      '4 formatos (Twitter, LinkedIn, Reels, Carrusel)',
      'Historial 7 días',
    ],
    cta: 'Empezar gratis',
    href: '/login',
  },
  {
    key: 'creator',
    name: 'Creador',
    price: '12',
    period: 'USD / mes',
    highlight: true,
    badge: 'Más popular',
    features: [
      '30 generaciones al mes',
      '6 formatos (incluye Newsletter y Blog)',
      'Historial 60 días',
      'Tono de marca personalizado',
    ],
    cta: 'Empezar ahora',
    href: '/login?plan=creator',
  },
  {
    key: 'agency',
    name: 'Agencia',
    price: '29',
    period: 'USD / mes',
    highlight: false,
    features: [
      'Generaciones ilimitadas',
      '6 formatos completos',
      'Historial ilimitado',
      'Hasta 5 marcas / clientes',
      'Exportación en bloque',
      '2 variaciones por formato',
    ],
    cta: 'Contactar',
    href: '/login?plan=agency',
  },
]

const STATS = [
  { icon: Clock,  value: '< 60 seg', label: 'Por generación' },
  { icon: Globe,  value: '6',         label: 'Formatos de salida' },
  { icon: Zap,    value: '100%',      label: 'Español nativo' },
]

// ─── Componentes de sección ───────────────────────────────────────────────────

function NavBar() {
  return (
    <header className="sticky top-0 z-50 bg-gray-950/80 backdrop-blur border-b border-gray-800">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <img src="/LogoReposta.png" alt="Reposta" className="h-8 w-auto" />
        <Link
          to="/login"
          className="text-sm font-medium bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Entrar
        </Link>
      </div>
    </header>
  )
}

function Hero() {
  return (
    <section className="pt-20 pb-16 px-4 text-center">
      <div className="max-w-3xl mx-auto">
        <span className="inline-block text-xs font-semibold tracking-widest uppercase text-purple-400 bg-purple-400/10 px-3 py-1 rounded-full mb-6">
          Repurposing de contenido con IA
        </span>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white leading-tight mb-6">
          1 pieza de contenido.{' '}
          <span className="text-purple-400">6 formatos</span>{' '}
          listos para publicar.
        </h1>
        <p className="text-lg sm:text-xl text-gray-400 max-w-xl mx-auto mb-10 leading-relaxed">
          Transforma tu video, podcast o artículo en tweets, posts de LinkedIn, guiones de Reels, carruseles, newsletters y posts de blog — en menos de 60 segundos.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/login"
            className="inline-flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold px-6 py-3.5 rounded-xl transition-colors text-base"
          >
            Empieza gratis <ArrowRight size={18} />
          </Link>
          <a
            href="#como-funciona"
            className="inline-flex items-center justify-center gap-2 border border-gray-700 hover:border-gray-500 text-gray-300 hover:text-white font-medium px-6 py-3.5 rounded-xl transition-colors text-base"
          >
            Ver cómo funciona
          </a>
        </div>
      </div>
    </section>
  )
}

function Stats() {
  return (
    <section className="py-10 border-y border-gray-800">
      <div className="max-w-3xl mx-auto px-4 grid grid-cols-3 gap-4">
        {STATS.map(({ icon: Icon, value, label }) => (
          <div key={label} className="flex flex-col items-center gap-1 text-center">
            <Icon size={20} className="text-purple-400 mb-1" />
            <span className="text-2xl sm:text-3xl font-bold text-white">{value}</span>
            <span className="text-xs sm:text-sm text-gray-500">{label}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

function HowItWorks() {
  return (
    <section id="como-funciona" className="py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-3">
          Tres pasos. Menos de un minuto.
        </h2>
        <p className="text-gray-400 text-center mb-12 max-w-lg mx-auto">
          Sin configuraciones complicadas. Sin aprender otra herramienta.
        </p>
        <div className="grid sm:grid-cols-3 gap-6">
          {STEPS.map(({ icon: Icon, title, desc }, i) => (
            <div key={title} className="relative bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <span className="absolute -top-3 -left-3 w-7 h-7 bg-purple-600 rounded-full flex items-center justify-center text-xs font-bold text-white">
                {i + 1}
              </span>
              <Icon size={28} className="text-purple-400 mb-4" />
              <h3 className="font-semibold text-white text-base mb-2">{title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Formats() {
  return (
    <section className="py-20 px-4 bg-gray-900/50">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-3">
          Un input. Seis formatos.
        </h2>
        <p className="text-gray-400 text-center mb-12 max-w-lg mx-auto">
          Cada formato está optimizado para su plataforma con tono, longitud y estructura nativos.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {FORMATS.map(({ icon: Icon, label, desc }) => (
            <div
              key={label}
              className="bg-gray-900 border border-gray-800 hover:border-purple-700 rounded-xl p-4 transition-colors group"
            >
              <Icon size={22} className="text-purple-400 mb-3 group-hover:scale-110 transition-transform" />
              <p className="font-semibold text-white text-sm mb-1">{label}</p>
              <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Pricing() {
  return (
    <section id="precios" className="py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-3">
          Planes simples. Sin sorpresas.
        </h2>
        <p className="text-gray-400 text-center mb-12 max-w-lg mx-auto">
          Empieza gratis. Escala cuando lo necesites.
        </p>
        <div className="grid sm:grid-cols-3 gap-6 items-start">
          {PLANS.map((plan) => (
            <div
              key={plan.key}
              className={`relative rounded-2xl p-6 border flex flex-col ${
                plan.highlight
                  ? 'bg-purple-600/10 border-purple-500 ring-1 ring-purple-500'
                  : 'bg-gray-900 border-gray-800'
              }`}
            >
              {plan.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-semibold bg-purple-600 text-white px-3 py-1 rounded-full whitespace-nowrap">
                  {plan.badge}
                </span>
              )}
              <p className="text-sm font-medium text-gray-400 mb-1">{plan.name}</p>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-4xl font-extrabold text-white">${plan.price}</span>
                {plan.price !== '0' && (
                  <span className="text-gray-500 text-sm">/ mes</span>
                )}
              </div>
              <p className="text-xs text-gray-500 mb-6">{plan.period}</p>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-300">
                    <Check size={15} className="text-purple-400 mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                to={plan.href}
                className={`block text-center font-semibold py-3 rounded-xl transition-colors text-sm ${
                  plan.highlight
                    ? 'bg-purple-600 hover:bg-purple-700 text-white'
                    : 'border border-gray-700 hover:border-gray-500 text-gray-300 hover:text-white'
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function FinalCTA() {
  return (
    <section className="py-20 px-4 border-t border-gray-800 text-center">
      <div className="max-w-xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
          Empieza a publicar más en menos tiempo
        </h2>
        <p className="text-gray-400 mb-8">
          Únete a los creadores hispanohablantes que ya multiplican su contenido con Reposta.
        </p>
        <Link
          to="/login"
          className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold px-8 py-4 rounded-xl transition-colors text-base"
        >
          Crear cuenta gratis <ArrowRight size={18} />
        </Link>
        <p className="text-xs text-gray-600 mt-4">Sin tarjeta de crédito. 3 generaciones gratis al mes.</p>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="py-8 px-4 border-t border-gray-800 text-center">
      <div className="flex flex-col items-center gap-3">
        <img src="/Logo.png" alt="Reposta" className="h-7 w-auto opacity-50" />
        <p className="text-xs text-gray-600">© 2026 Reposta · Hecho para el mundo hispanohablante</p>
      </div>
    </footer>
  )
}

// ─── Landing ─────────────────────────────────────────────────────────────────

export default function Landing() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <NavBar />
      <Hero />
      <Stats />
      <HowItWorks />
      <Formats />
      <Pricing />
      <FinalCTA />
      <Footer />
    </div>
  )
}
