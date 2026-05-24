import { useQuery } from '@tanstack/react-query'
import { fetchVesselTransits } from '../api/vessels'

/** Returns the primary_image href from the vessel's most recent transit, or null. */
export function useVesselThumbnail(aid: string) {
  return useQuery({
    queryKey: ['vessel-thumbnail', aid],
    queryFn: () => fetchVesselTransits(aid, { limit: 1 }),
    staleTime: 5 * 60 * 1000,
    enabled: Boolean(aid),
    select: (data) => data.data[0]?.evidence.primary_image?.href ?? null,
  })
}
