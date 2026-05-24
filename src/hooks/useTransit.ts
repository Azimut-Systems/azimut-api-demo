import { useQuery } from '@tanstack/react-query'
import { fetchTransit } from '../api/transits'

export function useTransit(id: string) {
  return useQuery({
    queryKey: ['transit', id],
    queryFn: () => fetchTransit(id),
    staleTime: 30_000,
    enabled: Boolean(id),
  })
}
