import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'
import { supabase } from '../lib/supabase'
import {
  ArrowLeft, Clock, MessageSquare, Users, Play, LayoutGrid, Mail, BookOpen,
  ChevronRight, AlertCircle, Loader2
} from 'lucide-react'

const FORMAT_ICONS = {
  tweets:     { icon: MessageSquare, label: 'Twitter / X' },
  linkedin:   { icon: Users,         label: 'LinkedIn' },
  reels:      { icon: Play,          label: 'Reels' },
  carousel:   { icon: LayoutGrid,    label: 'Carrusel' },
  newsletter: { icon: Mail,          label: 'Newsletter' },
  blog:       { icon: BookOpen,      label: 'Blog' },
}

function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
}

function daysLeft(expiresAt) {
  if (!expiresAt) return null
  const diff = new Date(expiresAt) - Date.now()
  if (diff <= 0) return 0
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

function FormatPill({ formatKey }) {
  const meta = FORMAT_ICONS[formatKey]
  if (!meta) return null
  const Icon = meta.icon
  return (
    <span className="inline-flex items-center gap-1 text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">
      <Icon size={10} />
      {meta.label}
    </span>
  )
}

function GenerationCard({ gen }) {
  const outputs = gen.outputs ?? {}
  const formats = Object.keys(outputs).filter(k => outputs[k] && (Array.isArray(outputs[k]) ? outputs[k].length > 0 : true))
  const days = daysLeft(gen.expires_at)
  const expiraSoon = days !== null && days <= 2

  return (
    <Link
      to={`/reprocesar`}
      state={{ generation: gen }}
      className="block bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-2xl p-4 sm:p-5 transition-colors group"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white text-sm truncate group-hover:text-purple-300 transition-colors">
            {gen.input_title || 'Sin título'}
          </h3>
          <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-500">
            <Clock size={11} />
            <span>{formatDate(gen.created_at)}</span>
          </div>
        </div>
        <ChevronRight size={16} className="text-gray-600 group-hover:text-gray-400 shrink-0 mt-0.5 transition-colors" />
      </div>

      <div className="flex flex-wrap gap-1.5 mb-3">
        {formats.map(f => <FormatPill key={f} formatKey={f} />)}
      </div>

      {days !== null && (
        <div className={`flex items-center gap-1.5 text-xs rounded-lg px-3 py-1.5 ${
          expiraSoon
            ? 'bg-amber-500/10 text-amber-400'
            : 'bg-gray-800 text-gray-500'
        }`}>
          <AlertCircle size={11} />
          {days === 0
            ? 'Expira hoy'
            : `Se elimina en ${days} día${days === 1 ? '' : 's'} · Actualiza para guardarlo`}
        </div>
      )}
    </Link>
  )
}

function EmptyState() {
  return (
    <div className="text-center py-16 px-4">
      <div className="w-14 h-14 bg-gray-900 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <Clock size={24} className="text-gray-600" />
      </div>
      <h3 className="font-semibold text-white mb-2">Aún no hay generaciones</h3>
      <p className="text-sm text-gray-500 mb-6 max-w-xs mx-auto">
        Transforma tu primer contenido y aparecerá aquí.
      </p>
      <Link
        to="/reprocesar"
        className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
      >
        Nueva generación
      </Link>
    </div>
  )
}

export default function Historial() {
  const { user, profile } = useAppStore()
  const [generations, setGenerations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    async function load() {
      setLoading(true)
      const { data } = await supabase
        .from('generations')
        .select('id, input_title, input_type, created_at, expires_at, outputs')
        .eq('user_id', user.id)
        .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(50)
      setGenerations(data ?? [])
      setLoading(false)
    }
    load()
  }, [user])

  return (
    <div className="min-h-screen bg-gray-950">
      {/* NavBar */}
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

      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-white mb-1">Historial</h1>
            <p className="text-sm text-gray-500">
              {profile?.plan === 'free'
                ? 'Tus generaciones se guardan 7 días. Actualiza para guardarlas para siempre.'
                : 'Todas tus generaciones guardadas.'}
            </p>
          </div>
          {!loading && generations.length > 0 && (
            <span className="text-xs text-gray-600 bg-gray-900 border border-gray-800 px-3 py-1.5 rounded-full">
              {generations.length} generacion{generations.length === 1 ? '' : 'es'}
            </span>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 size={24} className="animate-spin text-purple-400" />
          </div>
        ) : generations.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="flex flex-col gap-3">
            {generations.map(gen => (
              <GenerationCard key={gen.id} gen={gen} />
            ))}
          </div>
        )}

        {profile?.plan === 'free' && generations.length > 0 && (
          <div className="mt-6 bg-purple-600/10 border border-purple-600/30 rounded-xl px-4 py-3 flex items-center justify-between gap-4">
            <p className="text-sm text-purple-300">
              Guarda tu historial para siempre con el plan Creador.
            </p>
            <Link
              to="/pricing"
              className="shrink-0 text-sm font-semibold text-purple-400 hover:text-purple-300 transition-colors"
            >
              Ver planes →
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}
