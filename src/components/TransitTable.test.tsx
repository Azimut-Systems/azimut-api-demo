import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { TransitTable } from './TransitTable'
import type { Transit } from '../types/api'

const mockTransit: Transit = {
  schema_version: '1.0',
  id: 'tr_17',
  status: 'closed',
  transit_kind: 'crossing',
  course: 'westbound',
  entered_at: '2026-05-18T08:14:22Z',
  exited_at: '2026-05-18T08:31:07Z',
  area: { id: 'ar_42', name: 'Strait of Gibraltar', type: 'chokepoint', centroid: null },
  vessel: {
    aid: 'aid_v_001',
    aid_scope: 'global',
    name: 'MS HAMBURG EXPRESS',
    imo: '9301234',
    mmsi: null,
    callsign: null,
    category: 'merchant',
    subtype: 'containers',
    flag: 'DE',
    dimensions: null,
    previous_aids: [],
  },
  identification: { confidence: 0.97, ais_matched: true },
  visual_signals: null,
  anomalies: [],
  evidence: { primary_image: null, sightings: { count: 23, ids: [] } },
  created_at: '2026-05-18T08:14:25Z',
  updated_at: '2026-05-18T08:31:09Z',
  links: {},
}

function wrap(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>)
}

describe('TransitTable', () => {
  it('renders vessel name', () => {
    wrap(
      <TransitTable
        transits={[mockTransit]}
        isLoading={false}
        isFetchingNextPage={false}
        hasNextPage={false}
        onLoadMore={() => {}}
      />,
    )
    expect(screen.getByText('MS HAMBURG EXPRESS')).toBeInTheDocument()
  })

  it('renders area name', () => {
    wrap(
      <TransitTable
        transits={[mockTransit]}
        isLoading={false}
        isFetchingNextPage={false}
        hasNextPage={false}
        onLoadMore={() => {}}
      />,
    )
    expect(screen.getByText('Strait of Gibraltar')).toBeInTheDocument()
  })

  it('shows skeleton rows when loading', () => {
    wrap(
      <TransitTable
        transits={[]}
        isLoading={true}
        isFetchingNextPage={false}
        hasNextPage={false}
        onLoadMore={() => {}}
      />,
    )
    expect(screen.getAllByRole('row').length).toBeGreaterThan(1)
  })
})
