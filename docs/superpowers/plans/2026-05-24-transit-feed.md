# Transit Feed Web App — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Phase 1 of the Azimut.ai Pull API reference implementation — a transit feed with filters and a transit detail view, running against the sandbox at `http://localhost:8080`.

**Architecture:** Vite SPA. Auth is OAuth 2.0 client_credentials with credentials in `.env`; the Bearer JWT is held in module-level memory and refreshed automatically. TanStack Query manages all data fetching, caching, and 30-second background refresh. shadcn/ui + Tailwind provide the UI layer. React Router v6 handles two routes: `/` (feed) and `/transits/:id` (detail).

**Tech Stack:** Vite · React 18 · TypeScript · React Router v6 · TanStack Query v5 · shadcn/ui · Tailwind CSS · Vitest · @testing-library/react

---

## File Map

| File | Responsibility |
|---|---|
| `src/types/api.ts` | All TypeScript types from the OpenAPI spec |
| `src/api/auth.ts` | OAuth token minting, in-memory caching, refresh |
| `src/api/client.ts` | Fetch wrapper — token injection, 401 retry, error throwing |
| `src/api/transits.ts` | Typed fetch functions for `/v1/transits/*` |
| `src/api/areas.ts` | Typed fetch function for `/v1/areas` |
| `src/api/vessels.ts` | Typed fetch functions for `/v1/vessels/*` |
| `src/hooks/useTransits.ts` | Infinite/paginated transit list with filters |
| `src/hooks/useTransit.ts` | Single transit query |
| `src/hooks/useTransitSightings.ts` | Sightings for a transit |
| `src/hooks/useAreas.ts` | Area list, cached for the session |
| `src/api/me.ts` | Typed fetch function for `/v1/me` |
| `src/hooks/useMe.ts` | Authenticated principal info (org_id for top bar) |
| `src/components/AnomalyBadge.tsx` | Colored badge per anomaly type |
| `src/components/VesselChip.tsx` | Inline vessel name + flag emoji |
| `src/components/TransitFilters.tsx` | Filter bar (status, anomaly toggle, area, date range, flag) |
| `src/components/TransitTable.tsx` | Paginated transit table with load-more |
| `src/pages/TransitFeed.tsx` | Route `/` — wires filters + table + top bar |
| `src/pages/TransitDetail.tsx` | Route `/transits/:id` — vessel card + sightings list |
| `src/App.tsx` | React Router route definitions |
| `src/main.tsx` | QueryClient, RouterProvider, app entry point |
| `src/lib/utils.ts` | `cn()` utility (created by shadcn init) |
| `src/test/setup.ts` | Vitest/jsdom setup (`@testing-library/jest-dom`) |
| `.env.example` | Credential template |

---

## Task 1: Project scaffold

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html` (via Vite template)
- Create: `tailwind.config.ts`, `postcss.config.js`
- Create: `src/test/setup.ts`
- Create: `.env.example`

- [ ] **Step 1: Scaffold Vite + React + TypeScript project**

```bash
cd /Users/yuvalkassif/Azimut/API-Sandbox
npm create vite@latest . -- --template react-ts
```

When prompted "Current directory is not empty. Remove existing files and continue?" — choose **Yes** (only the openapi.json and docs/ exist, which won't be overwritten).

- [ ] **Step 2: Install core dependencies**

```bash
npm install
npm install react-router-dom @tanstack/react-query
npm install -D vitest @vitest/ui jsdom @testing-library/react @testing-library/jest-dom
```

- [ ] **Step 3: Install and configure Tailwind CSS**

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

Replace `tailwind.config.js` content with:

```js
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: { extend: {} },
  plugins: [],
}
```

Replace `src/index.css` with:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 4: Initialise shadcn/ui**

```bash
npx shadcn@latest init
```

When prompted, select:
- Style: **Default**
- Base color: **Slate**
- CSS variables: **Yes**

This creates `src/lib/utils.ts` (with the `cn` helper) and updates `tailwind.config.js` and `src/index.css`.

- [ ] **Step 5: Add required shadcn components**

```bash
npx shadcn@latest add badge button input select skeleton separator table
```

- [ ] **Step 6: Configure Vitest**

Replace `vite.config.ts` with:

```typescript
/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
  },
})
```

Create `src/test/setup.ts`:

```typescript
import '@testing-library/jest-dom'
```

- [ ] **Step 7: Create `.env.example`**

```bash
cat > .env.example << 'EOF'
VITE_API_BASE_URL=http://localhost:8080
VITE_CLIENT_ID=your_client_id
VITE_CLIENT_SECRET=your_client_secret
EOF
```

Copy it to `.env` and fill in your sandbox credentials:

```bash
cp .env.example .env
```

- [ ] **Step 8: Verify the dev server starts**

```bash
npm run dev
```

Expected: Vite dev server running at `http://localhost:5173` with the default React template page.

- [ ] **Step 9: Verify tests run**

```bash
npx vitest run
```

