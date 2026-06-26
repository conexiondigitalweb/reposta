import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'
import { supabase } from '../lib/supabase'
import { PLANS } from '../lib/plans'
import {
  ArrowLeft, User, CreditCard, LogOut, ChevronRight,
  Check, Shield, AlertCircle
} from 'lucide-react'

function NavBar() {
  return (
    <header className="sticky top-0 z-50 bg-gray-950/80 backdrop-blur border-b border-gray-800">
      <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
        <Link
          to="/dashboard"
          className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-800"
        >
          <ArrowLeft size={20} />
        </Link>
        <img src="/LogoReposta.png" alt="Reposta" className="h-8 w-auto" />
      </div>
    </header>
  )
}

function Section({ title, children }) {
  return (
    <section className="mb-6">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 px-1 mb-2">{title}</h2>
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden divide-y divide-gray-800">
        {children}
      </div>
    </section>
  )
}

function Row({ icon: Icon, label, value, onClick, href, danger, rightIcon = true }) {
  const inner = (
    <div className={`flex items-center gap-3 px-5 py-4 transition-colors ${
      onClick || href
        ? danger
          ? 'hover:bg-red-500/5 cursor-pointer'
          : 'hover:bg-gray-800 cursor-pointer'
        : ''
    }`}>
      <Icon size={18} className={danger ? 'text-red-400 shrink-0' : 'text-gray-400 shrink-0'} />
      <span className={`flex-1 text-sm font-medium ${danger ? 'text-red-400' : 'text-white'}`}>{label}</span>
      {value && <span className="text-sm text-gray-500">{value}</span>}
      {rightIcon && (onClick || href) && (
        <ChevronRight size={16} className="text-gray-600" />
      )}
    </div>
  )

  if (href) return <Link to={href}>{inner}</Link>
  if (onClick) return <button onClick={onClick} className="w-full text-left">{inner}</button>
  return <div>{inner}</div>
}

function PlanCard({ planKey, used, limit }) {
  const plan = PLANS[planKey] ?? PLANS.free
  const isUnlimited = limit === Infinity
  const pct = isUnlimited ? 0 : Math.min((used / limit) * 100, 100)
  const remaining = isUnlimited ? '∞' : Math.max(limit - used, 0)

  const BADGE_COLORS = {
    free:    'bg-gray-800 text-gray-400',
    creator: 'bg-purple-600/20 text-purple-400',
    agency:  'bg-amber-500/20 text-amber-400',
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 mb-6">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <p className="text-xs text-gray-500 mb-0.5">Plan actual</p>
          <p className="text-xl font-bold text-white">{plan.name}</p>
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${BADGE_COLORS[planKey] ?? BADGE_COLORS.free}`}>
          {planKey === 'free' ? 'Gratis' : `$${plan.price}/mes`}
        </span>
      </div>

      <div className="mb-3">
        <div className="flex justify-between text-xs text-gray-500 mb-1.5">
          <span>Generaciones este mes</span>
          <span>{used} / {isUnlimited ? '∞' : limit}</span>
        </div>
        {!isUnlimited && (
          <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${pct >= 80 ? 'bg-amber-500' : 'bg-purple-600'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        )}
        <p className="text-xs text-gray-600 mt-1.5">
          {isUnlimited
            ? 'Sin límite mensual.'
            : remaining === 0
            ? 'Límite alcanzado este mes.'
            : `Quedan ${remaining} generacion${remaining === 1 ? '' : 'es'} este mes.`}
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-4">
        {plan.outputFormats?.map(f => (
          <span key={f} className="inline-flex items-center gap-1 text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">
            <Check size={10} className="text-purple-400" /> {f}
          </span>
        ))}
      </div>

      {planKey === 'free' && (
        <Link
          to="/pricing"
          className="block w-full text-center bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
        >
          Actualizar plan
        </Link>
      )}
    </div>
  )
}

export default function Configuracion() {
  const { user, profile } = useAppStore()
  const navigate = useNavigate()
  const [loggingOut, setLoggingOut] = useState(false)

  const planKey = profile?.plan ?? 'free'
  const limit = PLANS[planKey]?.monthlyGenerations ?? 3
  const used = profile?.monthly_uses_count ?? 0

  const displayName =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    '—'

  const displayEmail = profile?.email || user?.email || '—'

  async function handleLogout() {
    setLoggingOut(true)
    await supabase.auth.signOut()
    navigate('/', { replace: true })
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <NavBar />

      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-white mb-1">Configuración</h1>
          <p className="text-sm text-gray-500">Tu cuenta y plan de Reposta.</p>
        </div>

        {/* Plan */}
        <PlanCard planKey={planKey} used={used} limit={limit} />

        {/* Cuenta */}
        <Section title="Cuenta">
          <Row icon={User}   label="Nombre"  value={displayName}  />
          <Row icon={Shield} label="Email"   value={displayEmail} />
        </Section>

        {/* Suscripción */}
        <Section title="Suscripción">
          {planKey !== 'free' ? (
            <Row
              icon={CreditCard}
              label="Gestionar suscripción"
              href="/pricing"
            />
          ) : (
            <Row
              icon={CreditCard}
              label="Actualizar plan"
              href="/pricing"
            />
          )}
        </Section>

        {/* Sesión */}
        <Section title="Sesión">
          <Row
            icon={LogOut}
            label={loggingOut ? 'Cerrando sesión...' : 'Cerrar sesión'}
            onClick={loggingOut ? undefined : handleLogout}
            danger
            rightIcon={false}
          />
        </Section>

        {planKey === 'free' && (
          <div className="mt-2 bg-purple-600/10 border border-purple-600/30 rounded-xl px-4 py-3 flex items-start gap-3">
            <AlertCircle size={15} className="text-purple-400 mt-0.5 shrink-0" />
            <p className="text-sm text-purple-300">
              Con el plan <span className="font-semibold">Creador</span> obtienes 30 generaciones, historial de 60 días y tono de marca personalizado.{' '}
              <Link to="/pricing" className="underline hover:text-purple-200">Ver planes →</Link>
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
