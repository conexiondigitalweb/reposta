import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Mail, Lock, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react'

const ERRORES = {
  'Invalid login credentials':       'Email o contraseña incorrectos.',
  'Email not confirmed':             'Confirma tu email antes de entrar. Revisa tu bandeja.',
  'User already registered':         'Ya existe una cuenta con ese email. Inicia sesión.',
  'Password should be at least 6 characters': 'La contraseña debe tener al menos 6 caracteres.',
  'Unable to validate email address: invalid format': 'El formato del email no es válido.',
  'signup is disabled':              'El registro está deshabilitado temporalmente.',
  'Email rate limit exceeded':       'Demasiados intentos. Espera unos minutos.',
}

function traducirError(msg = '') {
  for (const [clave, traduccion] of Object.entries(ERRORES)) {
    if (msg.includes(clave)) return traduccion
  }
  return 'Ocurrió un error. Intenta de nuevo.'
}

function InputField({ label, type, value, onChange, icon: Icon, rightElement, autoComplete, placeholder }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-gray-300">{label}</label>
      <div className="relative">
        <Icon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
        <input
          type={type}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          placeholder={placeholder}
          required
          className="w-full bg-gray-900 border border-gray-700 text-white placeholder-gray-600 rounded-xl pl-10 pr-10 py-3 text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
        />
        {rightElement && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightElement}</div>
        )}
      </div>
    </div>
  )
}

function AlertError({ mensaje }) {
  if (!mensaje) return null
  return (
    <div className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3">
      <AlertCircle size={16} className="mt-0.5 shrink-0" />
      <span>{mensaje}</span>
    </div>
  )
}

function GoogleButton({ onClick, loading }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="w-full flex items-center justify-center gap-3 border border-gray-700 hover:border-gray-500 bg-gray-900 hover:bg-gray-800 text-white font-medium py-3 rounded-xl transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {/* SVG de Google — sin dependencia externa */}
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M17.64 9.2045C17.64 8.5664 17.5827 7.9527 17.4764 7.3636H9V10.845H13.8436C13.635 11.97 13.0009 12.9232 12.0477 13.5614V15.8196H14.9564C16.6582 14.2527 17.64 11.9455 17.64 9.2045Z" fill="#4285F4"/>
        <path d="M9 18C11.43 18 13.4673 17.1941 14.9564 15.8196L12.0477 13.5614C11.2418 14.1014 10.2109 14.4204 9 14.4204C6.65591 14.4204 4.67182 12.8373 3.96409 10.71H0.957275V13.0418C2.43818 15.9832 5.48182 18 9 18Z" fill="#34A853"/>
        <path d="M3.96409 10.71C3.78409 10.17 3.68182 9.5932 3.68182 9C3.68182 8.4068 3.78409 7.83 3.96409 7.29V4.9582H0.957275C0.347727 6.1732 0 7.5477 0 9C0 10.4523 0.347727 11.8268 0.957275 13.0418L3.96409 10.71Z" fill="#FBBC05"/>
        <path d="M9 3.5795C10.3214 3.5795 11.5077 4.0336 12.4405 4.9255L15.0218 2.3441C13.4632 0.8918 11.4259 0 9 0C5.48182 0 2.43818 2.0168 0.957275 4.9582L3.96409 7.29C4.67182 5.1627 6.65591 3.5795 9 3.5795Z" fill="#EA4335"/>
      </svg>
      Continuar con Google
    </button>
  )
}

export default function Login() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const planParam = searchParams.get('plan')

  const [modo, setModo] = useState('login') // 'login' | 'registro'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingGoogle, setLoadingGoogle] = useState(false)
  const [error, setError] = useState('')
  const [mensajeConfirmacion, setMensajeConfirmacion] = useState('')

  // Si ya hay sesión activa, redirigir al dashboard
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate('/dashboard', { replace: true })
    })
  }, [navigate])

  function limpiarEstado() {
    setError('')
    setMensajeConfirmacion('')
  }

  async function handleEmailAuth(e) {
    e.preventDefault()
    setLoading(true)
    limpiarEstado()

    try {
      if (modo === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        navigate('/dashboard', { replace: true })
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
          },
        })
        if (error) throw error
        setMensajeConfirmacion('¡Cuenta creada! Revisa tu email para confirmar tu dirección y luego inicia sesión.')
      }
    } catch (err) {
      setError(traducirError(err.message))
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogle() {
    setLoadingGoogle(true)
    limpiarEstado()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
        queryParams: planParam ? { plan: planParam } : undefined,
      },
    })
    if (error) {
      setError(traducirError(error.message))
      setLoadingGoogle(false)
    }
    // Si no hay error: el navegador redirige solo a Google
  }

  function toggleModo() {
    setModo(modo === 'login' ? 'registro' : 'login')
    limpiarEstado()
    setEmail('')
    setPassword('')
  }

  const esRegistro = modo === 'registro'

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-4 py-12">
      {/* Logo */}
      <Link to="/" className="mb-8">
        <img src="/LogoReposta.png" alt="Reposta" className="h-9 w-auto" />
      </Link>

      <div className="w-full max-w-sm">
        {/* Card */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 sm:p-8">
          <h1 className="text-xl font-bold text-white mb-1">
            {esRegistro ? 'Crea tu cuenta' : 'Bienvenido de vuelta'}
          </h1>
          <p className="text-sm text-gray-500 mb-6">
            {esRegistro
              ? 'Empieza gratis — 3 generaciones al mes sin tarjeta.'
              : 'Inicia sesión para seguir generando contenido.'}
          </p>

          {/* Google OAuth */}
          <GoogleButton onClick={handleGoogle} loading={loadingGoogle} />

          {/* Separador */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-gray-800" />
            <span className="text-xs text-gray-600">o continúa con email</span>
            <div className="flex-1 h-px bg-gray-800" />
          </div>

          {/* Formulario */}
          <form onSubmit={handleEmailAuth} className="flex flex-col gap-4">
            <InputField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={Mail}
              autoComplete="email"
              placeholder="tu@email.com"
            />

            <InputField
              label="Contraseña"
              type={showPass ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={Lock}
              autoComplete={esRegistro ? 'new-password' : 'current-password'}
              placeholder={esRegistro ? 'Mínimo 6 caracteres' : '••••••••'}
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="text-gray-500 hover:text-gray-300 transition-colors"
                  tabIndex={-1}
                  aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
            />

            <AlertError mensaje={error} />

            {mensajeConfirmacion && (
              <div className="bg-green-500/10 border border-green-500/30 text-green-400 text-sm rounded-xl px-4 py-3">
                {mensajeConfirmacion}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !!mensajeConfirmacion}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors text-sm flex items-center justify-center gap-2 mt-1"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {esRegistro ? 'Crear cuenta' : 'Iniciar sesión'}
            </button>
          </form>
        </div>

        {/* Toggle login/registro */}
        <p className="text-center text-sm text-gray-500 mt-5">
          {esRegistro ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?'}{' '}
          <button
            onClick={toggleModo}
            className="text-purple-400 hover:text-purple-300 font-medium transition-colors"
          >
            {esRegistro ? 'Inicia sesión' : 'Regístrate gratis'}
          </button>
        </p>

        <p className="text-center text-xs text-gray-700 mt-4">
          Al continuar, aceptas los{' '}
          <span className="text-gray-600">Términos de servicio</span> y la{' '}
          <span className="text-gray-600">Política de privacidad</span> de Reposta.
        </p>
      </div>
    </div>
  )
}
