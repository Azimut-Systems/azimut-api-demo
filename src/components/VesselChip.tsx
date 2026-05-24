import type { Vessel } from '../types/api'

interface VesselChipProps {
  vessel: Vessel
}

export function VesselChip({ vessel }: VesselChipProps) {
  const label = vessel.name ?? vessel.imo ?? vessel.aid
  return (
    <span className="flex items-center gap-1.5 min-w-0">
      {vessel.flag && <span className="shrink-0">{flagEmoji(vessel.flag)}</span>}
      <span className="truncate font-medium">{label}</span>
    </span>
  )
}

function flagEmoji(code: string): string {
  return code
    .toUpperCase()
    .split('')
    .map((c) => String.fromCodePoint(127397 + c.charCodeAt(0)))
    .join('')
}