Expected: "No test files found" (no tests yet — that's fine).

- [ ] **Step 10: Initialise git and commit**

```bash
git init
git add -A
git commit -m "chore: scaffold Vite + React + TS with shadcn and Vitest"
```

---

## Task 2: TypeScript types

**Files:**
- Create: `src/types/api.ts`

- [ ] **Step 1: Create `src/types/api.ts`**

```typescript
// Mirrors the OpenAPI 3.1 schema in openapi.json

export type AidScope = 'global' | 'site' | 'session'
export type AreaType = 'chokepoint' | 'port' | 'anchorage' | 'eez' | 'custom' | 'berth' | 'site'
export type TransitStatus = 'open' | 'closed'
export type TransitKind = 'crossing' | 'entry' | 'exit' | 'internal'
export type Course = 'northbound' | 'southbound' | 'eastbound' | 'westbound'
export type CargoState = 'laden' | 'ballast' | 'partial' | 'unknown'
export type ImageQuality = 'poor' | 'fair' | 'good' | 'excellent'
export type SightingIdentificationMethod = 'visual' | 'ais' | 'human'

export interface LatLon {
  lat: number
  lon: number
}

export interface Dimensions {
  length_m: number | null
  beam_m: number | null
}

export interface Vessel {
  aid: string
  aid_scope: AidScope
  name: string | null
  imo: string | null
  mmsi: string | null
  callsign: string | null
  category: string | null
  subtype: string | null
  flag: string | null
  dimensions: Dimensions | null
  previous_aids: string[]
}

export interface AreaRef {
  id: string
  name: string
  type: string
  centroid: LatLon | null
}

export interface Area {
  area_id: string
  name: string
  type: AreaType
  country: string | null
  timezone: string | null
  lat: number | null
  lon: number | null
}

export interface Anomaly {
  type: string
  detected_at: string | null
}

export interface TransitIdentification {
  confidence: number
  ais_matched: boolean
}

export interface ImageRef {
  href: string | null
  expires_at: string | null
}

export interface TransitSightingsEvidence {
  count: number
  ids: string[]
}

export interface TransitEvidence {
  primary_image: ImageRef | null
  sightings: TransitSightingsEvidence
}

export interface OcrNamePlateSignal {
  text: string | null
  matches_ais_name: boolean | null
  confidence: number | null
}

export interface OcrImoPlateSignal {
  text: string | null
  matches_ais_imo: boolean | null
  confidence: number | null
}

export interface OcrSignals {
  name_plate: OcrNamePlateSignal
  imo_plate: OcrImoPlateSignal
}

export interface LiverySignals {
  hull_main_color: string | null
  hull_accent_color: string | null
  funnel_color: string | null
}

export interface ImageSignals {
  quality: ImageQuality | null
  occluded: boolean | null
}

export interface VisualSignals {
  cargo_state: CargoState
  cargo_state_confidence: number | null
  livery: LiverySignals
  ocr: OcrSignals
  image: ImageSignals
  appearance_flags: string[]
}

export interface Link {
  href: string
}

export interface Transit {
  schema_version: string
  id: string
  status: TransitStatus
  transit_kind: TransitKind
  course: Course | null
  entered_at: string
  exited_at: string | null
  area: AreaRef
  vessel: Vessel
  identification: TransitIdentification
  visual_signals: VisualSignals | null
  anomalies: Anomaly[]
  evidence: TransitEvidence
  created_at: string
  updated_at: string
  links: Record<string, Link>
}

export interface SightingVessel {
  aid: string | null
  aid_scope: AidScope
  name: string | null
  imo: string | null
}

export interface SightingSource {
  camera_id: string | null
  site_id: string | null
  area_id: string | null
}

export interface SightingIdentification {
  confidence: number | null
  ais_matched: boolean
  method: SightingIdentificationMethod
}

export interface Sighting {
  schema_version: string
  id: string
  transit_id: string | null
  vessel: SightingVessel
  sighted_at: string
  source: SightingSource
  identification: SightingIdentification
  position: LatLon | null
  visual_signals: VisualSignals | null
  created_at: string
  updated_at: string
  links: Record<string, Link>
}

export interface PageInfo {
  cursor: string | null
  has_more: boolean
}

export interface Meta {
  request_id: string
  generated_at: string
}

export interface CollectionEnvelope<T> {
  data: T[]
  page: PageInfo
  meta: Meta
}

export interface ItemEnvelope<T> {
  data: T
  meta: Meta
}

export interface TokenResponse {
  access_token: string
  token_type: string
  expires_in: number
  scope: string
}

export interface MeResponse {
  user_id: string | null
  integration_id: string | null
  email: string | null
  org_id: string
  scopes: string[]
  features: string[]
  plan: string
}

export interface TransitFilters {
  area_id?: string
  vessel_aid?: string
  status?: TransitStatus
  has_anomaly?: boolean
  entered_after?: string
  entered_before?: string
  flag?: string
  course?: Course
  min_confidence?: number
  ais_matched?: boolean
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/types/api.ts
git commit -m "feat: add TypeScript types from OpenAPI spec"
```

---

## Task 3: Auth module

**Files:**
- Create: `src/api/auth.ts`
- Test: `src/api/auth.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/api/auth.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getToken, clearToken } from './auth'

const MOCK_ENV = {
  VITE_CLIENT_ID: 'test-id',
  VITE_CLIENT_SECRET: 'test-secret',
  VITE_API_BASE_URL: 'http://localhost:8080',
}

function mockSuccessfulTokenFetch(expiresIn = 3600) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        access_token: 'tok_abc123',
        token_type: 'Bearer',
        expires_in: expiresIn,
        scope: 'transits:read',
      }),
    }),
  )
}

beforeEach(() => {
  Object.entries(MOCK_ENV).forEach(([k, v]) => vi.stubEnv(k, v))
  clearToken()
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('getToken', () => {
  it('mints a token on first call', async () => {
    mockSuccessfulTokenFetch()
    const token = await getToken()
    expect(token).toBe('tok_abc123')
    expect(fetch).toHaveBeenCalledOnce()
  })

  it('returns cached token on second call without hitting the network', async () => {
    mockSuccessfulTokenFetch()
    await getToken()
    await getToken()
    expect(fetch).toHaveBeenCalledOnce()
  })

  it('deduplicates concurrent inflight requests', async () => {
    mockSuccessfulTokenFetch()
    const [a, b] = await Promise.all([getToken(), getToken()])
    expect(a).toBe('tok_abc123')
    expect(b).toBe('tok_abc123')
    expect(fetch).toHaveBeenCalledOnce()
  })

  it('throws when the token endpoint returns non-ok', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 401 }),
    )
    await expect(getToken()).rejects.toThrow('Failed to mint token: 401')
  })
})

describe('clearToken', () => {
  it('forces a fresh mint on the next call', async () => {
    mockSuccessfulTokenFetch()
    await getToken()
    clearToken()
    await getToken()
    expect(fetch).toHaveBeenCalledTimes(2)
  })
})
```

- [ ] **Step 2: Run tests — expect failure**

```bash
npx vitest run src/api/auth.test.ts
```

Expected: FAIL — `Cannot find module './auth'`

- [ ] **Step 3: Implement `src/api/auth.ts`**

```typescript
import type { TokenResponse } from '../types/api'

interface TokenState {
  token: string
  expiresAt: number // Unix ms
}

let state: TokenState | null = null
let inflightPromise: Promise<string> | null = null

export async function getToken(): Promise<string> {
  if (state && Date.now() < state.expiresAt) return state.token
  if (inflightPromise) return inflightPromise
  inflightPromise = mintToken().finally(() => {
    inflightPromise = null
  })
  return inflightPromise
}

export function clearToken(): void {
  state = null
}

async function mintToken(): Promise<string> {
  const clientId = import.meta.env.VITE_CLIENT_ID
  const clientSecret = import.meta.env.VITE_CLIENT_SECRET
  const baseUrl = import.meta.env.VITE_API_BASE_URL

  const credentials = btoa(`${clientId}:${clientSecret}`)
  const res = await fetch(`${baseUrl}/v1/oauth/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })

  if (!res.ok) throw new Error(`Failed to mint token: ${res.status}`)

  const data: TokenResponse = await res.json()
  // Refresh 60 s before actual expiry so requests never race the deadline
  state = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  }
  return state.token
}
```

- [ ] **Step 4: Run tests — expect pass**

```bash
npx vitest run src/api/auth.test.ts
```

Expected: PASS — 5 tests.

- [ ] **Step 5: Commit**

```bash
git add src/api/auth.ts src/api/auth.test.ts
git commit -m "feat: add OAuth auth module with token caching"
```

---

## Task 4: API client

**Files:**
- Create: `src/api/client.ts`
- Test: `src/api/client.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/api/client.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { apiClient, ApiError } from './client'

