import { cn } from '../lib/utils'
import type { Anomaly } from '../types/api'

const RED_TYPES = new Set(['ais_dark', 'identity_mismatch', 'name_repaint', 'flag_swap'])

interface AnomalyBadgeProps {
  anomaly: Anomaly
}

export function AnomalyBadge({ anomaly }: AnomalyBadgeProps) {
  const label = anomaly.type.replace(/_/g, ' ')
  const isRed = RED_TYPES.has(anomaly.type)
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        isRed ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800',
      )}
    >
      {label}
    </span>
  )
}
