import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useVessels, type VesselFiltersInput } from '../hooks/useVessels'
import { useMe } from '../hooks/useMe'
import { NavBar } from '../components/NavBar'
import { VesselFilters } from '../components/VesselFilters'
import { VesselGrid } from '../components/VesselGrid'

export function VesselList() {
  const [searchParams, setSearchParams] = useSearchParams()
  const filters = useMemo(
    () => vesselFiltersFromSearchParams(searchParams),
    [searchParams],
  )
  const setFilters = useCallback(
    (nextFilters: VesselFiltersInput) => {
      setSearchParams(vesselFiltersToSearchParams(nextFilters), { replace: true })
    },
    [setSearchParams],
  )
  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useVessels(filters)
  const { data: me } = useMe()

  const vessels = data?.pages.flatMap((p) => p.data) ?? []

  return (
    <div className="flex flex-col min-h-screen">
      <NavBar orgId={me?.org_id} />
      <VesselFilters
        key={searchParams.toString()}
        filters={filters}
        onChange={setFilters}
      />
      <main className="flex-1 overflow-auto">
        <VesselGrid
          vessels={vessels}
          isLoading={isLoading}
          isFetchingNextPage={isFetchingNextPage}
          hasNextPage={Boolean(hasNextPage)}
          onLoadMore={() => fetchNextPage()}
        />
      </main>
    </div>
  )
}

function vesselFiltersFromSearchParams(searchParams: URLSearchParams): VesselFiltersInput {
  return {
    q: searchParams.get('q') || undefined,
    flag: searchParams.get('flag') || undefined,
    category: searchParams.get('category') || undefined,
    subtype: searchParams.get('subtype') || undefined,
  }
}

function vesselFiltersToSearchParams(filters: VesselFiltersInput) {
  const searchParams = new URLSearchParams()

  if (filters.q) searchParams.set('q', filters.q)
  if (filters.flag) searchParams.set('flag', filters.flag)
  if (filters.category) searchParams.set('category', filters.category)
  if (filters.subtype) searchParams.set('subtype', filters.subtype)

  return searchParams
}
