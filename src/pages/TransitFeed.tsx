import { useState } from 'react'
import { useTransits, type TransitFiltersInput } from '../hooks/useTransits'
import { useMe } from '../hooks/useMe'
import { NavBar } from '../components/NavBar'
import { TransitFilters } from '../components/TransitFilters'
import { TransitTable } from '../components/TransitTable'

export function TransitFeed() {
  const [filters, setFilters] = useState<TransitFiltersInput>({})
  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useTransits(filters)
  const { data: me } = useMe()

  const transits = data?.pages.flatMap((p) => p.data) ?? []
  const hasOpenTransits = transits.some((t) => t.status === 'open')

  return (
    <div className="flex flex-col min-h-screen">
      <NavBar orgId={me?.org_id} showLiveIndicator={hasOpenTransits} />
      <TransitFilters filters={filters} onChange={setFilters} />
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
