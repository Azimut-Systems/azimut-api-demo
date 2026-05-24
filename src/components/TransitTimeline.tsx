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

/**
 * Given an already-sorted (oldest-first) array of transits, returns a
 * position for each in [0, 1] where:
 *   - First  → 0   (left edge)
 *   - Last   → 1   (right edge)
 *   - Others → proportional to elapsed time between first and last
 *
 * A two-pass spread ensures adjacent stops are never closer than MIN_GAP:
 *   forward  pass pushes clustered stops to the right,
 *   backward pass pulls them back if they've overshot past the last stop,
 * while keeping the first pinned at 0 and the last pinned at 1.
 */
function computeTimePositions(transits: Transit[]): number[] {
  const n = transits.length
  if (n === 0) return []
  if (n === 1) return [0]

  const times = transits.map((t) => new Date(t.entered_at).getTime())
  const minT = times[0]
  const maxT = times[n - 1]
  const span = maxT - minT

  // Raw proportional positions (first=0, last=1). Use even spacing when all
  // transits share the same timestamp.
  const positions: number[] =
    span === 0
      ? times.map((_, i) => i / (n - 1))
      : times.map((t) => (t - minT) / span)

  // Minimum gap between adjacent stop centres, as a fraction of [0, 1].
  // 0.1 ≈ one card-width apart at ~800 px container width.
  const MIN_GAP = 0.1

  // Forward pass (indices 1 → n-2): push items right if too close to predecessor.
  for (let i = 1; i < n - 1; i++) {
    if (positions[i] - positions[i - 1] < MIN_GAP) {
      positions[i] = positions[i - 1] + MIN_GAP
    }
  }

  // Backward pass (indices n-2 → 1): pull items left if they've drifted past
  // their successor. Leaves positions[0]=0 and positions[n-1]=1 untouched.
  for (let i = n - 2; i >= 1; i--) {
    if (positions[i + 1] - positions[i] < MIN_GAP) {
      positions[i] = Math.max(0, positions[i + 1] - MIN_GAP)
    }
  }

  return positions
}

export function TransitTimeline({
  transits,
  isLoading,
  hasPrev,
  hasNext,
  onPrev,
  onNext,
}: TransitTimelineProps) {
  // Oldest first so positions map left → right chronologically.
  const ordered = [...transits].reverse()
  const positions = computeTimePositions(ordered)

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
      ) : ordered.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          No transit history for this vessel.
        </p>
      ) : (
        /*
         * Each stop is absolutely positioned at:
         *   left = pos × (100% − 8rem)
         *
         * This maps pos=0 → left edge and pos=1 → right edge (accounting for
         * the 8rem card width so the last card doesn't overflow).
         *
         * Stop heights:
         *   thumbnail h-20  80px
         *   mb-5            20px
         *   dot h-2.5       10px  → dot centre at 80+20+5 = 105px
         *   mt-3            12px
         *   label           ~32px
         *   total           ~149px  → container min-h-[10rem] (160px)
         *
         * Spine runs from centre of first dot to centre of last dot:
         *   left  = (0   × (100% − 8rem)) + 4rem = 4rem
         *   right = (1   × (100% − 8rem)) + 4rem from right = 4rem
         */
        <div className="overflow-x-auto pb-3">
          <div
            className="relative min-h-[10rem]"
            style={{ width: `min(100%, ${ordered.length * 10}rem)` }}
          >
            {/* Spine */}
            <div
              className="absolute left-[4rem] right-[4rem] h-px bg-border"
              style={{ top: '105px' }}
            />

            {ordered.map((t, i) => (
              <div
                key={t.id}
                className="absolute w-32"
                style={{ left: `calc(${positions[i]} * (100% - 8rem))` }}
              >
                <TransitStop transit={t} />
              </div>
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
      className="group flex flex-col items-center w-full select-none"
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
        {t.status === 'open' && (
          <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
          </span>
        )}
      </div>

      {/* Dot */}
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
        <div key={i} className="flex flex-col items-center flex-1 min-w-[8rem] px-2">
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