vi.mock('./auth', () => ({
  getToken: vi.fn().mockResolvedValue('tok_good'),
  clearToken: vi.fn(),
}))

import { getToken, clearToken } from './auth'

beforeEach(() => {
  vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:8080')
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('apiClient.request', () => {
  it('injects Bearer token and returns parsed JSON', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ data: [] }),
      }),
    )

    const result = await apiClient.request('/v1/transits')
    expect(result).toEqual({ data: [] })
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8080/v1/transits',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer tok_good' }),
      }),
    )
  })

  it('clears token and retries once on 401', async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 401, json: async () => ({}) })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ retried: true }) })
    vi.stubGlobal('fetch', mockFetch)

    const result = await apiClient.request('/v1/transits')
    expect(clearToken).toHaveBeenCalledOnce()
    expect(mockFetch).toHaveBeenCalledTimes(2)
    expect(result).toEqual({ retried: true })
  })

  it('throws ApiError on 404', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ detail: 'not found' }),
      }),
    )

    await expect(apiClient.request('/v1/transits/bad')).rejects.toThrow(ApiError)
    await expect(apiClient.request('/v1/transits/bad')).rejects.toMatchObject({ status: 404 })
  })
})
```

- [ ] **Step 2: Run tests — expect failure**

```bash
npx vitest run src/api/client.test.ts
```

Expected: FAIL — `Cannot find module './client'`

- [ ] **Step 3: Implement `src/api/client.ts`**

```typescript
import { getToken, clearToken } from './auth'

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: unknown,
  ) {
    super(`API error ${status}`)
    this.name = 'ApiError'
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const baseUrl = import.meta.env.VITE_API_BASE_URL
  const token = await getToken()

  const res = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: { Authorization: `Bearer ${token}`, ...options?.headers },
  })

  if (res.status === 401) {
    clearToken()
    const freshToken = await getToken()
    const retry = await fetch(`${baseUrl}${path}`, {
      ...options,
      headers: { Authorization: `Bearer ${freshToken}`, ...options?.headers },
    })
    if (!retry.ok) throw new ApiError(retry.status, await retry.json().catch(() => null))
    return retry.json()
  }

  if (!res.ok) throw new ApiError(res.status, await res.json().catch(() => null))
  return res.json()
}

