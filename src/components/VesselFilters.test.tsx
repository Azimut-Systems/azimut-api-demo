import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { VesselFilters } from './VesselFilters'

describe('VesselFilters', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('does not apply category filters while typing', () => {
    vi.useFakeTimers()
    const onChange = vi.fn()

    render(<VesselFilters filters={{}} onChange={onChange} />)

    const category = screen.getByPlaceholderText(/category/i)
    category.focus()
    fireEvent.change(category, {
      target: { value: ' merchant ' },
    })

    expect(onChange).not.toHaveBeenCalled()
    expect(category).toHaveFocus()
    expect(category).toHaveValue(' merchant ')

    act(() => {
      vi.advanceTimersByTime(300)
    })

    expect(onChange).not.toHaveBeenCalled()
  })

  it('applies category filters when pressing enter', () => {
    const onChange = vi.fn()

    render(<VesselFilters filters={{}} onChange={onChange} />)

    const category = screen.getByPlaceholderText(/category/i)
    fireEvent.change(category, {
      target: { value: ' merchant ' },
    })
    fireEvent.keyDown(category, { key: 'Enter' })

    expect(onChange).toHaveBeenCalledWith({ category: 'Merchant' })
  })

  it('applies category filters when leaving the textbox', () => {
    const onChange = vi.fn()

    render(<VesselFilters filters={{}} onChange={onChange} />)

    const category = screen.getByPlaceholderText(/category/i)
    fireEvent.change(category, {
      target: { value: ' merchant ' },
    })
    fireEvent.blur(category)

    expect(onChange).toHaveBeenCalledWith({ category: 'Merchant' })
  })
})
