import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { VesselList } from './VesselList'

vi.mock('../hooks/useVessels', () => ({
  useVessels: () => ({
    data: undefined,
    isLoading: true,
    isFetchingNextPage: false,
    hasNextPage: false,
    fetchNextPage: vi.fn(),
  }),
}))

vi.mock('../hooks/useMe', () => ({
  useMe: () => ({ data: undefined }),
}))

function wrap(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('VesselList', () => {
  it('renders without crashing and shows search input', () => {
    wrap(<VesselList />)
    expect(
      screen.getByPlaceholderText(/search by name/i),
    ).toBeInTheDocument()
  })
})
