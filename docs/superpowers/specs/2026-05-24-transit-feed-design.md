# Transit Feed Web App — Design Spec

**Date:** 2026-05-24  
**Status:** Approved  
**Scope:** Phase 1 — Transit feed + Transit detail. Vessel lookup and Map view are Phase 2/3.

---

## Overview

A React + TypeScript reference implementation of a customer-facing web app built on the Azimut.ai Pull API. The app demonstrates how an integrator would consume vessel-transit data from the API. It is scoped as a "first customer" experience — production-quality code, not a toy demo.

The API sandbox runs at `http://localhost:8080`. Production and sandbox share identical contracts; only the base URL differs.

---

## Stack

| Layer | Choice |
|---|---|
| Bundler | Vite |
| Framework | React 18 + TypeScript |
| Routing | React Router v6 |
| Data fetching | TanStack Query v5 |
| UI components | shadcn/ui + Tailwind CSS |
| Auth | OAuth 2.0 client_credentials (env vars) |

---

## Project Structure

```
src/
├── api/
│   ├── client.ts        # fetch wrapper — injects Bearer token, handles 401
│   ├── auth.ts          # mints/refreshes token from env vars
│   ├── transits.ts      # typed query functions for /v1/transits/*
│   ├── vessels.ts       # typed query functions for /v1/vessels/*
│   └── areas.ts         # typed query functions for /v1/areas
├── hooks/
│   ├── useTransits.ts   # paginated transit list with filters
│   ├── useTransit.ts    # single transit + sightings (parallel fetch)
│   └── useAreas.ts      # area list for filter dropdown (cached)
├── components/
│   ├── TransitTable.tsx  # main feed table
│   ├── TransitFilters.tsx # filter bar
│   ├── AnomalyBadge.tsx  # colored badge per anomaly type
│   └── VesselChip.tsx    # inline vessel name + flag
├── pages/
│   ├── TransitFeed.tsx   # route: /
│   └── TransitDetail.tsx # route: /transits/:id
└── main.tsx              # QueryClient, RouterProvider, auth bootstrap
```

---

## Authentication

Credentials are supplied via `.env`:

```
VITE_API_BASE_URL=http://localhost:8080
VITE_CLIENT_ID=your_client_id
VITE_CLIENT_SECRET=your_client_secret
```

`auth.ts` POSTs to `/v1/oauth/token` (HTTP Basic, `grant_type=client_credentials`) on app load and holds the Bearer JWT in module-level memory. It schedules a refresh 60s before `expires_in`. `client.ts` injects the token into every request. No localStorage — this is a sandbox.

---

## Routes

| Path | Page | Notes |
|---|---|---|
| `/` | TransitFeed | Main transit list with filters |
| `/transits/:id` | TransitDetail | Single transit + sightings |
| `/vessels` | (stub) | Phase 2 |
| `/vessels/:id` | (stub) | Phase 2 |

---

## Transit Feed Page (`/`)

### Layout

**Top bar:** app name, org name (from `GET /v1/me`), pulsing live indicator when any open transits are present.

**Filter bar:** horizontal strip with:
- Status toggle: `all / open / closed`
- Anomalies only: boolean toggle
- Area: dropdown from `GET /v1/areas`
- Date range: entered_after / entered_before date pickers
- Flag: free-text ISO-3166 alpha-2 input
- "Clear filters" button

**Transit table** — columns:

| Vessel | Flag | Area | Entered | Exited | Status | Course | Confidence | Anomalies |
|---|---|---|---|---|---|---|---|---|
| MS HAMBURG EXPRESS | 🇩🇪 | Strait of Gibraltar | 08:14 | 08:31 | closed | westbound | 97% | — |

Visual conventions:
- Open transits: subtle green left border on the row
- Anomaly badges colored by severity: `ais_dark` / `identity_mismatch` / `name_repaint` / `flag_swap` → red; `loitering` / `off_schedule` / `unexpected_call` → amber
- Clicking any row navigates to `/transits/:id`

**Pagination:** "Load more" button at the bottom using the API's opaque cursor. Not page numbers.

**Auto-refresh:** TanStack Query `refetchInterval: 30_000` so open transits update without user action.

---

## Transit Detail Page (`/transits/:id`)

Two-column layout:

**Left column:**
- Vessel identity card: name, IMO, MMSI, callsign, flag, category + subtype, dimensions (length × beam)
- Area card: area name, type, country
- Timeline: entered_at → exited_at (or "still open")
- Identification: confidence score, AIS matched badge
- Anomaly list: each anomaly with type and detected_at

**Right column:**
- Sightings list (from `GET /v1/transits/:id/sightings`): one card per sighting showing:
  - Timestamp (sighted_at)
  - Image quality badge + occluded flag
  - OCR: name plate text + match indicator, IMO plate text + match indicator
  - Livery: hull main / accent color swatches, funnel color swatch
  - Cargo state badge

---

## Data Flow

- All fetches go through TanStack Query
- Stale time: 30s; background refetch on window focus
- Transit feed uses `keepPreviousData: true` — no blank flash on filter change or pagination
- Transit detail fetches transit + sightings in parallel
- Areas list fetched once on mount, cached for the session

---

## Error Handling

| Scenario | Behaviour |
|---|---|
| 401 | Re-mint token, retry once. If it fails again: "Session expired — check your credentials in `.env`" |
| 404 on detail page | Inline "Transit not found" message |
| Network error / 5xx | Toast notification with retry button; table keeps showing last good data |
| Empty results | "No transits match your filters" with a clear-filters link |

---

## Loading States

- Initial table load: shimmer skeleton rows
- "Load more": spinner on button
- Detail page: full-page skeleton while fetching
- Filter change: previous data stays visible (no blank flash)

---

## Out of Scope (Phase 1)

- Vessel lookup pages (`/vessels`, `/vessels/:id`)
- Map view (Mapbox)
- Area overview
- Contacts / live tracking (non-Pull surface, requires separate access)
- WebSocket real-time stream
