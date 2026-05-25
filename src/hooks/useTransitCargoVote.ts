import { useTransitSightings } from './useTransitSightings'
import type { CargoState } from '../types/api'

/**
 * Computes a majority-vote cargo state from a transit's sightings.
 * Ignores 'unknown' votes. Returns null if no meaningful votes exist.
 */
export function useTransitCargoVote(transitId: string): CargoState | null {
  const { data } = useTransitSightings(transitId)
  if (!data) return null

  const tally: Partial<Record<CargoState, number>> = {}
  for (const s of data.data) {
    const cs = s.visual_signals?.cargo_state
    if (!cs || cs === 'unknown') continue
    tally[cs] = (tally[cs] ?? 0) + 1
  }

  const entries = Object.entries(tally) as [CargoState, number][]
  if (entries.length === 0) return null
  return entries.sort((a, b) => b[1] - a[1])[0][0]
}
