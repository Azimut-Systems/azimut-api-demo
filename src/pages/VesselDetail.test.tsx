import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { VesselDetail } from './VesselDetail'

vi.mock('../hooks/useVessel', () => ({
  useVessel: () => ({ data: undefined, isLoading: true, error: null }),
}))

vi.mock('../hooks/useVesselTransits', () => ({
  useVesselTransits: () => ({ data: undefined, isLoading: true }),
}))

function wrap() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={['/vessels/aid_v_001']}>
        <Routes>
          <Route path="/vessels/:aid" element={<VesselDetail />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('VesselDetail', () => {
  it('renders without crashing and shows back link', () => {
    wrap()
    expect(screen.getByText(/vessels/i)).toBeInTheDocument()
  })
})
