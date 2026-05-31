import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import type { VesselFiltersInput } from '../hooks/useVessels'

interface VesselFiltersProps {
  filters: VesselFiltersInput
  onChange: (filters: VesselFiltersInput) => void
}

export function VesselFilters({ filters, onChange }: VesselFiltersProps) {
  // Local state for search so we can debounce without blocking the input
  const [localQ, setLocalQ] = useState(filters.q ?? '')

  // Debounce: fire onChange 300ms after the user stops typing
  useEffect(() => {
    const t = setTimeout(() => {
      onChange({ ...filters, q: localQ || undefined })
    }, 300)
    return () => clearTimeout(t)
  }, [localQ, filters, onChange])

  function clear() {
    setLocalQ('')
    onChange({})
  }

  return (
    <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-b bg-muted/30 text-sm">
      <Input
        className="h-8 w-56"
        placeholder="Search by name, IMO, MMSI…"
        value={localQ}
        onChange={(e) => setLocalQ(e.target.value)}
      />

      <Input
        className="h-8 w-24 uppercase"
        placeholder="Flag (DE…)"
        maxLength={2}
        value={filters.flag ?? ''}
        onChange={(e) =>
          onChange({ ...filters, flag: e.target.value.toUpperCase() || undefined })
        }
      />

      <Input
        className="h-8 w-32"
        placeholder="Category…"
        value={filters.category ?? ''}
        onChange={(e) =>
          onChange({ ...filters, category: e.target.value.trim().toLowerCase() || undefined })
        }
      />

      <Input
        className="h-8 w-32"
        placeholder="Subtype…"
        value={filters.subtype ?? ''}
        onChange={(e) =>
          onChange({ ...filters, subtype: e.target.value || undefined })
        }
      />

      <Button variant="ghost" size="sm" onClick={clear} className="ml-auto">
        Clear filters
      </Button>
    </div>
  )
}
