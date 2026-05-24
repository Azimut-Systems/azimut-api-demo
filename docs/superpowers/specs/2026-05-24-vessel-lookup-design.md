# Vessel Lookup — Design Spec

**Date:** 2026-05-24
**Status:** Approved
**Scope:** Phase 2 — Vessel list + Vessel detail with transit timeline. Map view is Phase 3.

---

## Overview

Adds a vessel-centric view to the existing Azimut.ai Pull API reference app. Users can browse and search vessels from a top-level `Vessels` section, view a vessel's identity card, and explore its transit history on a gantt-style timeline. Navigation is bidirectional: transit views link to vessels, vessel timelines link back to individual transits.

---

## Stack

Unchanged from Phase 1. No new dependencies — timeline is CSS/div-based (no charting library).

---

## Project Structure (new/changed files)

```
src/
├── api/
│   └── vessels.ts           # already exists — fetchVessels, fetchVessel
├── hooks/
│   ├── useVessels.ts        # new — infinite query for vessel list
│   ├── useVessel.ts         # new — single vessel query
│   └── useVesselTransits.ts # new — paginated transit history for a vessel
├── components/
│   ├── VesselCard.tsx       # new — extracted from TransitDetail, shared
│   ├── VesselTable.tsx      # new — vessel list table
│   ├── VesselFilters.tsx    # new — search + filter bar for vessel list
│   └── TransitTimeline.tsx  # new — gantt-style transit timeline
├── pages/
│   ├── VesselList.tsx       # new — route: /vessels
│   └── VesselDetail.tsx     # new — route: /vessels/:aid
```

**Modified files:**
- `src/App.tsx` — add `/vessels` and `/vessels/:aid` routes
- `src/pages/TransitFeed.tsx` — top bar becomes shared nav (Transits + Vessels links)
- `src/components/TransitTable.tsx` — VesselChip becomes a link to `/vessels/:aid`
- `src/pages/TransitDetail.tsx` — vessel name in header becomes a link; extract VesselCard

---

## Routes

| Path | Page | Notes |
|---|---|---|
| `/` | TransitFeed | Unchanged |
| `/transits/:id` | TransitDetail | Vessel name becomes link |
| `/vessels` | VesselList | New |
| `/vessels/:aid` | VesselDetail | New |

---

## Navigation

The top bar becomes a shared nav bar across both pages:

```
[ Azimut ]   Transits   Vessels        [ org_id ]   [ • Live ]
```

- `Transits` link: active (bold/underline) when on `/` or `/transits/*`
- `Vessels` link: active when on `/vessels` or `/vessels/:aid`
- Org name and live indicator stay right-aligned (live indicator only on transit feed)

---

## Vessel List Page (`/vessels`)

### Filter bar

Consistent with TransitFilters visual style (horizontal strip, `border-b bg-muted/30`):

| Control | Type | API param |
|---|---|---|
| Search | Text input (debounced 300ms) | `q` |
| Flag | 2-char text input (uppercase) | `flag` |
| Clear filters | Ghost button (right-aligned) | — |

### Vessel table

Columns:

| — | Vessel | IMO | MMSI | Category | Flag | Dimensions |
|---|---|---|---|---|---|---|
| thumbnail | MS HAMBURG EXPRESS 🇩🇪 | 9301234 | 211281000 | Merchant · Containers | DE | 294 m × 32 m |

