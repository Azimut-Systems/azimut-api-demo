import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useVessel } from '../hooks/useVessel'
import { useVesselTransits } from '../hooks/useVesselTransits'
import { VesselCard } from '../components/VesselCard'
import { TransitTimeline } from '../components/TransitTimeline'
import { Skeleton } from '../components/ui/skeleton'

export function VesselDetail() {
  const { aid } = useParams<{ aid: string }>()
  const { data: vesselEnvelope, isLoading: vesselLoading, error } = useVessel(aid!)

  // Cursor stack for Prev/Next pagination.
  // cursorHistory[0] = undefined (first page), cursorHistory[n] = cursor for page n+1.
  const [cursorHistory, setCursorHistory] = useState<Array<string | undefined>>([undefined])
  const [pageIndex, setPageIndex] = useState(0)
  const currentCursor = cursorHistory[pageIndex]

  const { data: transitsEnvelope, isLoading: transitsLoading } = useVesselTransits(
    aid!,
    currentCursor,
  )

  const vessel = vesselEnvelope?.data
  const transits = transitsEnvelope?.data ?? []
  const hasMoreNext = transitsEnvelope?.page.has_more ?? false
  const nextCursor = transitsEnvelope?.page.cursor

  function goNext() {
    if (!hasMoreNext || !nextCursor) return
    // Only add cursor to history if we haven't gone here before
    const updated = [...cursorHistory.slice(0, pageIndex + 1), nextCursor]
    setCursorHistory(updated)
    setPageIndex(pageIndex + 1)
  }

  function goPrev() {
    if (pageIndex > 0) setPageIndex(pageIndex - 1)
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-2 text-muted-foreground">
        <p>Vessel not found.</p>
        <Link to="/vessels" className="text-sm underline">
          ← Back to vessels
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="flex items-center gap-4 px-6 py-4 border-b bg-background">
        <Link to="/vessels" className="text-sm text-muted-foreground hover:text-foreground">
          ← Vessels
        </Link>
        <h1 className="text-lg font-semibold tracking-tight">
          {vesselLoading ? (
            <Skeleton className="h-5 w-48" />
          ) : (
            vessel?.name ?? aid
          )}
        </h1>
      </header>

      <main className="flex flex-col gap-8 p-6 flex-1">
        {/* Vessel identity card — constrained width */}
        <section className="rounded-lg border p-4 flex flex-col gap-3 self-start min-w-[260px]">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Vessel
          </h2>
          {vesselLoading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-3/4" />
              ))}
            </div>
          ) : vessel ? (
            <VesselCard vessel={vessel} />
          ) : null}
        </section>

        {/* Transit timeline — full width */}
        <TransitTimeline
          transits={transits}
          isLoading={transitsLoading}
          hasPrev={pageIndex > 0 && !transitsLoading}
          hasNext={hasMoreNext}
          onPrev={goPrev}
          onNext={goNext}
        />
      </main>
    </div>
  )
}
