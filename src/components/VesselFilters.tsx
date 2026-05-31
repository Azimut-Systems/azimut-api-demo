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
  const [localCategory, setLocalCategory] = useState(filters.category ?? '')
  const didMount = useRef(false)
  const flagRef = useRef<HTMLInputElement>(null)
  const subtypeRef = useRef<HTMLInputElement>(null)

  // Debounce: fire onChange 300ms after the user stops typing
  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true
      return
    }

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

  function applyCategory() {
    onChange({ ...filters, category: normalizeCategory(localCategory) })
  }

  function clear() {
    setLocalQ('')
    setLocalCategory('')
    if (flagRef.current) flagRef.current.value = ''
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
        className="h-8 w-32"
        placeholder="Category…"
        value={localCategory}
        onChange={(e) => setLocalCategory(e.target.value)}
        onBlur={applyCategory}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            applyCategory()
            e.currentTarget.blur()
          }
        }}
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
