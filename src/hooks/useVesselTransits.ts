import { useQuery } from '@tanstack/react-query'
import { fetchVesselTransits } from '../api/vessels'

export function useVesselTransits(aid: string, cursor?: string) {
  return useQuery({
    queryKey: ['vessel-transits', aid, cursor],
    queryFn: () => fetchVesselTransits(aid, { cursor, limit: 15 }),
    staleTime: 30_000,
    enabled: Boolean(aid),
    placeholderData: (prev) => prev,
  })
}
