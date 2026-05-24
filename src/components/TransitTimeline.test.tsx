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

  it('renders a transit link for each transit', () => {
    const second = { ...mockTransit, id: 'tr_18', area: { ...mockTransit.area, name: 'Suez Canal' } }
    wrap(
      <TransitTimeline
        transits={[mockTransit, second]}
        isLoading={false}
        hasPrev={false}
        hasNext={false}
        onPrev={() => {}}
        onNext={() => {}}
      />,
    )
    expect(screen.getByText('Strait of Gibraltar')).toBeInTheDocument()
    expect(screen.getByText('Suez Canal')).toBeInTheDocument()
  })

  it('shows a real image when primary_image href is provided', () => {
    const transitWithImage = {
      ...mockTransit,
      evidence: {
        primary_image: { href: 'https://example.com/img.jpg', expires_at: null },
        sightings: { count: 1, ids: [] },
      },
    }
    wrap(
      <TransitTimeline
        transits={[transitWithImage]}
        isLoading={false}
        hasPrev={false}
        hasNext={false}
        onPrev={() => {}}
        onNext={() => {}}
      />,
    )
    const img = screen.getByRole('img', { name: 'Strait of Gibraltar' })
    expect(img).toHaveAttribute('src', 'https://example.com/img.jpg')
  })
})
