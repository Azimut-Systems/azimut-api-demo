import { useNavigate } from 'react-router-dom'
import { Button } from './ui/button'
import { Skeleton } from './ui/skeleton'
import { useVesselThumbnail } from '../hooks/useVesselThumbnail'
import type { Vessel } from '../types/api'

interface VesselGridProps {
  vessels: Vessel[]
  isLoading: boolean
  isFetchingNextPage: boolean
  hasNextPage: boolean
  onLoadMore: () => void
}

export function VesselGrid({
  vessels,
  isLoading,
  isFetchingNextPage,
  hasNextPage,
  onLoadMore,
}: VesselGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="rounded-xl border overflow-hidden">
            <Skeleton className="aspect-video w-full" />
            <div className="p-4 flex flex-col gap-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (vessels.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-muted-foreground text-sm gap-2">
        <ShipIcon className="h-10 w-10 opacity-20" />
        <p>No vessels match your search.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {vessels.map((v) => (
          <VesselCard key={v.aid} vessel={v} />
        ))}
      </div>

      {hasNextPage && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={onLoadMore} disabled={isFetchingNextPage}>
            {isFetchingNextPage ? 'Loading…' : 'Load more'}
          </Button>
        </div>
      )}
    </div>
  )
}

function VesselCard({ vessel }: { vessel: Vessel }) {
  const navigate = useNavigate()
  const { data: thumbnailHref } = useVesselThumbnail(vessel.aid)

  const meta = [
    vessel.category,
    vessel.subtype?.replace(/_/g, ' '),
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <div
      className="group cursor-pointer rounded-xl border bg-card overflow-hidden transition-all duration-150 hover:shadow-lg hover:-translate-y-0.5"
      onClick={() => navigate(`/vessels/${vessel.aid}`)}
    >
      {/* Thumbnail */}
      <div className="aspect-video bg-gradient-to-br from-slate-800 to-slate-900 relative overflow-hidden">
        {thumbnailHref ? (
          <img
            src={thumbnailHref}
            alt={vessel.name ?? vessel.aid}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-600">
            <ShipIcon className="h-12 w-12" />
          </div>
        )}

        {/* Flag pill */}
        {vessel.flag && (
          <span className="absolute top-2 right-2 rounded-md bg-black/50 px-1.5 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
            {vessel.flag}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="p-3 flex flex-col gap-1">
        <p className="font-semibold text-sm leading-snug truncate">
          {vessel.name ?? <span className="text-muted-foreground italic">Unnamed</span>}
        </p>

        {vessel.imo && (
          <p className="text-xs text-muted-foreground font-mono">IMO {vessel.imo}</p>
        )}

        {meta && (
          <p className="text-xs text-muted-foreground capitalize truncate mt-0.5">{meta}</p>
        )}

        {vessel.dimensions && (
          <p className="text-xs text-muted-foreground">
            {vessel.dimensions.length_m ?? '?'} m × {vessel.dimensions.beam_m ?? '?'} m
          </p>
        )}
      </div>
    </div>
  )
}

function ShipIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 20a2 2 0 002 2h16a2 2 0 002-2" />
      <path d="M20 15l-8 3-8-3" />
      <path d="M4 12l8-9 8 9" />
      <path d="M12 3v12" />
    </svg>
  )
}
