import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TransitFeed } from './TransitFeed'

vi.mock('../hooks/useTransits', () => ({
  useTransits: () => ({
    data: undefined,
    isLoading: true,
    isFetchingNextPage: false,
    hasNextPage: false,
    fetchNextPage: vi.fn(),
  }),
}))

vi.mock('../hooks/useAreas', () => ({
  useAreas: () => ({ data: undefined }),
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

describe('TransitFeed', () => {
  it('renders without crashing', () => {
    wrap(<TransitFeed />)
    expect(screen.getByText(/transits/i)).toBeInTheDocument()
  })
})
