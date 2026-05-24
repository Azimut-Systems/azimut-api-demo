import { Link } from 'react-router-dom'
import { Skeleton } from './ui/skeleton'
import { Button } from './ui/button'
import { AnomalyBadge } from './AnomalyBadge'
import { cn } from '../lib/utils'
import { formatDatetime } from '../lib/formatDatetime'
import type { Transit } from '../types/api'

interface TransitTimelineProps {
  transits: Transit[]
  isLoading: boolean
  hasPrev: boolean
  hasNext: boolean
  onPrev: () => void
  onNext: () => void
}

export function TransitTimeline({
  transits,
  isLoading,
  hasPrev,
  hasNext,
  onPrev,
  onNext,
}: TransitTimelineProps) {
  return (
    <div className="flex flex-col gap-2">
      {/* Header with pagination */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Transit History
        </h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onPrev} disabled={!hasPrev}>
            ← Prev
          </Button>
          <Button variant="outline" size="sm" onClick={onNext} disabled={!hasNext}>
            Next →
          </Button>
        </div>
      </div>

      {/* Timeline rows */}
      {isLoading ? (
        <div className="flex flex-col gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <div className="flex gap-2">
                {Array.from({ length: 3 }).map((_, j) => (
                  <Skeleton key={j} className="h-12 w-16 rounded" />
                ))}
              </div>
              <Skeleton className="h-10 w-full rounded-md" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ))}
        </div>
      ) : transits.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          No transit history for this vessel.
        </p>
      ) : (
        <div className="flex flex-col gap-6">
          {transits.map((t) => (
            <TransitRow key={t.id} transit={t} />
          ))}
        </div>
      )}
    </div>
  )
}

function TransitRow({ transit: t }: { transit: Transit }) {
  const sightingCount = t.evidence.sightings.count
  const visibleCount = Math.min(sightingCount, 5)
  const overflow = sightingCount > 5 ? sightingCount - 5 : 0

  return (
    <div className="flex flex-col gap-1.5">
      {/* Sighting thumbnails evenly distributed above bar */}
      {sightingCount > 0 && (
        <div className="flex items-end gap-2 px-1">
          {Array.from({ length: visibleCount }).map((_, i) => (
            <div
              key={i}
              title="Sighting"
              className="h-12 w-14 shrink-0 rounded bg-muted flex items-center justify-center text-muted-foreground/40"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
          ))}
          {overflow > 0 && (
            <span className="self-center text-xs text-muted-foreground bg-muted rounded px-1.5 py-0.5">
              +{overflow}
            </span>
          )}
        </div>
      )}

      {/* Transit bar */}
      <Link
        to={`/transits/${t.id}`}
        className={cn(
          'block w-full rounded-md border px-4 py-2.5 text-sm font-semibold text-center truncate',
          t.status === 'open'
            ? 'bg-green-100 border-green-300 text-green-900 hover:bg-green-200'
            : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200',
        )}
      >
        {t.area.name}
      </Link>

      {/* Metadata strip */}
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground px-0.5">
        <span>
          {formatDatetime(t.entered_at)}
          {' → '}
          {t.exited_at ? (
            formatDatetime(t.exited_at)
          ) : (
            <span className="text-green-600 font-medium">still open</span>
          )}
        </span>
        {t.course && <span className="capitalize">{t.course}</span>}
        <span>{Math.round(t.identification.confidence * 100)}%</span>
        {t.anomalies.map((a, i) => (
          <AnomalyBadge key={i} anomaly={a} />
        ))}
      </div>
    </div>
  )
}

