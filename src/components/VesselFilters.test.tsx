import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { VesselFilters } from './VesselFilters'

describe('VesselFilters', () => {
  it('normalizes category filters without rewriting the textbox', () => {
    const onChange = vi.fn()

    render(<VesselFilters filters={{}} onChange={onChange} />)

    const category = screen.getByPlaceholderText(/category/i)
    fireEvent.change(category, {
      target: { value: ' merchant ' },
    })

    expect(onChange).toHaveBeenCalledWith({ category: 'Merchant' })
    expect(category).toHaveValue(' merchant ')
  })
})
