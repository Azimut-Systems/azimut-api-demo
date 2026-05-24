import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { VesselChip } from './VesselChip'
import type { Vessel } from '../types/api'

const baseVessel: Vessel = {
  aid: 'aid_v_001',
  aid_scope: 'global',
  name: 'MS HAMBURG EXPRESS',
  imo: '9301234',
  mmsi: '211281000',
  callsign: 'DHHE',
  category: 'merchant',
  subtype: 'containers',
  flag: 'DE',
  dimensions: null,
  previous_aids: [],
}

describe('VesselChip', () => {
  it('renders the vessel name', () => {
    render(<VesselChip vessel={baseVessel} />)
    expect(screen.getByText('MS HAMBURG EXPRESS')).toBeInTheDocument()
  })

  it('falls back to IMO when name is null', () => {
    render(<VesselChip vessel={{ ...baseVessel, name: null }} />)
    expect(screen.getByText('9301234')).toBeInTheDocument()
  })

  it('falls back to AID when name and IMO are null', () => {
    render(<VesselChip vessel={{ ...baseVessel, name: null, imo: null }} />)
    expect(screen.getByText('aid_v_001')).toBeInTheDocument()
  })
})
