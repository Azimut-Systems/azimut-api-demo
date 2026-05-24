import { useInfiniteQuery } from '@tanstack/react-query'
import { fetchTransits, type TransitsParams } from '../api/transits'

export type TransitFiltersInput = Omit<TransitsParams, 'cursor' | 'limit'>

export function useTransits(filters: TransitFiltersInput = {}) {
  return useInfiniteQuery({
    queryKey: ['transits', filters],
    queryFn: ({ pageParam }) =>
      fetchTransits({ ...filters, cursor: pageParam as string | undefined, limit: 50 }),
    getNextPageParam: (lastPage) =>
      lastPage.page.has_more ? lastPage.page.cursor : undefined,
    initialPageParam: undefined as string | undefined,
    refetchInterval: 30_000,
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  })
}
