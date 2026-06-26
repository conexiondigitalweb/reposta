import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAppStore } from './store/useAppStore'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Onboarding from './pages/Onboarding'
import Dashboard from './pages/Dashboard'
import Reprocesar from './pages/Reprocesar'
import Historial from './pages/Historial'
import Configuracion from './pages/Configuracion'
import Pricing from './pages/Pricing'

// Spinner de carga inicial
function Spinner() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

// Ruta privada: requiere sesión activa.
// Si no hay full_name en el perfil → redirige a /onboarding (excepto si ya está ahí).
function PrivateRoute({ children, skipOnboarding = false }) {
  const { user, profile, sessionLoaded } = useAppStore()

  if (!sessionLoaded) return <Spinner />
  if (!user) return <Navigate to="/login" replace />

  const needsOnboarding = !profile?.full_name
  if (needsOnboarding && !skipOnboarding) {
    return <Navigate to="/onboarding" replace />
  }

  return children
}

export default function App() {
  const initSession = useAppStore((s) => s.initSession)

  useEffect(() => {
    initSession()
  }, [initSession])

  return (
    <BrowserRouter>
      <Routes>
        {/* Públicas */}
        <Route path="/"        element={<Landing />} />
        <Route path="/login"   element={<Login />} />
        <Route path="/pricing" element={<Pricing />} />

        {/* Onboarding — privada pero no redirige de nuevo a onboarding */}
        <Route
          path="/onboarding"
          element={
            <PrivateRoute skipOnboarding>
              <Onboarding />
            </PrivateRoute>
          }
        />

        {/* Privadas — redirigen a /onboarding si falta full_name */}
        <Route path="/dashboard"    element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/reprocesar"   element={<PrivateRoute><Reprocesar /></PrivateRoute>} />
        <Route path="/historial"    element={<PrivateRoute><Historial /></PrivateRoute>} />
        <Route path="/configuracion" element={<PrivateRoute><Configuracion /></PrivateRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
