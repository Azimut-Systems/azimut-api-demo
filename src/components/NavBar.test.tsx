import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { NavBar } from './NavBar'

function wrap(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>)
}

describe('NavBar', () => {
  it('renders Transits and Vessels nav links', () => {
    wrap(<NavBar />)
    expect(screen.getByRole('link', { name: 'Transits' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Vessels' })).toBeInTheDocument()
  })

  it('shows org_id when provided', () => {
    wrap(<NavBar orgId="azimut" />)
    expect(screen.getByText('azimut')).toBeInTheDocument()
  })

  it('shows live indicator when showLiveIndicator is true', () => {
    wrap(<NavBar showLiveIndicator />)
    expect(screen.getByText('Live')).toBeInTheDocument()
  })

  it('does not show live indicator by default', () => {
    wrap(<NavBar />)
    expect(screen.queryByText('Live')).not.toBeInTheDocument()
  })
})
