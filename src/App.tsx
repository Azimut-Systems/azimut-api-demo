import type { ReactNode } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { hasCredentials } from './api/auth'
import { LoginPage } from './pages/LoginPage'
import { TransitFeed } from './pages/TransitFeed'
import { TransitDetail } from './pages/TransitDetail'
import { VesselList } from './pages/VesselList'
import { VesselDetail } from './pages/VesselDetail'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<RequireAuth><TransitFeed /></RequireAuth>} />
      <Route path="/transits/:id" element={<RequireAuth><TransitDetail /></RequireAuth>} />
      <Route path="/vessels" element={<RequireAuth><VesselList /></RequireAuth>} />
      <Route path="/vessels/:aid" element={<RequireAuth><VesselDetail /></RequireAuth>} />
    </Routes>
  )
}

function RequireAuth({ children }: { children: ReactNode }) {
  const location = useLocation()

  if (!hasCredentials()) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return children
}
