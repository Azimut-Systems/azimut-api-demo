import type { Vessel } from '../types/api'

interface VesselCardProps {
  vessel: Vessel
}

export function VesselCard({ vessel }: VesselCardProps) {
  const rows: [string, string | null | undefined][] = [
    ['Name', vessel.name],
    ['IMO', vessel.imo],
    ['MMSI', vessel.mmsi],
    ['Callsign', vessel.callsign],
    ['Flag', vessel.flag],
    ['Category', vessel.category],
    ['Type', vessel.subtype?.replace(/_/g, ' ')],
    [
      'Dimensions',
      vessel.dimensions
        ? `${vessel.dimensions.length_m ?? '?'} m × ${vessel.dimensions.beam_m ?? '?'} m`
        : null,
    ],
  ]
  return (
    <div className="flex flex-col gap-1 text-sm">
      {rows
        .filter(([, v]) => v != null)
        .map(([label, value]) => (
          <div key={label} className="flex justify-between gap-4">
            <span className="text-muted-foreground shrink-0">{label}</span>
            <span className="text-right capitalize">{value}</span>
          </div>
        ))}
    </div>
  )
}
