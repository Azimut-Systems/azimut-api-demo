import { useState } from 'react'
import { useTransits, type TransitFiltersInput } from '../hooks/useTransits'
import { useMe } from '../hooks/useMe'
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
      {/* Top bar */}
      <header className="flex items-center gap-3 px-6 py-4 border-b bg-background">
        <h1 className="text-lg font-semibold tracking-tight">Transits</h1>
        {me && (
          <span className="text-sm text-muted-foreground">{me.org_id}</span>
        )}
        {hasOpenTransits && (
          <span className="flex items-center gap-1.5 text-xs text-green-700 ml-auto">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            Live
          </span>
        )}
      </header>

      {/* Filters */}
      <TransitFilters filters={filters} onChange={setFilters} />

      {/* Table */}
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