export const apiClient = { request }
```

- [ ] **Step 4: Run tests — expect pass**

```bash
npx vitest run src/api/client.test.ts
```

Expected: PASS — 3 tests.

- [ ] **Step 5: Commit**

```bash
git add src/api/client.ts src/api/client.test.ts
git commit -m "feat: add API client with token injection and 401 retry"
```

---

## Task 5: API query functions

**Files:**
- Create: `src/api/transits.ts`
- Create: `src/api/areas.ts`
- Create: `src/api/vessels.ts`
- Test: `src/api/transits.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/api/transits.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchTransits, fetchTransit, fetchTransitSightings } from './transits'

vi.mock('./client', () => ({
  apiClient: { request: vi.fn() },
  ApiError: class ApiError extends Error {},
}))

import { apiClient } from './client'

beforeEach(() => vi.mocked(apiClient.request).mockResolvedValue({}))

describe('fetchTransits', () => {
  it('calls /v1/transits with no params when filters are empty', async () => {
    await fetchTransits()
    expect(apiClient.request).toHaveBeenCalledWith('/v1/transits?limit=50')
  })

  it('appends filter params to the URL', async () => {
    await fetchTransits({ status: 'open', has_anomaly: true, limit: 20 })
    expect(apiClient.request).toHaveBeenCalledWith(
      '/v1/transits?status=open&has_anomaly=true&limit=20',
    )
  })

  it('omits undefined and empty-string params', async () => {
    await fetchTransits({ status: undefined, flag: '' })
    expect(apiClient.request).toHaveBeenCalledWith('/v1/transits?limit=50')
  })
})

describe('fetchTransit', () => {
  it('calls the correct path', async () => {
    await fetchTransit('tr_17')
    expect(apiClient.request).toHaveBeenCalledWith('/v1/transits/tr_17')
  })
})

describe('fetchTransitSightings', () => {
  it('calls the correct path', async () => {
    await fetchTransitSightings('tr_17')
    expect(apiClient.request).toHaveBeenCalledWith('/v1/transits/tr_17/sightings')
  })
})
```

- [ ] **Step 2: Run tests — expect failure**

```bash
npx vitest run src/api/transits.test.ts
```

Expected: FAIL — `Cannot find module './transits'`

- [ ] **Step 3: Implement `src/api/transits.ts`**

```typescript
import { apiClient } from './client'
import type { CollectionEnvelope, ItemEnvelope, Transit, Sighting, TransitFilters } from '../types/api'

export interface TransitsParams extends TransitFilters {
  limit?: number
  cursor?: string
}

export async function fetchTransits(params: TransitsParams = {}): Promise<CollectionEnvelope<Transit>> {
  const { limit = 50, ...rest } = params
  const search = new URLSearchParams()
  Object.entries({ ...rest, limit }).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') search.set(k, String(v))
  })
  return apiClient.request(`/v1/transits?${search.toString()}`)
}

export async function fetchTransit(id: string): Promise<ItemEnvelope<Transit>> {
  return apiClient.request(`/v1/transits/${id}`)
}

export async function fetchTransitSightings(id: string): Promise<CollectionEnvelope<Sighting>> {
  return apiClient.request(`/v1/transits/${id}/sightings`)
}
```

- [ ] **Step 4: Run tests — expect pass**

```bash
npx vitest run src/api/transits.test.ts
```

Expected: PASS — 5 tests.

- [ ] **Step 5: Create `src/api/areas.ts`**

```typescript
import { apiClient } from './client'
import type { CollectionEnvelope, Area } from '../types/api'

export async function fetchAreas(): Promise<CollectionEnvelope<Area>> {
  return apiClient.request('/v1/areas?limit=500')
}
```

- [ ] **Step 6: Create `src/api/vessels.ts`**

```typescript
import { apiClient } from './client'
import type { CollectionEnvelope, ItemEnvelope, Vessel } from '../types/api'

export interface VesselsParams {
  q?: string
  imo?: string
  mmsi?: string
  flag?: string
  cursor?: string
  limit?: number
}

export async function fetchVessels(params: VesselsParams = {}): Promise<CollectionEnvelope<Vessel>> {
  const { limit = 50, ...rest } = params
  const search = new URLSearchParams()
  Object.entries({ ...rest, limit }).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') search.set(k, String(v))
  })
  return apiClient.request(`/v1/vessels?${search.toString()}`)
}

