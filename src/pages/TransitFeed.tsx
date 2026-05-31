import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTransits, type TransitFiltersInput } from '../hooks/useTransits'
import { useMe } from '../hooks/useMe'
import { NavBar } from '../components/NavBar'
import { TransitFilters } from '../components/TransitFilters'
import { TransitTable } from '../components/TransitTable'

export function TransitFeed() {
  const [searchParams, setSearchParams] = useSearchParams()
  const filters = useMemo(
    () => transitFiltersFromSearchParams(searchParams),
    [searchParams],
  )
  const setFilters = useCallback(
    (nextFilters: TransitFiltersInput) => {
      setSearchParams(transitFiltersToSearchParams(nextFilters), { replace: true })
    },
    [setSearchParams],
  )
  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useTransits(filters)
  const { data: me } = useMe()

  const transits = data?.pages.flatMap((p) => p.data) ?? []
  const hasOpenTransits = transits.some((t) => t.status === 'open')

  return (
    <div className="flex flex-col min-h-screen">
      <NavBar orgId={me?.org_id} showLiveIndicator={hasOpenTransits} />
      <TransitFilters
        filters={filters}
        onChange={setFilters}
      />
      <main className="flex-1 overflow-auto">
        <TransitTable
          transits={transits}
          isLoading={isLoading}
          isFetchingNextPage={isFetchingNextPage}
          hasNextPage={Boolean(hasNextPage)}
          onLoadMore={() => fetchNextPage()}
        />
      </main>
    </div>
  )
}

function transitFiltersFromSearchParams(searchParams: URLSearchParams): TransitFiltersInput {
  return {
    status: (searchParams.get('status') as TransitFiltersInput['status']) || undefined,
    has_anomaly: searchParams.get('has_anomaly') === 'true' || undefined,
    area_id: searchParams.get('area_id') || undefined,
    entered_after: searchParams.get('entered_after') || undefined,
    entered_before: searchParams.get('entered_before') || undefined,
    flag: searchParams.get('flag') || undefined,
  }
}

function transitFiltersToSearchParams(filters: TransitFiltersInput) {
  const searchParams = new URLSearchParams()

  if (filters.status) searchParams.set('status', filters.status)
  if (filters.has_anomaly) searchParams.set('has_anomaly', 'true')
  if (filters.area_id) searchParams.set('area_id', filters.area_id)
  if (filters.entered_after) searchParams.set('entered_after', filters.entered_after)
  if (filters.entered_before) searchParams.set('entered_before', filters.entered_before)
  if (filters.flag) searchParams.set('flag', filters.flag)

  return searchParams
}