- Thumbnail: `evidence.primary_image` is not on vessel objects — placeholder camera icon for all rows. (Vessel objects don't carry an image URL; images come from transits/sightings.)
- Clicking any row navigates to `/vessels/:aid`
- Load-more cursor pagination (same pattern as transit feed)
- Skeleton shimmer on initial load (8 rows × 7 cells)
- Empty state: "No vessels match your search." with clear-filters link

---

## Vessel Detail Page (`/vessels/:aid`)

### Layout

Two-column, same proportions as TransitDetail (`grid grid-cols-1 md:grid-cols-2`):

**Left column — identity card**

Extracted `VesselCard` component (shared with TransitDetail). Displays as label/value rows, null fields omitted:
- Name, IMO, MMSI, Callsign, Flag, Category, Type (subtype, underscores → spaces), Dimensions (length × beam)

Skeleton (5 rows) while loading.

**Right column — Transit Timeline**

Header: `Transit History` with Prev / Next pagination controls (disabled when at first/last page).

Shows 15 transits per page (most recent first). Each row in the timeline:

```
[ sighting thumbnails at evenly-distributed x positions ]
[════════════ STRAIT OF GIBRALTAR  ════════════════════] ← transit bar
  May 18, 08:14  →  08:31   westbound   97%   [anomaly badges]
```

**Transit bar:**
- Full-width rounded bar, `bg-green-100 border-green-300` for open, `bg-slate-100 border-slate-200` for closed
- Area name centered in the bar (bold, truncated)
- Clicking the bar → `/transits/:id`

**Sighting thumbnails (above bar):**
- One thumbnail placeholder per sighting, evenly spaced across the bar's width
- Count comes from `transit.evidence.sightings.count` (reliable total); IDs from `evidence.sightings.ids` (may be a subset)
- Thumbnail: `h-12 w-16 object-cover rounded` — camera-icon placeholder now; will display actual image once API adds `image_url` to sighting responses
- If count > 5, show first 5 thumbnails + "+N" overflow chip
- Tooltips on hover: `sighted_at` timestamp (from IDs list; no timestamp shown for overflow items)

**Below bar:**
- `entered_at → exited_at` (or "still open" in green)
- Course (if present), confidence %, anomaly badges

**Pagination:**
- Prev / Next buttons, disabled at boundaries
- No "page N of M" — the API cursor doesn't expose total count; just Prev/Next is sufficient

---

## Data Flow

### `useVessels(filters)`

```typescript
useInfiniteQuery({
  queryKey: ['vessels', filters],
  queryFn: ({ pageParam }) => fetchVessels({ ...filters, cursor: pageParam, limit: 50 }),
  getNextPageParam: (lastPage) => lastPage.page.has_more ? lastPage.page.cursor : undefined,
  initialPageParam: undefined,
  staleTime: 30_000,
  placeholderData: (prev) => prev,
  // No refetchInterval — vessel records don't update live
})
```

### `useVessel(aid)`

```typescript
useQuery({
  queryKey: ['vessel', aid],
  queryFn: () => fetchVessel(aid),
  staleTime: 30_000,
  enabled: Boolean(aid),
})
```

### `useVesselTransits(aid, cursor)`

```typescript
useQuery({
  queryKey: ['vessel-transits', aid, cursor],
  queryFn: () => fetchVesselTransits(aid, { cursor, limit: 15 }),
  staleTime: 30_000,
  enabled: Boolean(aid),
  placeholderData: (prev) => prev,
})
```

New API function needed in `src/api/vessels.ts`:

```typescript
export async function fetchVesselTransits(
  aid: string,
  params: { cursor?: string; limit?: number } = {}
): Promise<CollectionEnvelope<Transit>>
```

---

## Error Handling

| Scenario | Behaviour |
|---|---|
| 404 on vessel detail | Inline "Vessel not found." + "← Back to vessels" link |
| Network error / 5xx | Toast with retry button; last good data stays visible |
| Empty vessel list | "No vessels match your search." with clear-filters link |
| Vessel with no transits | "No transit history for this vessel." message in timeline column |

---

## Loading States

- Vessel list initial load: shimmer skeleton rows
- Vessel detail: skeleton for left column (5 rows), skeleton rows for timeline (3 × bar height)
- Pagination: previous data stays visible (`placeholderData`) — no blank flash on page change

---

## Cross-linking

- **TransitTable** — `VesselChip` becomes `<Link to="/vessels/:aid">`, `stopPropagation()` so row click still navigates to transit
- **TransitDetail** — vessel name in page header becomes `<Link to="/vessels/:aid">`
- **VesselDetail timeline** — each transit bar is a `<Link to="/transits/:id">`

---

## Out of Scope (Phase 2)

- Map view (Mapbox) — Phase 3
- Vessel edit / enrichment
- Vessel comparison
- Per-sighting image thumbnails in timeline (blocked on API adding `image_url` to sighting response — component is ready to display them once available)
