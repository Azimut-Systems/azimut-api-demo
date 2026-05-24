import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { VesselTable } from './VesselTable'
import type { Vessel } from '../types/api'

const mockVessel: Vessel = {
  aid: 'aid_v_001',
  aid_scope: 'global',
  name: 'MS HAMBURG EXPRESS',
  imo: '9301234',
  mmsi: '211281000',
  callsign: null,
  category: 'Merchant',
  subtype: 'Containers',
  flag: 'DE',
  dimensions: { length_m: 294, beam_m: 32 },
  previous_aids: [],
}

function wrap(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>)
}

describe('VesselTable', () => {
  it('renders vessel name', () => {
    wrap(
      <VesselTable
        vessels={[mockVessel]}
        isLoading={false}
        isFetchingNextPage={false}
        hasNextPage={false}
        onLoadMore={() => {}}
      />,
    )
    expect(screen.getByText('MS HAMBURG EXPRESS')).toBeInTheDocument()
  })

  it('renders IMO', () => {
    wrap(
      <VesselTable
        vessels={[mockVessel]}
        isLoading={false}
        isFetchingNextPage={false}
        hasNextPage={false}
        onLoadMore={() => {}}
      />,
    )
    expect(screen.getByText('9301234')).toBeInTheDocument()
  })

  it('shows skeleton rows when loading', () => {
    wrap(
      <VesselTable
        vessels={[]}
        isLoading={true}
        isFetchingNextPage={false}
        hasNextPage={false}
        onLoadMore={() => {}}
      />,
    )
    expect(screen.getAllByRole('row').length).toBeGreaterThan(1)
  })

  it('shows empty state when no vessels', () => {
    wrap(
      <VesselTable
        vessels={[]}
        isLoading={false}
        isFetchingNextPage={false}
        hasNextPage={false}
        onLoadMore={() => {}}
      />,
    )
    expect(screen.getByText(/no vessels match/i)).toBeInTheDocument()
  })
})
