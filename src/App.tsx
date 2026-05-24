import { Routes, Route } from 'react-router-dom'
import { TransitFeed } from './pages/TransitFeed'
import { TransitDetail } from './pages/TransitDetail'
import { VesselList } from './pages/VesselList'
import { VesselDetail } from './pages/VesselDetail'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<TransitFeed />} />
      <Route path="/transits/:id" element={<TransitDetail />} />
      <Route path="/vessels" element={<VesselList />} />
      <Route path="/vessels/:aid" element={<VesselDetail />} />
    </Routes>
  )
}
