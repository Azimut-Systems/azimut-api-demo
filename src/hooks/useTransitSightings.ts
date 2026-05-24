import { useQuery } from '@tanstack/react-query'
import { fetchTransitSightings } from '../api/transits'

export function useTransitSightings(id: string) {
  return useQuery({
    queryKey: ['transit-sightings', id],
    queryFn: () => fetchTransitSightings(id),
    staleTime: 30_000,
    enabled: Boolean(id),
  })
}