export async function fetchVessel(aid: string): Promise<ItemEnvelope<Vessel>> {
  return apiClient.request(`/v1/vessels/${aid}`)
}
```

- [ ] **Step 7: Commit**

```bash
git add src/api/transits.ts src/api/transits.test.ts src/api/areas.ts src/api/vessels.ts
git commit -m "feat: add typed API query functions for transits, areas, vessels"
```

---

## Task 6: TanStack Query hooks

**Files:**
- Create: `src/hooks/useTransits.ts`
- Create: `src/hooks/useTransit.ts`
- Create: `src/hooks/useTransitSightings.ts`
- Create: `src/hooks/useAreas.ts`

No unit tests for hooks — they are thin wrappers over TanStack Query and are exercised through the page-level smoke tests in Tasks 10–11.

- [ ] **Step 1: Create `src/hooks/useTransits.ts`**

```typescript
import { useInfiniteQuery } from '@tanstack/react-query'
import { fetchTransits, type TransitsParams } from '../api/transits'

export type TransitFiltersInput = Omit<TransitsParams, 'cursor' | 'limit'>

export function useTransits(filters: TransitFiltersInput = {}) {
  return useInfiniteQuery({
    queryKey: ['transits', filters],
    queryFn: ({ pageParam }) =>
      fetchTransits({ ...filters, cursor: pageParam as string | undefined, limit: 50 }),
    getNextPageParam: (lastPage) =>
      lastPage.page.has_more ? lastPage.page.cursor : undefined,
    initialPageParam: undefined as string | undefined,
    refetchInterval: 30_000,
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  })
}
```

- [ ] **Step 2: Create `src/hooks/useTransit.ts`**

```typescript
import { useQuery } from '@tanstack/react-query'
import { fetchTransit } from '../api/transits'

export function useTransit(id: string) {
  return useQuery({
    queryKey: ['transit', id],
    queryFn: () => fetchTransit(id),
    staleTime: 30_000,
    enabled: Boolean(id),
  })
}
```

- [ ] **Step 3: Create `src/hooks/useTransitSightings.ts`**

```typescript
import { useQuery } from '@tanstack/react-query'
import { fetchTransitSightings } from '../api/transits'

export function useTransitSightings(id: string) {
  return useQuery({
    queryKey: ['transit-sightings', id],
    queryFn: () => fetchTransitSightings(id),
    staleTime: 30_000,
    enabled: Boolean(id),
  })
}
```

- [ ] **Step 4: Create `src/hooks/useAreas.ts`**

```typescript
import { useQuery } from '@tanstack/react-query'
import { fetchAreas } from '../api/areas'

export function useAreas() {
  return useQuery({
    queryKey: ['areas'],
    queryFn: fetchAreas,
    staleTime: Infinity, // Areas don't change during a session
  })
}
```

- [ ] **Step 5: Create `src/api/me.ts`**

```typescript
import { apiClient } from './client'
import type { MeResponse } from '../types/api'

export async function fetchMe(): Promise<MeResponse> {
  return apiClient.request('/v1/me')
}
```

- [ ] **Step 6: Create `src/hooks/useMe.ts`**

```typescript
import { useQuery } from '@tanstack/react-query'
import { fetchMe } from '../api/me'

export function useMe() {
  return useQuery({
    queryKey: ['me'],
    queryFn: fetchMe,
    staleTime: Infinity,
  })
}
```

- [ ] **Step 7: Commit**

```bash
git add src/hooks/ src/api/me.ts
git commit -m "feat: add TanStack Query hooks for transits, areas, and me"
```

---

## Task 7: AnomalyBadge and VesselChip components

**Files:**
- Create: `src/components/AnomalyBadge.tsx`
- Create: `src/components/VesselChip.tsx`
- Test: `src/components/AnomalyBadge.test.tsx`
- Test: `src/components/VesselChip.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `src/components/AnomalyBadge.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { AnomalyBadge } from './AnomalyBadge'

describe('AnomalyBadge', () => {
  it('renders anomaly type with underscores replaced by spaces', () => {
    render(<AnomalyBadge anomaly={{ type: 'ais_dark', detected_at: null }} />)
    expect(screen.getByText('ais dark')).toBeInTheDocument()
  })

  it('uses red styling for ais_dark', () => {
    render(<AnomalyBadge anomaly={{ type: 'ais_dark', detected_at: null }} />)
    expect(screen.getByText('ais dark')).toHaveClass('bg-red-100')
  })

  it('uses amber styling for loitering', () => {
    render(<AnomalyBadge anomaly={{ type: 'loitering', detected_at: null }} />)
    expect(screen.getByText('loitering')).toHaveClass('bg-amber-100')
  })
})
```

Create `src/components/VesselChip.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { VesselChip } from './VesselChip'
import type { Vessel } from '../types/api'

const baseVessel: Vessel = {
  aid: 'aid_v_001',
  aid_scope: 'global',
  name: 'MS HAMBURG EXPRESS',
  imo: '9301234',
  mmsi: '211281000',
  callsign: 'DHHE',
  category: 'merchant',
  subtype: 'containers',
  flag: 'DE',
  dimensions: null,
  previous_aids: [],
}

describe('VesselChip', () => {
  it('renders the vessel name', () => {
    render(<VesselChip vessel={baseVessel} />)
    expect(screen.getByText('MS HAMBURG EXPRESS')).toBeInTheDocument()
  })

  it('falls back to IMO when name is null', () => {
    render(<VesselChip vessel={{ ...baseVessel, name: null }} />)
    expect(screen.getByText('9301234')).toBeInTheDocument()
  })

  it('falls back to AID when name and IMO are null', () => {
    render(<VesselChip vessel={{ ...baseVessel, name: null, imo: null }} />)
    expect(screen.getByText('aid_v_001')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests — expect failure**

```bash
npx vitest run src/components/AnomalyBadge.test.tsx src/components/VesselChip.test.tsx
```

Expected: FAIL — modules not found.

- [ ] **Step 3: Implement `src/components/AnomalyBadge.tsx`**

```tsx
import { cn } from '../lib/utils'
import type { Anomaly } from '../types/api'

