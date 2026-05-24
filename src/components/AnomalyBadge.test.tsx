import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { AnomalyBadge } from './AnomalyBadge'

describe('AnomalyBadge', () => {
  it('renders anomaly type with underscores replaced by spaces', () => {
    render(<AnomalyBadge anomaly={{ type: 'ais_dark', detected_at: null }} />)
    expect(screen.getByText('ais dark')).toBeInTheDocument()
  })

  it('uses red styling for ais_dark', () => {
    render(<AnomalyBadge anomaly={{ type: 'ais_dark', detected_at: null }} />)
    expect(screen.getByText('ais dark')).toHaveClass('bg-red-100')
  })

  it('uses amber styling for loitering', () => {
    render(<AnomalyBadge anomaly={{ type: 'loitering', detected_at: null }} />)
    expect(screen.getByText('loitering')).toHaveClass('bg-amber-100')
  })
})
