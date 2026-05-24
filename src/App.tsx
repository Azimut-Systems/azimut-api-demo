import { Routes, Route } from 'react-router-dom'
import { TransitFeed } from './pages/TransitFeed'
import { TransitDetail } from './pages/TransitDetail'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<TransitFeed />} />
      <Route path="/transits/:id" element={<TransitDetail />} />
    </Routes>
  )
}
