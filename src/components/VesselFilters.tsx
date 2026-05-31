import { useState, useEffect, useRef } from 'react'
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
  const flagRef = useRef<HTMLInputElement>(null)
  const categoryRef = useRef<HTMLInputElement>(null)
  const subtypeRef = useRef<HTMLInputElement>(null)

  // Debounce: fire onChange 300ms after the user stops typing
  useEffect(() => {
    const t = setTimeout(() => {
      onChange({
        flag: filters.flag,
        category: filters.category,
        subtype: filters.subtype,
        q: localQ || undefined,
      })
    }, 300)
    return () => clearTimeout(t)
  }, [localQ, filters.flag, filters.category, filters.subtype, onChange])

  function clear() {
    setLocalQ('')
    if (flagRef.current) flagRef.current.value = ''
    if (categoryRef.current) categoryRef.current.value = ''
    if (subtypeRef.current) subtypeRef.current.value = ''
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
        ref={flagRef}
        className="h-8 w-24 uppercase"
        placeholder="Flag (DE…)"
        maxLength={2}
        defaultValue={filters.flag ?? ''}
        onChange={(e) =>
          onChange({ ...filters, flag: e.target.value.toUpperCase() || undefined })
        }
      />

      <Input
        ref={categoryRef}
        className="h-8 w-32"
        placeholder="Category…"
        defaultValue={filters.category ?? ''}
        onChange={(e) =>
          onChange({ ...filters, category: normalizeCategory(e.target.value) })
        }
      />

      <Input
        ref={subtypeRef}
        className="h-8 w-32"
        placeholder="Subtype…"
        defaultValue={filters.subtype ?? ''}
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

function normalizeCategory(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return undefined
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase()
}
