import { useInfiniteQuery } from '@tanstack/react-query'
import { fetchVessels, type VesselsParams } from '../api/vessels'

export type VesselFiltersInput = Omit<VesselsParams, 'cursor' | 'limit'>

export function useVessels(filters: VesselFiltersInput = {}) {
  return useInfiniteQuery({
    queryKey: ['vessels', filters],
    queryFn: ({ pageParam }) =>
      fetchVessels({ ...filters, cursor: pageParam as string | undefined, limit: 50 }),
    getNextPageParam: (lastPage) =>
      lastPage.page.has_more ? (lastPage.page.cursor ?? undefined) : undefined,
    initialPageParam: undefined as string | undefined,
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  })
}
