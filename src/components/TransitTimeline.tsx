import { Link } from 'react-router-dom'
import { Skeleton } from './ui/skeleton'
import { Button } from './ui/button'
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
    <div className="flex flex-col gap-4">
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

      {isLoading ? (
        <TimelineSkeleton />
      ) : transits.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          No transit history for this vessel.
        </p>
      ) : (
        <div className="overflow-x-auto pb-3 -mx-6 px-6">
          {/*
           * Layout per stop:
           *   thumbnail  h-20 (80px)
           *   gap mb-5   (20px)
           *   dot        h-2.5 (10px) → center at 80+20+5 = 105px from top
           *   gap mt-3   (12px)
           *   label
           *
           * Spine sits at top: 105px
           */}
          <div className="relative flex" style={{ minWidth: 'max-content' }}>
            {/* Spine — behind all dots */}
            <div
              className="absolute left-[4.5rem] right-[4.5rem] h-px bg-border"
              style={{ top: '105px' }}
            />
            {transits.map((t) => (
              <TransitStop key={t.id} transit={t} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function TransitStop({ transit: t }: { transit: Transit }) {
  return (
    <Link
      to={`/transits/${t.id}`}
      className="group flex flex-col items-center w-36 shrink-0 px-2 select-none"
    >
      {/* Thumbnail — h-20 */}
      <div
        className={cn(
          'relative w-28 h-20 rounded-xl overflow-hidden bg-muted border shadow-sm mb-5',
          'transition-all duration-150 group-hover:shadow-md group-hover:scale-[1.04]',
        )}
      >
        {t.evidence.primary_image?.href ? (
          <img
            src={t.evidence.primary_image.href}
            alt={t.area.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground/25">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-7 w-7"
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
        )}
        {/* Open indicator */}
        {t.status === 'open' && (
          <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
          </span>
        )}
      </div>

      {/* Dot — sits on the spine */}
      <div
        className={cn(
          'relative z-10 w-2.5 h-2.5 rounded-full border-2 border-background shadow transition-colors duration-150',
          t.status === 'open'
            ? 'bg-green-500'
            : 'bg-muted-foreground/30 group-hover:bg-foreground',
        )}
      />

      {/* Label */}
      <div className="mt-3 text-center w-full px-1 space-y-0.5">
        <p className="text-xs font-medium text-foreground truncate">{t.area.name}</p>
        <p className="text-[11px] text-muted-foreground tabular-nums leading-relaxed">
          {formatDatetime(t.entered_at)}
        </p>
      </div>
    </Link>
  )
}

function TimelineSkeleton() {
  return (
    <div className="flex overflow-hidden">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex flex-col items-center w-36 shrink-0 px-2">
          <Skeleton className="w-28 h-20 rounded-xl mb-5" />
          <Skeleton className="w-2.5 h-2.5 rounded-full" />
          <div className="mt-3 space-y-1.5 w-full px-1">
            <Skeleton className="h-3 w-full rounded" />
            <Skeleton className="h-2.5 w-3/4 mx-auto rounded" />
          </div>
        </div>
      ))}
    </div>
  )
}