const RED_TYPES = new Set(['ais_dark', 'identity_mismatch', 'name_repaint', 'flag_swap'])

interface AnomalyBadgeProps {
  anomaly: Anomaly
}

export function AnomalyBadge({ anomaly }: AnomalyBadgeProps) {
  const label = anomaly.type.replace(/_/g, ' ')
  const isRed = RED_TYPES.has(anomaly.type)
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        isRed ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800',
      )}
    >
      {label}
    </span>
  )
}
```

- [ ] **Step 4: Implement `src/components/VesselChip.tsx`**

```tsx
import type { Vessel } from '../types/api'

interface VesselChipProps {
  vessel: Vessel
}

export function VesselChip({ vessel }: VesselChipProps) {
  const label = vessel.name ?? vessel.imo ?? vessel.aid
  return (
    <span className="flex items-center gap-1.5 min-w-0">
      {vessel.flag && <span className="shrink-0">{flagEmoji(vessel.flag)}</span>}
      <span className="truncate font-medium">{label}</span>
    </span>
  )
}

function flagEmoji(code: string): string {
  return code
    .toUpperCase()
    .split('')
    .map((c) => String.fromCodePoint(127397 + c.charCodeAt(0)))
    .join('')
}
```

- [ ] **Step 5: Run tests — expect pass**

```bash
npx vitest run src/components/AnomalyBadge.test.tsx src/components/VesselChip.test.tsx
```

Expected: PASS — 6 tests.

- [ ] **Step 6: Commit**

```bash
git add src/components/AnomalyBadge.tsx src/components/AnomalyBadge.test.tsx \
        src/components/VesselChip.tsx src/components/VesselChip.test.tsx
git commit -m "feat: add AnomalyBadge and VesselChip components"
```

---

## Task 8: TransitFilters component

**Files:**
- Create: `src/components/TransitFilters.tsx`

- [ ] **Step 1: Create `src/components/TransitFilters.tsx`**

```tsx
import { Button } from './ui/button'
import { Input } from './ui/input'
import { useAreas } from '../hooks/useAreas'
import type { TransitFiltersInput } from '../hooks/useTransits'
import type { TransitStatus } from '../types/api'

interface TransitFiltersProps {
  filters: TransitFiltersInput
  onChange: (filters: TransitFiltersInput) => void
}

