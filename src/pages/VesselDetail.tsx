import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useVessel } from '../hooks/useVessel'
import { useVesselTransits } from '../hooks/useVesselTransits'
import { TransitTimeline } from '../components/TransitTimeline'
import { Skeleton } from '../components/ui/skeleton'
import { formatDatetime } from '../lib/formatDatetime'

export function VesselDetail() {
  const { aid } = useParams<{ aid: string }>()
  const { data: vesselEnvelope, isLoading: vesselLoading, error } = useVessel(aid!)

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

  // Hero: most recent transit's image (API returns newest first)
  const heroHref = transits[0]?.evidence.primary_image?.href

  // Stats derived from current page of transits
  const orderedForStats = [...transits].reverse()
  const firstSeen = orderedForStats[0]?.entered_at
  const lastSeen = transits[0]?.entered_at
  const transitCount = `${transits.length}${hasMoreNext ? '+' : ''}`

  function goNext() {
    if (!hasMoreNext || !nextCursor) return
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
        <Link to="/vessels" className="text-sm underline">← Back to vessels</Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <header className="flex items-center gap-4 px-6 py-4 border-b bg-background shrink-0">
        <Link to="/vessels" className="text-sm text-muted-foreground hover:text-foreground">
          ← Vessels
        </Link>
        <h1 className="text-lg font-semibold tracking-tight">
          {vesselLoading ? <Skeleton className="h-5 w-48" /> : (vessel?.name ?? aid)}
        </h1>
      </header>

      {/* Hero — fixed vh height so page never scrolls */}
      <div className="relative h-[40vh] bg-slate-900 overflow-hidden shrink-0">
        {heroHref && (
          <img
            src={heroHref}
            alt={vessel?.name ?? ''}
            className="w-full h-full object-cover"
          />
        )}
        {/* Gradient overlay — always present so text is readable */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />

        {/* Vessel identity — overlaid bottom-left */}
        <div className="absolute bottom-0 left-0 p-6 text-white">
          {vesselLoading ? (
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-40 bg-white/20" />
              <Skeleton className="h-3 w-56 bg-white/20" />
            </div>
          ) : vessel ? (
            <>
              <p className="text-sm text-white/70 mb-0.5">
                {[vessel.flag, vessel.category, vessel.subtype?.replace(/_/g, ' ')]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
              {vessel.dimensions && (
                <p className="text-xs text-white/50">
                  {vessel.dimensions.length_m ?? '?'} m × {vessel.dimensions.beam_m ?? '?'} m
                </p>
              )}
            </>
          ) : null}
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex flex-wrap items-center gap-x-8 gap-y-2 px-6 py-3 border-b bg-muted/20 text-sm shrink-0">
        {vesselLoading ? (
          <>
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-28" />
          </>
        ) : (
          <>
            {vessel?.imo && <StatItem label="IMO" value={vessel.imo} mono />}
            {vessel?.mmsi && <StatItem label="MMSI" value={vessel.mmsi} mono />}
            {vessel?.callsign && <StatItem label="Callsign" value={vessel.callsign} mono />}
          </>
        )}
        {!transitsLoading && firstSeen && (
          <StatItem label="First seen" value={formatDatetime(firstSeen)} />
        )}
        {!transitsLoading && lastSeen && lastSeen !== firstSeen && (
          <StatItem label="Last seen" value={formatDatetime(lastSeen)} />
        )}
        {!transitsLoading && transits.length > 0 && (
          <StatItem
            label={transits.length === 1 ? 'Transit' : 'Transits'}
            value={transitCount}
          />
        )}
      </div>

      {/* Transit timeline */}
      <main className="flex flex-col gap-4 p-6 flex-1 min-h-0 overflow-y-auto">
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

function StatItem({
  label,
  value,
  mono = false,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={mono ? 'font-mono text-sm' : 'text-sm font-medium'}>{value}</span>
    </div>
  )
}
