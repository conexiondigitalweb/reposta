import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'
import { supabase } from '../lib/supabase'
import { Loader2, AlertCircle } from 'lucide-react'

// ─── Datos ────────────────────────────────────────────────────────────────────

const PAISES = [
  // Hispanohablantes primero
  { value: 'MX', label: '🇲🇽 México' },
  { value: 'CO', label: '🇨🇴 Colombia' },
  { value: 'AR', label: '🇦🇷 Argentina' },
  { value: 'ES', label: '🇪🇸 España' },
  { value: 'PE', label: '🇵🇪 Perú' },
  { value: 'VE', label: '🇻🇪 Venezuela' },
  { value: 'CL', label: '🇨🇱 Chile' },
  { value: 'EC', label: '🇪🇨 Ecuador' },
  { value: 'GT', label: '🇬🇹 Guatemala' },
  { value: 'CU', label: '🇨🇺 Cuba' },
  { value: 'BO', label: '🇧🇴 Bolivia' },
  { value: 'DO', label: '🇩🇴 República Dominicana' },
  { value: 'HN', label: '🇭🇳 Honduras' },
  { value: 'PY', label: '🇵🇾 Paraguay' },
  { value: 'SV', label: '🇸🇻 El Salvador' },
  { value: 'NI', label: '🇳🇮 Nicaragua' },
  { value: 'CR', label: '🇨🇷 Costa Rica' },
  { value: 'PA', label: '🇵🇦 Panamá' },
  { value: 'UY', label: '🇺🇾 Uruguay' },
  { value: 'GQ', label: '🇬🇶 Guinea Ecuatorial' },
  { value: 'US', label: '🇺🇸 Estados Unidos (hispanohablante)' },
  { value: '---', label: '──────────', disabled: true },
  { value: 'BR', label: '🇧🇷 Brasil' },
  { value: 'PT', label: '🇵🇹 Portugal' },
  { value: 'FR', label: '🇫🇷 Francia' },
  { value: 'DE', label: '🇩🇪 Alemania' },
  { value: 'IT', label: '🇮🇹 Italia' },
  { value: 'GB', label: '🇬🇧 Reino Unido' },
  { value: 'CA', label: '🇨🇦 Canadá' },
  { value: 'AU', label: '🇦🇺 Australia' },
  { value: 'OTHER', label: '🌍 Otro país' },
]

const TIPOS_CREADOR = [
  { value: 'emprendedor', label: '🚀 Emprendedor' },
  { value: 'coach',       label: '🎯 Coach / Consultor' },
  { value: 'podcaster',   label: '🎙️ Podcaster' },
  { value: 'marca',       label: '🏢 Marca / Empresa' },
  { value: 'creador',     label: '📱 Creador de contenido' },
  { value: 'otro',        label: '✨ Otro' },
]

const REDES = [
  { value: 'instagram', label: '📸 Instagram' },
  { value: 'tiktok',    label: '🎵 TikTok' },
  { value: 'youtube',   label: '▶️ YouTube' },
  { value: 'linkedin',  label: '💼 LinkedIn' },
  { value: 'twitter',   label: '🐦 Twitter / X' },
  { value: 'otra',      label: '🌐 Otra' },
]

// ─── Componentes de campo ─────────────────────────────────────────────────────

function Label({ children, required }) {
  return (
    <label className="block text-sm font-medium text-gray-300 mb-1.5">
      {children}{required && <span className="text-purple-400 ml-0.5">*</span>}
    </label>
  )
}

const fieldClass = "w-full bg-gray-900 border border-gray-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors placeholder-gray-600"

function SelectGrid({ options, value, onChange }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-colors text-left ${
            value === opt.value
              ? 'border-purple-500 bg-purple-600/15 text-white'
              : 'border-gray-700 bg-gray-900 text-gray-400 hover:border-gray-600 hover:text-white'
          }`}
        >
          <span className="text-base leading-none">{opt.label.split(' ')[0]}</span>
          <span className="truncate">{opt.label.split(' ').slice(1).join(' ')}</span>
        </button>
      ))}
    </div>
  )
}

// ─── Onboarding ───────────────────────────────────────────────────────────────

export default function Onboarding() {
  const { user, setProfile } = useAppStore()
  const navigate = useNavigate()

  const [nombre, setNombre] = useState(
    user?.user_metadata?.full_name || user?.user_metadata?.name || ''
  )
  const [pais, setPais]           = useState('')
  const [tipoCreador, setTipo]    = useState('')
  const [redPrincipal, setRed]    = useState('')
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')

  const canSubmit = nombre.trim() && pais && tipoCreador && redPrincipal

  async function handleSubmit(e) {
    e.preventDefault()
    if (!canSubmit) return
    setLoading(true)
    setError('')

    const updates = {
      full_name:      nombre.trim(),
      pais,
      tipo_creador:   tipoCreador,
      red_principal:  redPrincipal,
    }

    const { data: updatedProfile, error: err } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single()

    if (err) {
      // Si falla por columnas inexistentes, guardar al menos el nombre
      const { data: fallback, error: err2 } = await supabase
        .from('profiles')
        .update({ full_name: nombre.trim() })
        .eq('id', user.id)
        .select()
        .single()

      if (err2) {
        setError('No pudimos guardar tu información. Intenta de nuevo.')
        setLoading(false)
        return
      }
      setProfile(fallback)
    } else {
      setProfile(updatedProfile)
    }

    navigate('/dashboard', { replace: true })
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-start px-4 py-10 sm:py-16">
      {/* Logo */}
      <img src="/LogoReposta.png" alt="Reposta" className="h-9 w-auto mb-8" />

      <div className="w-full max-w-md">
        {/* Encabezado */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">
            Cuéntanos sobre ti
          </h1>
          <p className="text-gray-400 text-sm leading-relaxed">
            Esto nos ayuda a personalizar el contenido para tu audiencia. Solo toma un momento.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">

          {/* Nombre completo */}
          <div>
            <Label required>¿Cómo te llamas?</Label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Tu nombre completo"
              autoFocus
              autoComplete="name"
              required
              className={fieldClass}
            />
          </div>

          {/* País */}
          <div>
            <Label required>¿De qué país eres?</Label>
            <select
              value={pais}
              onChange={(e) => setPais(e.target.value)}
              required
              className={`${fieldClass} appearance-none`}
            >
              <option value="" disabled>Selecciona tu país</option>
              {PAISES.map((p) => (
                <option
                  key={p.value}
                  value={p.value}
                  disabled={p.disabled}
                  className="bg-gray-900 text-white"
                >
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          {/* Tipo de creador */}
          <div>
            <Label required>¿Qué tipo de creador eres?</Label>
            <SelectGrid
              options={TIPOS_CREADOR}
              value={tipoCreador}
              onChange={setTipo}
            />
          </div>

          {/* Red social principal */}
          <div>
            <Label required>¿Cuál es tu red social principal?</Label>
            <SelectGrid
              options={REDES}
              value={redPrincipal}
              onChange={setRed}
            />
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3">
              <AlertCircle size={15} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={!canSubmit || loading}
            className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl transition-colors text-base mt-1"
          >
            {loading && <Loader2 size={18} className="animate-spin" />}
            {loading ? 'Guardando...' : 'Empezar a crear contenido →'}
          </button>

          <p className="text-center text-xs text-gray-600">
            Puedes cambiar estos datos más adelante en Configuración.
          </p>
        </form>
      </div>
    </div>
  )
}
