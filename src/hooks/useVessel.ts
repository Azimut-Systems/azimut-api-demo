import { useQuery } from '@tanstack/react-query'
import { fetchVessel } from '../api/vessels'

export function useVessel(aid: string) {
  return useQuery({
    queryKey: ['vessel', aid],
    queryFn: () => fetchVessel(aid),
    staleTime: 30_000,
    enabled: Boolean(aid),
  })
}
