import { Button } from './ui/button'
import { Input } from './ui/input'
import { useAreas } from '../hooks/useAreas'
import type { TransitFiltersInput } from '../hooks/useTransits'
import type { TransitStatus } from '../types/api'

interface TransitFiltersProps {
  filters: TransitFiltersInput
  onChange: (filters: TransitFiltersInput) => void
}

export function TransitFilters({ filters, onChange }: TransitFiltersProps) {
  const { data: areasData } = useAreas()
  const areas = areasData?.data ?? []

  function set(patch: Partial<TransitFiltersInput>) {
    onChange({ ...filters, ...patch })
  }

  function clear() {
    onChange({})
  }

  return (
    <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-b bg-muted/30 text-sm">
      {/* Status */}
      <select
        className="h-8 rounded-md border bg-background px-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
        value={filters.status ?? ''}
        onChange={(e) =>
          set({ status: (e.target.value as TransitStatus) || undefined })
        }
      >
        <option value="">All statuses</option>
        <option value="open">Open</option>
        <option value="closed">Closed</option>
      </select>

      {/* Anomalies toggle */}
      <label className="flex items-center gap-1.5 cursor-pointer select-none">
        <input
          type="checkbox"
          className="accent-primary"
          checked={filters.has_anomaly ?? false}
          onChange={(e) => set({ has_anomaly: e.target.checked || undefined })}
        />
        Anomalies only
      </label>

      {/* Area */}
      <select
        className="h-8 rounded-md border bg-background px-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
        value={filters.area_id ?? ''}
        onChange={(e) => set({ area_id: e.target.value || undefined })}
      >
        <option value="">All areas</option>
        {areas.map((a) => (
          <option key={a.area_id} value={a.area_id}>
            {a.name}
          </option>
        ))}
      </select>

      {/* Entered after */}
      <input
        type="date"
        className="h-8 rounded-md border bg-background px-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
        value={filters.entered_after ? filters.entered_after.slice(0, 10) : ''}
        onChange={(e) =>
          set({ entered_after: e.target.value ? e.target.value + 'T00:00:00Z' : undefined })
        }
      />

      {/* Entered before */}
      <input
        type="date"
        className="h-8 rounded-md border bg-background px-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
        value={filters.entered_before ? filters.entered_before.slice(0, 10) : ''}
        onChange={(e) =>
          set({ entered_before: e.target.value ? e.target.value + 'T23:59:59Z' : undefined })
        }
      />

      {/* Flag */}
      <Input
        className="h-8 w-24 uppercase"
        placeholder="Flag (DE…)"
        maxLength={2}
        value={filters.flag ?? ''}
        onChange={(e) => set({ flag: e.target.value.toUpperCase() || undefined })}
      />

      {/* Clear */}
      <Button variant="ghost" size="sm" onClick={clear} className="ml-auto">
        Clear filters
      </Button>
    </div>
  )
}
