import { useParams, Link } from 'react-router-dom'
import { useTransit } from '../hooks/useTransit'
import { useTransitSightings } from '../hooks/useTransitSightings'
import { AnomalyBadge } from '../components/AnomalyBadge'
import { Skeleton } from '../components/ui/skeleton'
import { Separator } from '../components/ui/separator'
import { cn } from '../lib/utils'
import type { Sighting, Vessel } from '../types/api'

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
          {transitLoading ? <Skeleton className="h-5 w-48" /> : (transit?.vessel.name ?? id)}
        </h1>
      </header>

      <main className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 flex-1">
        {/* Left column */}
        <div className="flex flex-col gap-6">
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

function VesselCard({ vessel }: { vessel: Vessel }) {
  const rows: [string, string | null | undefined][] = [
    ['Name', vessel.name],
    ['IMO', vessel.imo],
    ['MMSI', vessel.mmsi],
    ['Callsign', vessel.callsign],
    ['Flag', vessel.flag],
    ['Category', vessel.category],
    ['Type', vessel.subtype?.replace(/_/g, ' ')],
    [
      'Dimensions',
      vessel.dimensions
        ? `${vessel.dimensions.length_m ?? '?'} m × ${vessel.dimensions.beam_m ?? '?'} m`
        : null,
    ],
  ]
  return (
    <div className="flex flex-col gap-1 text-sm">
      {rows
        .filter(([, v]) => v != null)
        .map(([label, value]) => (
          <div key={label} className="flex justify-between gap-4">
            <span className="text-muted-foreground shrink-0">{label}</span>
            <span className="text-right capitalize">{value}</span>
          </div>
        ))}
    </div>
  )
}

function SightingCard({ sighting }: { sighting: Sighting }) {
  const vs = sighting.visual_signals
  return (
    <div className="rounded-lg border p-4 flex flex-col gap-3 text-sm">
      <div className="flex justify-between items-start">
        <span className="font-medium">{formatDatetime(sighting.sighted_at)}</span>
        {vs?.image.quality && (
          <span className="text-xs text-muted-foreground capitalize">
            {vs.image.quality} quality{vs.image.occluded ? ' · occluded' : ''}
          </span>
        )}
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
  )
}

function formatDatetime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}
