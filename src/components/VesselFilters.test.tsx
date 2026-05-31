import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { VesselFilters } from './VesselFilters'

describe('VesselFilters', () => {
  it('normalizes category filters to lowercase', () => {
    const onChange = vi.fn()

    render(<VesselFilters filters={{}} onChange={onChange} />)

    fireEvent.change(screen.getByPlaceholderText(/category/i), {
      target: { value: ' Merchant ' },
    })

    expect(onChange).toHaveBeenCalledWith({ category: 'merchant' })
  })
})
