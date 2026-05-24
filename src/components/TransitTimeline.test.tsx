import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { TransitTimeline } from './TransitTimeline'
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
  evidence: { primary_image: null, sightings: { count: 3, ids: [] } },
  created_at: '2026-05-18T08:14:25Z',
  updated_at: '2026-05-18T08:31:09Z',
  links: {},
}

function wrap(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>)
}

describe('TransitTimeline', () => {
  it('renders transit area name', () => {
    wrap(
      <TransitTimeline
        transits={[mockTransit]}
        isLoading={false}
        hasPrev={false}
        hasNext={false}
        onPrev={() => {}}
        onNext={() => {}}
      />,
    )
    expect(screen.getByText('Strait of Gibraltar')).toBeInTheDocument()
  })

  it('shows no history message when transits is empty', () => {
    wrap(
      <TransitTimeline
        transits={[]}
        isLoading={false}
        hasPrev={false}
        hasNext={false}
        onPrev={() => {}}
        onNext={() => {}}
      />,
    )
    expect(screen.getByText(/no transit history/i)).toBeInTheDocument()
  })

  it('shows sighting count indicators', () => {
    wrap(
      <TransitTimeline
        transits={[mockTransit]}
        isLoading={false}
        hasPrev={false}
        hasNext={false}
        onPrev={() => {}}
        onNext={() => {}}
      />,
    )
    // 3 sightings = 3 placeholder boxes rendered (count ≤ 5)
    expect(screen.getAllByTitle('Sighting').length).toBe(3)
  })
})
