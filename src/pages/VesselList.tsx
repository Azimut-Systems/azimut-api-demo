import { useState } from 'react'
import { useVessels, type VesselFiltersInput } from '../hooks/useVessels'
import { useMe } from '../hooks/useMe'
import { NavBar } from '../components/NavBar'
import { VesselFilters } from '../components/VesselFilters'
import { VesselTable } from '../components/VesselTable'

export function VesselList() {
  const [filters, setFilters] = useState<VesselFiltersInput>({})
  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useVessels(filters)
  const { data: me } = useMe()

  const vessels = data?.pages.flatMap((p) => p.data) ?? []

  return (
    <div className="flex flex-col min-h-screen">
      <NavBar orgId={me?.org_id} />
      <VesselFilters filters={filters} onChange={setFilters} />
      <main className="flex-1 overflow-auto">
        <VesselTable
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
