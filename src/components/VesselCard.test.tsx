import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { VesselCard } from './VesselCard'
import type { Vessel } from '../types/api'

const baseVessel: Vessel = {
  aid: 'aid_v_001',
  aid_scope: 'global',
  name: 'MS HAMBURG EXPRESS',
  imo: '9301234',
  mmsi: '211281000',
  callsign: null,
  category: 'merchant',
  subtype: 'containers',
  flag: 'DE',
  dimensions: { length_m: 294, beam_m: 32 },
  previous_aids: [],
}

describe('VesselCard', () => {
  it('renders vessel name', () => {
    render(<VesselCard vessel={baseVessel} />)
    expect(screen.getByText('MS HAMBURG EXPRESS')).toBeInTheDocument()
  })

  it('renders IMO', () => {
    render(<VesselCard vessel={baseVessel} />)
    expect(screen.getByText('9301234')).toBeInTheDocument()
  })

  it('omits null fields', () => {
    render(<VesselCard vessel={{ ...baseVessel, callsign: null }} />)
    expect(screen.queryByText('Callsign')).not.toBeInTheDocument()
  })

  it('renders dimensions', () => {
    render(<VesselCard vessel={baseVessel} />)
    expect(screen.getByText(/294.*32/)).toBeInTheDocument()
  })
})
