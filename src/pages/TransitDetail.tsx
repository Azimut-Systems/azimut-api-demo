import { useParams, Link } from 'react-router-dom'
import { useTransit } from '../hooks/useTransit'
import { useTransitSightings } from '../hooks/useTransitSightings'
import { AnomalyBadge } from '../components/AnomalyBadge'
import { Skeleton } from '../components/ui/skeleton'
import { Separator } from '../components/ui/separator'
import { cn } from '../lib/utils'
import { formatDatetime } from '../lib/formatDatetime'
import { VesselCard } from '../components/VesselCard'
import type { Sighting } from '../types/api'

export function TransitDetail() {
  const { id } = useParams<{ id: string }>()
  const { data: transitEnvelope, isLoading: transitLoading, error } = useTransit(id!)
  const { data: sightingsEnvelope, isLoading: sightingsLoading } = useTransitSightings(id!)

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-2 text-muted-foreground">
        <p>Transit not found.</p>
        <Link to="/" className="text-sm underline">← Back to feed</Link>
      </div>
    )
  }

  const transit = transitEnvelope?.data
  const sightings = sightingsEnvelope?.data ?? []

  return (
    <div className="flex flex-col min-h-screen">
      <header className="flex items-center gap-4 px-6 py-4 border-b bg-background">
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
          ← Feed
        </Link>
        <h1 className="text-lg font-semibold tracking-tight">
          {transitLoading ? (
            <Skeleton className="h-5 w-48" />
          ) : transit ? (
            <Link
              to={`/vessels/${transit.vessel.aid}`}
              className="hover:underline"
            >
              {transit.vessel.name ?? id}
            </Link>
          ) : (
            id
          )}
        </h1>
      </header>

      <main className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 flex-1">
        {/* Left column */}
        <div className="flex flex-col gap-6">
          {/* Primary image */}
          {!transitLoading && transit?.evidence.primary_image?.href && (
            <section className="rounded-lg border overflow-hidden">
              <img
                src={transit.evidence.primary_image.href}
                alt={transit.vessel.name ?? transit.id}
                className="w-full object-cover max-h-72"
              />
            </section>
          )}
          {transitLoading && <Skeleton className="w-full h-48 rounded-lg" />}

          {/* Vessel card */}
          <section className="rounded-lg border p-4 flex flex-col gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Vessel
            </h2>
            {transitLoading ? (
              <div className="flex flex-col gap-2">
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-4 w-3/4" />)}
              </div>
            ) : transit ? (
              <VesselCard vessel={transit.vessel} />
            ) : null}
          </section>

          {/* Area card */}
          <section className="rounded-lg border p-4 flex flex-col gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Area
            </h2>
            {transitLoading ? (
              <Skeleton className="h-4 w-1/2" />
            ) : transit ? (
              <>
                <p className="font-medium">{transit.area.name}</p>
                <p className="text-sm text-muted-foreground capitalize">{transit.area.type}</p>
              </>
            ) : null}
          </section>

          {/* Timeline */}
          <section className="rounded-lg border p-4 flex flex-col gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Timeline
            </h2>
            {transitLoading ? (
              <Skeleton className="h-4 w-full" />
            ) : transit ? (
              <div className="flex flex-col gap-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Entered</span>
                  <span>{formatDatetime(transit.entered_at)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Exited</span>
                  <span className={cn(!transit.exited_at && 'text-green-600 font-medium')}>
                    {transit.exited_at ? formatDatetime(transit.exited_at) : 'Still open'}
                  </span>
                </div>
                {transit.course && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Course</span>
                    <span className="capitalize">{transit.course}</span>
                  </div>
                )}
              </div>
            ) : null}
          </section>

          {/* Identification */}
          <section className="rounded-lg border p-4 flex flex-col gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Identification
            </h2>
            {transitLoading ? (
              <Skeleton className="h-4 w-1/3" />
            ) : transit ? (
              <div className="flex gap-3 text-sm">
                <span className="font-medium">
                  {Math.round(transit.identification.confidence * 100)}% confidence
                </span>
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-xs font-medium',
                    transit.identification.ais_matched
                      ? 'bg-green-100 text-green-800'
                      : 'bg-slate-100 text-slate-600',
                  )}
                >
                  {transit.identification.ais_matched ? 'AIS matched' : 'No AIS match'}
                </span>
              </div>
            ) : null}
          </section>

          {/* Anomalies */}
          {!transitLoading && transit && transit.anomalies.length > 0 && (
            <section className="rounded-lg border border-red-200 p-4 flex flex-col gap-2">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-red-700">
                Anomalies
              </h2>
              <div className="flex flex-wrap gap-2">
                {transit.anomalies.map((a, i) => (
                  <AnomalyBadge key={i} anomaly={a} />
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Right column — sightings */}
        <div className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Sightings ({transit?.evidence.sightings.count ?? '…'})
          </h2>
          {sightingsLoading
            ? Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-32 w-full rounded-lg" />
              ))
            : sightings.map((s) => <SightingCard key={s.id} sighting={s} />)}
        </div>
      </main>
    </div>
  )
}

function SightingCard({ sighting }: { sighting: Sighting }) {
  const vs = sighting.visual_signals
  return (
    <div className="rounded-lg border overflow-hidden flex flex-col text-sm">
      {/* Image placeholder — per-sighting image URLs are not exposed in API v1.0 */}
      <div className="h-32 bg-muted flex flex-col items-center justify-center gap-1 text-muted-foreground/50">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        {vs?.image.quality && (
          <span className="text-xs capitalize">{vs.image.quality} quality{vs.image.occluded ? ' · occluded' : ''}</span>
        )}
      </div>
      <div className="p-4 flex flex-col gap-3">
      <div className="flex justify-between items-start">
        <span className="font-medium">{formatDatetime(sighting.sighted_at)}</span>
      </div>

      {vs?.ocr && (
        <>
          <Separator />
          <div className="flex flex-col gap-1">
            {vs.ocr.name_plate.text && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Name plate</span>
                <span className="font-mono">{vs.ocr.name_plate.text}</span>
              </div>
            )}
            {vs.ocr.imo_plate.text && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">IMO plate</span>
                <span className="font-mono">{vs.ocr.imo_plate.text}</span>
              </div>
            )}
          </div>
        </>
      )}

      {vs?.livery && (vs.livery.hull_main_color || vs.livery.funnel_color) && (
        <>
          <Separator />
          <div className="flex gap-3 items-center flex-wrap">
            <span className="text-muted-foreground">Livery</span>
            {[
              ['Hull', vs.livery.hull_main_color],
              ['Accent', vs.livery.hull_accent_color],
              ['Funnel', vs.livery.funnel_color],
            ]
              .filter(([, c]) => c)
              .map(([label, color]) => (
                <span key={label} className="flex items-center gap-1">
                  <span
                    className="inline-block h-4 w-4 rounded-full border"
                    style={{ backgroundColor: color! }}
                  />
                  <span className="text-xs text-muted-foreground capitalize">{label}</span>
                </span>
              ))}
          </div>
        </>
      )}

      {vs?.cargo_state && vs.cargo_state !== 'unknown' && (
        <div className="flex justify-between">
          <span className="text-muted-foreground">Cargo</span>
          <span className="capitalize">{vs.cargo_state}</span>
        </div>
      )}
      </div>
    </div>
  )
}