export function TransitFilters({ filters, onChange }: TransitFiltersProps) {
  const { data: areasData } = useAreas()
  const areas = areasData?.data ?? []

  function set(patch: Partial<TransitFiltersInput>) {
    onChange({ ...filters, ...patch })
  }

  function clear() {
    onChange({})
  }

  return (
    <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-b bg-muted/30 text-sm">
      {/* Status */}
      <select
        className="h-8 rounded-md border bg-background px-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
        value={filters.status ?? ''}
        onChange={(e) =>
          set({ status: (e.target.value as TransitStatus) || undefined })
        }
      >
        <option value="">All statuses</option>
        <option value="open">Open</option>
        <option value="closed">Closed</option>
      </select>

      {/* Anomalies toggle */}
      <label className="flex items-center gap-1.5 cursor-pointer select-none">
        <input
          type="checkbox"
          className="accent-primary"
          checked={filters.has_anomaly ?? false}
          onChange={(e) => set({ has_anomaly: e.target.checked || undefined })}
        />
        Anomalies only
      </label>

      {/* Area */}
      <select
        className="h-8 rounded-md border bg-background px-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
        value={filters.area_id ?? ''}
        onChange={(e) => set({ area_id: e.target.value || undefined })}
      >
        <option value="">All areas</option>
        {areas.map((a) => (
          <option key={a.area_id} value={a.area_id}>
            {a.name}
          </option>
        ))}
      </select>

      {/* Entered after */}
      <input
        type="date"
        className="h-8 rounded-md border bg-background px-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
        value={filters.entered_after ? filters.entered_after.slice(0, 10) : ''}
        onChange={(e) =>
          set({ entered_after: e.target.value ? e.target.value + 'T00:00:00Z' : undefined })
        }
      />

      {/* Entered before */}
      <input
        type="date"
        className="h-8 rounded-md border bg-background px-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
        value={filters.entered_before ? filters.entered_before.slice(0, 10) : ''}
        onChange={(e) =>
          set({ entered_before: e.target.value ? e.target.value + 'T23:59:59Z' : undefined })
        }
      />

      {/* Flag */}
      <Input
        className="h-8 w-24 uppercase"
        placeholder="Flag (DE…)"
        maxLength={2}
        value={filters.flag ?? ''}
        onChange={(e) => set({ flag: e.target.value.toUpperCase() || undefined })}
      />

      {/* Clear */}
      <Button variant="ghost" size="sm" onClick={clear} className="ml-auto">
        Clear filters
      </Button>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/TransitFilters.tsx
git commit -m "feat: add TransitFilters component"
```

---

## Task 9: TransitTable component

**Files:**
- Create: `src/components/TransitTable.tsx`
- Test: `src/components/TransitTable.test.tsx`

- [ ] **Step 1: Write failing test**

Create `src/components/TransitTable.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { TransitTable } from './TransitTable'
import type { Transit } from '../types/api'

const mockTransit: Transit = {
  schema_version: '1.0',
  id: 'tr_17',
  status: 'closed',
  transit_kind: 'crossing',
  course: 'westbound',
  entered_at: '2026-05-18T08:14:22Z',
  exited_at: '2026-05-18T08:31:07Z',
  area: { id: 'ar_42', name: 'Strait of Gibraltar', type: 'chokepoint', centroid: null },
  vessel: {
    aid: 'aid_v_001',
    aid_scope: 'global',
    name: 'MS HAMBURG EXPRESS',
    imo: '9301234',
    mmsi: null,
    callsign: null,
    category: 'merchant',
    subtype: 'containers',
    flag: 'DE',
    dimensions: null,
    previous_aids: [],
  },
  identification: { confidence: 0.97, ais_matched: true },
  visual_signals: null,
  anomalies: [],
  evidence: { primary_image: null, sightings: { count: 23, ids: [] } },
  created_at: '2026-05-18T08:14:25Z',
  updated_at: '2026-05-18T08:31:09Z',
  links: {},
}

function wrap(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>)
}

describe('TransitTable', () => {
  it('renders vessel name', () => {
    wrap(
      <TransitTable
        transits={[mockTransit]}
        isLoading={false}
        isFetchingNextPage={false}
        hasNextPage={false}
        onLoadMore={() => {}}
      />,
    )
    expect(screen.getByText('MS HAMBURG EXPRESS')).toBeInTheDocument()
  })

  it('renders area name', () => {
    wrap(
      <TransitTable
        transits={[mockTransit]}
        isLoading={false}
        isFetchingNextPage={false}
        hasNextPage={false}
        onLoadMore={() => {}}
      />,
    )
    expect(screen.getByText('Strait of Gibraltar')).toBeInTheDocument()
  })

  it('shows skeleton rows when loading', () => {
    wrap(
      <TransitTable
        transits={[]}
        isLoading={true}
        isFetchingNextPage={false}
        hasNextPage={false}
        onLoadMore={() => {}}
      />,
    )
    expect(screen.getAllByRole('row').length).toBeGreaterThan(1)
  })
})
```

- [ ] **Step 2: Run tests — expect failure**

```bash
npx vitest run src/components/TransitTable.test.tsx
```

Expected: FAIL — `Cannot find module './TransitTable'`

- [ ] **Step 3: Implement `src/components/TransitTable.tsx`**

```tsx
import { useNavigate } from 'react-router-dom'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from './ui/table'
import { Button } from './ui/button'
import { Skeleton } from './ui/skeleton'
import { AnomalyBadge } from './AnomalyBadge'
import { VesselChip } from './VesselChip'
import { cn } from '../lib/utils'
import type { Transit } from '../types/api'

interface TransitTableProps {
  transits: Transit[]
  isLoading: boolean
  isFetchingNextPage: boolean
  hasNextPage: boolean
  onLoadMore: () => void
}

export function TransitTable({
  transits,
  isLoading,
  isFetchingNextPage,
  hasNextPage,
  onLoadMore,
}: TransitTableProps) {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col gap-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Vessel</TableHead>
            <TableHead>Area</TableHead>
            <TableHead>Entered</TableHead>
            <TableHead>Exited</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Course</TableHead>
            <TableHead>Confidence</TableHead>
            <TableHead>Anomalies</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 8 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            : transits.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-16 text-center text-muted-foreground">
                    No transits match your filters.
                  </TableCell>
                </TableRow>
              )
            : transits.map((t) => (
                <TableRow
                  key={t.id}
                  className={cn(
                    'cursor-pointer hover:bg-muted/50',
                    t.status === 'open' && 'border-l-2 border-l-green-500',
                  )}
                  onClick={() => navigate(`/transits/${t.id}`)}
                >
                  <TableCell>
                    <VesselChip vessel={t.vessel} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">{t.area.name}</TableCell>
                  <TableCell className="whitespace-nowrap text-sm">
                    {formatTime(t.entered_at)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                    {t.exited_at ? formatTime(t.exited_at) : '—'}
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                        t.status === 'open'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-slate-100 text-slate-600',
                      )}
                    >
                      {t.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground capitalize">
                    {t.course ?? '—'}
                  </TableCell>
                  <TableCell className="text-sm">
                    {Math.round(t.identification.confidence * 100)}%
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {t.anomalies.map((a, i) => (
                        <AnomalyBadge key={i} anomaly={a} />
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
        </TableBody>
      </Table>

      {hasNextPage && (
        <div className="flex justify-center pb-4">
          <Button
            variant="outline"
            onClick={onLoadMore}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? 'Loading…' : 'Load more'}
          </Button>
        </div>
      )}
    </div>
  )
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
```

- [ ] **Step 4: Run tests — expect pass**

```bash
npx vitest run src/components/TransitTable.test.tsx
```

Expected: PASS — 3 tests.

- [ ] **Step 5: Commit**

```bash
git add src/components/TransitTable.tsx src/components/TransitTable.test.tsx
git commit -m "feat: add TransitTable component with skeleton and pagination"
```

---

## Task 10: TransitFeed page

**Files:**
- Create: `src/pages/TransitFeed.tsx`
- Test: `src/pages/TransitFeed.test.tsx`

- [ ] **Step 1: Write failing smoke test**

Create `src/pages/TransitFeed.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TransitFeed } from './TransitFeed'

vi.mock('../hooks/useTransits', () => ({
  useTransits: () => ({
    data: undefined,
    isLoading: true,
    isFetchingNextPage: false,
    hasNextPage: false,
    fetchNextPage: vi.fn(),
  }),
}))

vi.mock('../hooks/useAreas', () => ({
  useAreas: () => ({ data: undefined }),
}))

vi.mock('../hooks/useMe', () => ({
  useMe: () => ({ data: undefined }),
}))

function wrap(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('TransitFeed', () => {
  it('renders without crashing', () => {
    wrap(<TransitFeed />)
    expect(screen.getByText(/transits/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test — expect failure**

```bash
npx vitest run src/pages/TransitFeed.test.tsx
```

Expected: FAIL — `Cannot find module '../pages/TransitFeed'`

- [ ] **Step 3: Implement `src/pages/TransitFeed.tsx`**

```tsx
import { useState } from 'react'
import { useTransits, type TransitFiltersInput } from '../hooks/useTransits'
import { useMe } from '../hooks/useMe'
import { TransitFilters } from '../components/TransitFilters'
import { TransitTable } from '../components/TransitTable'

export function TransitFeed() {
  const [filters, setFilters] = useState<TransitFiltersInput>({})
  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useTransits(filters)
  const { data: me } = useMe()

  const transits = data?.pages.flatMap((p) => p.data) ?? []
  const hasOpenTransits = transits.some((t) => t.status === 'open')

  return (
    <div className="flex flex-col min-h-screen">
      {/* Top bar */}
      <header className="flex items-center gap-3 px-6 py-4 border-b bg-background">
        <h1 className="text-lg font-semibold tracking-tight">Transits</h1>
        {me && (
          <span className="text-sm text-muted-foreground">{me.org_id}</span>
        )}
        {hasOpenTransits && (
          <span className="flex items-center gap-1.5 text-xs text-green-700 ml-auto">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            Live
          </span>
        )}
      </header>

      {/* Filters */}
      <TransitFilters filters={filters} onChange={setFilters} />

      {/* Table */}
      <main className="flex-1 overflow-auto">
        <TransitTable
          transits={transits}
          isLoading={isLoading}
          isFetchingNextPage={isFetchingNextPage}
          hasNextPage={Boolean(hasNextPage)}
          onLoadMore={() => fetchNextPage()}
        />
      </main>
    </div>
  )
}
```

- [ ] **Step 4: Run test — expect pass**

```bash
npx vitest run src/pages/TransitFeed.test.tsx
```

Expected: PASS — 1 test.

- [ ] **Step 5: Commit**

```bash
git add src/pages/TransitFeed.tsx src/pages/TransitFeed.test.tsx
git commit -m "feat: add TransitFeed page"
```

---

## Task 11: TransitDetail page

**Files:**
- Create: `src/pages/TransitDetail.tsx`

- [ ] **Step 1: Create `src/pages/TransitDetail.tsx`**

```tsx
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
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/TransitDetail.tsx
git commit -m "feat: add TransitDetail page with vessel card and sightings"
```

---

## Task 12: App shell and routing

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/main.tsx`

- [ ] **Step 1: Replace `src/App.tsx`**

```tsx
import { Routes, Route } from 'react-router-dom'
import { TransitFeed } from './pages/TransitFeed'
import { TransitDetail } from './pages/TransitDetail'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<TransitFeed />} />
      <Route path="/transits/:id" element={<TransitDetail />} />
    </Routes>
  )
}
```

- [ ] **Step 2: Replace `src/main.tsx`**

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: unknown) => {
        // Don't retry on 404 — the resource genuinely doesn't exist
        if ((error as { status?: number })?.status === 404) return false
        return failureCount < 2
      },
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
)
```

- [ ] **Step 3: Remove generated boilerplate**

Delete the files Vite generated that are no longer needed:

```bash
rm -f src/App.css src/assets/react.svg public/vite.svg
```

Update `index.html` title:

```html
<!-- Change <title> to: -->
<title>Azimut Transit Feed</title>
```

- [ ] **Step 4: Run all tests**

```bash
npx vitest run
```

Expected: all tests pass.

- [ ] **Step 5: Start dev server and verify the app**

```bash
npm run dev
```

Open `http://localhost:5173` in a browser. Verify:
- Transit feed loads and shows a table (or skeleton if the sandbox isn't running)
- Filters render in the filter bar
- Clicking a transit row navigates to `/transits/:id`
- Detail page shows vessel card and sightings (or appropriate loading/error state)

- [ ] **Step 6: Final commit**

```bash
git add src/App.tsx src/main.tsx index.html
git commit -m "feat: wire up routing and QueryClient — Phase 1 complete"
```
