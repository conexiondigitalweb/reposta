import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Reprocesar from './pages/Reprocesar'
import Historial from './pages/Historial'
import Configuracion from './pages/Configuracion'
import Pricing from './pages/Pricing'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/reprocesar" element={<Reprocesar />} />
        <Route path="/historial" element={<Historial />} />
        <Route path="/configuracion" element={<Configuracion />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
