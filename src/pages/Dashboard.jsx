import { Link, useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'
import { supabase } from '../lib/supabase'
import { PLANS } from '../lib/plans'
import { PlusCircle, LogOut, History, Settings } from 'lucide-react'

function NavBar({ onLogout }) {
  return (
    <header className="sticky top-0 z-50 bg-gray-950/80 backdrop-blur border-b border-gray-800">
      <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/dashboard">
          <img src="/LogoReposta.png" alt="Reposta" className="h-8 w-auto" />
        </Link>
        <div className="flex items-center gap-2">
          <Link
            to="/historial"
            className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-800"
            title="Historial"
          >
            <History size={20} />
          </Link>
          <Link
            to="/configuracion"
            className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-800"
            title="Configuración"
          >
            <Settings size={20} />
          </Link>
          <button
            onClick={onLogout}
            className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-800"
            title="Cerrar sesión"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </header>
  )
}

function UsageCard({ used, limit, planName }) {
  const isUnlimited = limit === Infinity
  const pct = isUnlimited ? 0 : Math.min((used / limit) * 100, 100)
  const remaining = isUnlimited ? '∞' : Math.max(limit - used, 0)
  const almostFull = !isUnlimited && pct >= 80

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-gray-400">Generaciones este mes</span>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
          planName === 'Explorador'
            ? 'bg-gray-800 text-gray-400'
            : planName === 'Creador'
            ? 'bg-purple-600/20 text-purple-400'
            : 'bg-amber-500/20 text-amber-400'
        }`}>
          {planName}
        </span>
      </div>

      <div className="flex items-baseline gap-1 mb-3">
        <span className="text-3xl font-bold text-white">{used}</span>
        <span className="text-gray-600 text-lg">/ {isUnlimited ? '∞' : limit}</span>
      </div>

      {!isUnlimited && (
        <div className="h-2 bg-gray-800 rounded-full overflow-hidden mb-3">
          <div
            className={`h-full rounded-full transition-all ${almostFull ? 'bg-amber-500' : 'bg-purple-600'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}

      <p className="text-xs text-gray-500">
        {isUnlimited
          ? 'Generaciones ilimitadas en tu plan.'
          : remaining === 0
          ? 'Has alcanzado el límite del mes. Actualiza tu plan para continuar.'
          : `Te quedan ${remaining} generacion${remaining === 1 ? '' : 'es'} este mes.`}
      </p>

      {!isUnlimited && remaining === 0 && (
        <Link
          to="/pricing"
          className="inline-block mt-3 text-xs font-semibold text-purple-400 hover:text-purple-300 transition-colors"
        >
          Ver planes →
        </Link>
      )}
    </div>
  )
}

export default function Dashboard() {
  const { user, profile } = useAppStore()
  const navigate = useNavigate()

  const planKey = profile?.plan ?? 'free'
  const plan = PLANS[planKey]
  const planName = plan?.name ?? 'Explorador'
  const limit = plan?.monthlyGenerations ?? 3
  const used = profile?.monthly_uses_count ?? 0
  const remaining = limit === Infinity ? Infinity : Math.max(limit - used, 0)
  const canGenerate = remaining > 0

  const firstName = (
    profile?.full_name?.split(' ')[0] ||
    user?.user_metadata?.full_name?.split(' ')[0] ||
    user?.email?.split('@')[0] ||
    'creador'
  )

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/', { replace: true })
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <NavBar onLogout={handleLogout} />

      <main className="max-w-3xl mx-auto px-4 py-10">
        {/* Saludo */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">
            Hola, {firstName} 👋
          </h1>
          <p className="text-gray-400 text-sm">
            ¿Qué contenido transformamos hoy?
          </p>
        </div>

        {/* CTA principal */}
        <Link
          to="/reprocesar"
          className={`flex items-center justify-center gap-3 w-full py-5 rounded-2xl font-bold text-lg transition-all mb-6 ${
            canGenerate
              ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-900/30 active:scale-95'
              : 'bg-gray-800 text-gray-500 cursor-not-allowed pointer-events-none'
          }`}
        >
          <PlusCircle size={24} />
          Nueva generación
        </Link>

        {/* Contador de uso */}
        <UsageCard used={used} limit={limit} planName={planName} />

        {/* Accesos rápidos */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <Link
            to="/historial"
            className="bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-xl p-4 flex items-center gap-3 transition-colors group"
          >
            <History size={18} className="text-purple-400 shrink-0" />
            <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">
              Historial
            </span>
          </Link>
          <Link
            to="/configuracion"
            className="bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-xl p-4 flex items-center gap-3 transition-colors group"
          >
            <Settings size={18} className="text-purple-400 shrink-0" />
            <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">
              Configuración
            </span>
          </Link>
        </div>
      </main>
    </div>
  )
}
