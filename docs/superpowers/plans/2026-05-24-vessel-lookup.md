# Vessel Lookup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Phase 2 vessel-centric views — a searchable vessel directory (`/vessels`) and a vessel detail page (`/vessels/:aid`) with a gantt-style transit timeline — plus shared navigation and bidirectional cross-linking with the existing transit views.

**Architecture:** Eight tasks in dependency order. Tasks 1–2 build the data layer (API function + hooks, shared VesselCard component). Tasks 3–5 build the new UI components (NavBar, VesselTable+Filters, TransitTimeline). Tasks 6–7 assemble the two new pages. Task 8 wires up routes and cross-links in existing files. Every task commits independently; the app remains runnable throughout.

**Tech Stack:** Vite · React 18 · TypeScript · React Router v6 · TanStack Query v5 · shadcn/ui · Tailwind CSS · Vitest · @testing-library/react

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `src/api/vessels.ts` | Modify | Add `fetchVesselTransits` |
| `src/api/vessels.test.ts` | Create | Tests for `fetchVesselTransits` |
| `src/hooks/useVessels.ts` | Create | Infinite query for vessel list |
| `src/hooks/useVessel.ts` | Create | Single vessel query |
| `src/hooks/useVesselTransits.ts` | Create | Paginated transit history for vessel |
| `src/components/VesselCard.tsx` | Create | Extracted vessel identity card (shared) |
| `src/components/VesselCard.test.tsx` | Create | Tests for VesselCard |
| `src/components/NavBar.tsx` | Create | Shared top nav (Transits + Vessels links) |
| `src/components/NavBar.test.tsx` | Create | Tests for NavBar |
| `src/components/VesselFilters.tsx` | Create | Search + flag filter bar |
| `src/components/VesselTable.tsx` | Create | Vessel list table with load-more |
| `src/components/VesselTable.test.tsx` | Create | Tests for VesselTable |
| `src/components/TransitTimeline.tsx` | Create | Gantt-style transit timeline |
| `src/components/TransitTimeline.test.tsx` | Create | Tests for TransitTimeline |
| `src/pages/VesselList.tsx` | Create | Route `/vessels` |
| `src/pages/VesselList.test.tsx` | Create | Smoke test for VesselList |
| `src/pages/VesselDetail.tsx` | Create | Route `/vessels/:aid` |
| `src/pages/VesselDetail.test.tsx` | Create | Smoke test for VesselDetail |
| `src/App.tsx` | Modify | Add `/vessels` and `/vessels/:aid` routes |
| `src/pages/TransitFeed.tsx` | Modify | Replace inline header with `<NavBar>` |
| `src/pages/TransitDetail.tsx` | Modify | Use `<VesselCard>`, add link to vessel |
| `src/components/TransitTable.tsx` | Modify | Wrap VesselChip in link to `/vessels/:aid` |

---

## Task 1: Vessel API function + hooks

**Files:**
- Modify: `src/api/vessels.ts`
- Create: `src/api/vessels.test.ts`
- Create: `src/hooks/useVessels.ts`
- Create: `src/hooks/useVessel.ts`
- Create: `src/hooks/useVesselTransits.ts`

- [ ] **Step 1: Write failing tests for `fetchVesselTransits`**

Create `src/api/vessels.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchVesselTransits } from './vessels'

vi.mock('./client', () => ({
  apiClient: { request: vi.fn() },
  ApiError: class ApiError extends Error {},
}))

import { apiClient } from './client'

beforeEach(() => vi.mocked(apiClient.request).mockResolvedValue({}))

describe('fetchVesselTransits', () => {
  it('calls the correct path with default limit', async () => {
    await fetchVesselTransits('aid_v_001')
    expect(apiClient.request).toHaveBeenCalledWith(
      '/v1/vessels/aid_v_001/transits?limit=15',
    )
  })

  it('includes cursor when provided', async () => {
    await fetchVesselTransits('aid_v_001', { cursor: 'tok_abc' })
    expect(apiClient.request).toHaveBeenCalledWith(
      '/v1/vessels/aid_v_001/transits?limit=15&cursor=tok_abc',
    )
  })

  it('respects a custom limit', async () => {
    await fetchVesselTransits('aid_v_001', { limit: 5 })
    expect(apiClient.request).toHaveBeenCalledWith(
      '/v1/vessels/aid_v_001/transits?limit=5',
    )
  })
})
```

- [ ] **Step 2: Run tests — expect failure**

```bash
cd /Users/yuvalkassif/Azimut/API-Sandbox && npx vitest run src/api/vessels.test.ts
```

Expected: FAIL — `fetchVesselTransits is not a function`

- [ ] **Step 3: Add `fetchVesselTransits` to `src/api/vessels.ts`**

Add this import at the top of the file (Transit is already in types/api.ts):

```typescript
import { apiClient } from './client'
import type { CollectionEnvelope, ItemEnvelope, Vessel, Transit } from '../types/api'
```

Then add this function at the bottom of `src/api/vessels.ts`:

```typescript
export async function fetchVesselTransits(
  aid: string,
  params: { cursor?: string; limit?: number } = {},
): Promise<CollectionEnvelope<Transit>> {
  const { limit = 15, cursor } = params
  const search = new URLSearchParams()
  search.set('limit', String(limit))
  if (cursor) search.set('cursor', cursor)
  return apiClient.request(`/v1/vessels/${aid}/transits?${search.toString()}`)
}
```

- [ ] **Step 4: Run tests — expect pass**

```bash
cd /Users/yuvalkassif/Azimut/API-Sandbox && npx vitest run src/api/vessels.test.ts
```

Expected: PASS — 3 tests.

- [ ] **Step 5: Create `src/hooks/useVessels.ts`**

```typescript
import { useInfiniteQuery } from '@tanstack/react-query'
import { fetchVessels, type VesselsParams } from '../api/vessels'

export type VesselFiltersInput = Omit<VesselsParams, 'cursor' | 'limit'>

export function useVessels(filters: VesselFiltersInput = {}) {
  return useInfiniteQuery({
    queryKey: ['vessels', filters],
    queryFn: ({ pageParam }) =>
      fetchVessels({ ...filters, cursor: pageParam as string | undefined, limit: 50 }),
    getNextPageParam: (lastPage) =>
      lastPage.page.has_more ? (lastPage.page.cursor ?? undefined) : undefined,
    initialPageParam: undefined as string | undefined,
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  })
}
```

- [ ] **Step 6: Create `src/hooks/useVessel.ts`**

```typescript
import { useQuery } from '@tanstack/react-query'
import { fetchVessel } from '../api/vessels'

export function useVessel(aid: string) {
  return useQuery({
    queryKey: ['vessel', aid],
    queryFn: () => fetchVessel(aid),
    staleTime: 30_000,
    enabled: Boolean(aid),
  })
}
```

- [ ] **Step 7: Create `src/hooks/useVesselTransits.ts`**

```typescript
import { useQuery } from '@tanstack/react-query'
import { fetchVesselTransits } from '../api/vessels'

export function useVesselTransits(aid: string, cursor?: string) {
  return useQuery({
    queryKey: ['vessel-transits', aid, cursor],
    queryFn: () => fetchVesselTransits(aid, { cursor, limit: 15 }),
    staleTime: 30_000,
    enabled: Boolean(aid),
    placeholderData: (prev) => prev,
  })
}
```

- [ ] **Step 8: Verify TypeScript compiles**

```bash
cd /Users/yuvalkassif/Azimut/API-Sandbox && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 9: Commit**

```bash
cd /Users/yuvalkassif/Azimut/API-Sandbox && git add src/api/vessels.ts src/api/vessels.test.ts src/hooks/useVessels.ts src/hooks/useVessel.ts src/hooks/useVesselTransits.ts
git commit -m "feat: add vessel hooks and fetchVesselTransits"
```

---

## Task 2: VesselCard component (extract from TransitDetail)

**Files:**
- Create: `src/components/VesselCard.tsx`
- Create: `src/components/VesselCard.test.tsx`
- Modify: `src/pages/TransitDetail.tsx`

The `VesselCard` function currently lives inside `TransitDetail.tsx` as a private function. Extract it into its own file so both `TransitDetail` and `VesselDetail` can share it.

- [ ] **Step 1: Write failing tests**

Create `src/components/VesselCard.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { VesselCard } from './VesselCard'
import type { Vessel } from '../types/api'

const baseVessel: Vessel = {
  aid: 'aid_v_001',
  aid_scope: 'global',
  name: 'MS HAMBURG EXPRESS',
  imo: '9301234',
  mmsi: '211281000',
  callsign: null,
  category: 'merchant',
  subtype: 'containers',
  flag: 'DE',
  dimensions: { length_m: 294, beam_m: 32 },
  previous_aids: [],
}

describe('VesselCard', () => {
  it('renders vessel name', () => {
    render(<VesselCard vessel={baseVessel} />)
    expect(screen.getByText('MS HAMBURG EXPRESS')).toBeInTheDocument()
  })

  it('renders IMO', () => {
    render(<VesselCard vessel={baseVessel} />)
    expect(screen.getByText('9301234')).toBeInTheDocument()
  })

  it('omits null fields', () => {
    render(<VesselCard vessel={{ ...baseVessel, callsign: null }} />)
    expect(screen.queryByText('Callsign')).not.toBeInTheDocument()
  })

  it('renders dimensions', () => {
    render(<VesselCard vessel={baseVessel} />)
    expect(screen.getByText(/294.*32/)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests — expect failure**

```bash
cd /Users/yuvalkassif/Azimut/API-Sandbox && npx vitest run src/components/VesselCard.test.tsx
```

Expected: FAIL — `Cannot find module './VesselCard'`

- [ ] **Step 3: Create `src/components/VesselCard.tsx`**

```tsx
import type { Vessel } from '../types/api'

interface VesselCardProps {
  vessel: Vessel
}

export function VesselCard({ vessel }: VesselCardProps) {
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
```

- [ ] **Step 4: Run tests — expect pass**

```bash
cd /Users/yuvalkassif/Azimut/API-Sandbox && npx vitest run src/components/VesselCard.test.tsx
```

Expected: PASS — 4 tests.

- [ ] **Step 5: Update `src/pages/TransitDetail.tsx` to use VesselCard**

Replace the `VesselCard` private function in `TransitDetail.tsx` and add the import. The file currently has `function VesselCard({ vessel }: { vessel: Vessel }) { ... }` near line 168. Do two things:

First, change the import line at the top from:
```typescript
import type { Sighting, Vessel } from '../types/api'
```
to:
```typescript
import { VesselCard } from '../components/VesselCard'
import type { Sighting } from '../types/api'
```

Second, delete the entire `function VesselCard` block (it's now in the separate component). The `<VesselCard vessel={transit.vessel} />` call in the JSX stays exactly as-is.

- [ ] **Step 6: Verify TypeScript and all existing tests still pass**

```bash
cd /Users/yuvalkassif/Azimut/API-Sandbox && npx tsc --noEmit && npx vitest run
```

Expected: 0 TypeScript errors, all existing tests pass.

- [ ] **Step 7: Commit**

```bash
cd /Users/yuvalkassif/Azimut/API-Sandbox && git add src/components/VesselCard.tsx src/components/VesselCard.test.tsx src/pages/TransitDetail.tsx
git commit -m "feat: extract VesselCard into shared component"
```

---

## Task 3: NavBar component

**Files:**
- Create: `src/components/NavBar.tsx`
- Create: `src/components/NavBar.test.tsx`
- Modify: `src/pages/TransitFeed.tsx`

The NavBar replaces the inline `<header>` in TransitFeed and will also be used in VesselList.

- [ ] **Step 1: Write failing tests**

Create `src/components/NavBar.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { NavBar } from './NavBar'

function wrap(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>)
}

describe('NavBar', () => {
  it('renders Transits and Vessels nav links', () => {
    wrap(<NavBar />)
    expect(screen.getByRole('link', { name: 'Transits' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Vessels' })).toBeInTheDocument()
  })

  it('shows org_id when provided', () => {
    wrap(<NavBar orgId="azimut" />)
    expect(screen.getByText('azimut')).toBeInTheDocument()
  })

  it('shows live indicator when showLiveIndicator is true', () => {
    wrap(<NavBar showLiveIndicator />)
    expect(screen.getByText('Live')).toBeInTheDocument()
  })

  it('does not show live indicator by default', () => {
    wrap(<NavBar />)
    expect(screen.queryByText('Live')).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests — expect failure**

```bash
cd /Users/yuvalkassif/Azimut/API-Sandbox && npx vitest run src/components/NavBar.test.tsx
```

Expected: FAIL — `Cannot find module './NavBar'`

- [ ] **Step 3: Create `src/components/NavBar.tsx`**

```tsx
import { NavLink } from 'react-router-dom'
import { cn } from '../lib/utils'

interface NavBarProps {
  orgId?: string
  showLiveIndicator?: boolean
}

export function NavBar({ orgId, showLiveIndicator }: NavBarProps) {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'text-sm font-medium transition-colors',
      isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
    )

  return (
    <header className="flex items-center gap-6 px-6 py-4 border-b bg-background">
      <span className="text-sm font-semibold tracking-tight text-muted-foreground select-none">
        Azimut
      </span>
      <nav className="flex items-center gap-5">
        <NavLink to="/" end className={linkClass}>
          Transits
        </NavLink>
        <NavLink to="/vessels" className={linkClass}>
          Vessels
        </NavLink>
      </nav>
      <div className="ml-auto flex items-center gap-3">
        {orgId && (
          <span className="text-sm text-muted-foreground">{orgId}</span>
        )}
        {showLiveIndicator && (
          <span className="flex items-center gap-1.5 text-xs text-green-700">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            Live
          </span>
        )}
      </div>
    </header>
  )
}
```

- [ ] **Step 4: Run tests — expect pass**

```bash
cd /Users/yuvalkassif/Azimut/API-Sandbox && npx vitest run src/components/NavBar.test.tsx
```

Expected: PASS — 4 tests.

- [ ] **Step 5: Update `src/pages/TransitFeed.tsx` to use NavBar**

Replace the entire file content with:

```tsx
import { useState } from 'react'
import { useTransits, type TransitFiltersInput } from '../hooks/useTransits'
import { useMe } from '../hooks/useMe'
import { NavBar } from '../components/NavBar'
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
      <NavBar orgId={me?.org_id} showLiveIndicator={hasOpenTransits} />
      <TransitFilters filters={filters} onChange={setFilters} />
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

- [ ] **Step 6: Update the TransitFeed smoke test mock**

The existing test at `src/pages/TransitFeed.test.tsx` mocks `useMe`. The test still needs to mock `useAreas` (used by TransitFilters). Add a mock for NavBar's NavLink rendering by checking the test still passes as-is — it should since we mock the hooks.

```bash
cd /Users/yuvalkassif/Azimut/API-Sandbox && npx vitest run src/pages/TransitFeed.test.tsx
```

Expected: PASS — 1 test (the `screen.getByText(/transits/i)` test still finds "Transits" in the nav).

- [ ] **Step 7: Commit**

```bash
cd /Users/yuvalkassif/Azimut/API-Sandbox && git add src/components/NavBar.tsx src/components/NavBar.test.tsx src/pages/TransitFeed.tsx
git commit -m "feat: add NavBar component and update TransitFeed"
```

---

## Task 4: VesselFilters and VesselTable components

**Files:**
- Create: `src/components/VesselFilters.tsx`
- Create: `src/components/VesselTable.tsx`
- Create: `src/components/VesselTable.test.tsx`

- [ ] **Step 1: Write failing tests for VesselTable**

Create `src/components/VesselTable.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { VesselTable } from './VesselTable'
import type { Vessel } from '../types/api'

const mockVessel: Vessel = {
  aid: 'aid_v_001',
  aid_scope: 'global',
  name: 'MS HAMBURG EXPRESS',
  imo: '9301234',
  mmsi: '211281000',
  callsign: null,
  category: 'Merchant',
  subtype: 'Containers',
  flag: 'DE',
  dimensions: { length_m: 294, beam_m: 32 },
  previous_aids: [],
}

function wrap(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>)
}

describe('VesselTable', () => {
  it('renders vessel name', () => {
    wrap(
      <VesselTable
        vessels={[mockVessel]}
        isLoading={false}
        isFetchingNextPage={false}
        hasNextPage={false}
        onLoadMore={() => {}}
      />,
    )
    expect(screen.getByText('MS HAMBURG EXPRESS')).toBeInTheDocument()
  })

  it('renders IMO', () => {
    wrap(
      <VesselTable
        vessels={[mockVessel]}
        isLoading={false}
        isFetchingNextPage={false}
        hasNextPage={false}
        onLoadMore={() => {}}
      />,
    )
    expect(screen.getByText('9301234')).toBeInTheDocument()
  })

  it('shows skeleton rows when loading', () => {
    wrap(
      <VesselTable
        vessels={[]}
        isLoading={true}
        isFetchingNextPage={false}
        hasNextPage={false}
        onLoadMore={() => {}}
      />,
    )
    expect(screen.getAllByRole('row').length).toBeGreaterThan(1)
  })

  it('shows empty state when no vessels', () => {
    wrap(
      <VesselTable
        vessels={[]}
        isLoading={false}
        isFetchingNextPage={false}
        hasNextPage={false}
        onLoadMore={() => {}}
      />,
    )
    expect(screen.getByText(/no vessels match/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests — expect failure**

```bash
cd /Users/yuvalkassif/Azimut/API-Sandbox && npx vitest run src/components/VesselTable.test.tsx
```

Expected: FAIL — `Cannot find module './VesselTable'`

- [ ] **Step 3: Create `src/components/VesselTable.tsx`**

```tsx
import { useNavigate } from 'react-router-dom'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from './ui/table'
import { Button } from './ui/button'
import { Skeleton } from './ui/skeleton'
import { VesselChip } from './VesselChip'
import type { Vessel } from '../types/api'

interface VesselTableProps {
  vessels: Vessel[]
  isLoading: boolean
  isFetchingNextPage: boolean
  hasNextPage: boolean
  onLoadMore: () => void
}

export function VesselTable({
  vessels,
  isLoading,
  isFetchingNextPage,
  hasNextPage,
  onLoadMore,
}: VesselTableProps) {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col gap-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Vessel</TableHead>
            <TableHead>IMO</TableHead>
            <TableHead>MMSI</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Flag</TableHead>
            <TableHead>Dimensions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            : vessels.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-16 text-center text-muted-foreground"
                  >
                    No vessels match your search.
                  </TableCell>
                </TableRow>
              )
            : vessels.map((v) => (
                <TableRow
                  key={v.aid}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => navigate(`/vessels/${v.aid}`)}
                >
                  <TableCell>
                    <VesselChip vessel={v} />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {v.imo ?? '—'}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {v.mmsi ?? '—'}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground capitalize">
                    {[v.category, v.subtype?.replace(/_/g, ' ')]
                      .filter(Boolean)
                      .join(' · ') || '—'}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {v.flag ?? '—'}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {v.dimensions
                      ? `${v.dimensions.length_m ?? '?'} m × ${v.dimensions.beam_m ?? '?'} m`
                      : '—'}
                  </TableCell>
                </TableRow>
              ))}
        </TableBody>
      </Table>

      {hasNextPage && (
        <div className="flex justify-center pb-4">
          <Button variant="outline" onClick={onLoadMore} disabled={isFetchingNextPage}>
            {isFetchingNextPage ? 'Loading…' : 'Load more'}
          </Button>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Run tests — expect pass**

```bash
cd /Users/yuvalkassif/Azimut/API-Sandbox && npx vitest run src/components/VesselTable.test.tsx
```

Expected: PASS — 4 tests.

- [ ] **Step 5: Create `src/components/VesselFilters.tsx`**

The search input (`q`) is debounced 300ms inside this component. The parent manages `flag` state; `q` local state is maintained here and flushed after debounce.

```tsx
import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import type { VesselFiltersInput } from '../hooks/useVessels'

interface VesselFiltersProps {
  filters: VesselFiltersInput
  onChange: (filters: VesselFiltersInput) => void
}

export function VesselFilters({ filters, onChange }: VesselFiltersProps) {
  // Local state for search so we can debounce without blocking the input
  const [localQ, setLocalQ] = useState(filters.q ?? '')

  // Sync localQ when parent clears filters (e.g. clear button)
  useEffect(() => {
    setLocalQ(filters.q ?? '')
  }, [filters.q])

  // Debounce: fire onChange 300ms after the user stops typing
  useEffect(() => {
    const t = setTimeout(() => {
      onChange({ ...filters, q: localQ || undefined })
    }, 300)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localQ])

  function clear() {
    setLocalQ('')
    onChange({})
  }

  return (
    <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-b bg-muted/30 text-sm">
      <Input
        className="h-8 w-56"
        placeholder="Search by name, IMO, MMSI…"
        value={localQ}
        onChange={(e) => setLocalQ(e.target.value)}
      />

      <Input
        className="h-8 w-24 uppercase"
        placeholder="Flag (DE…)"
        maxLength={2}
        value={filters.flag ?? ''}
        onChange={(e) =>
          onChange({ ...filters, q: localQ || undefined, flag: e.target.value.toUpperCase() || undefined })
        }
      />

      <Button variant="ghost" size="sm" onClick={clear} className="ml-auto">
        Clear filters
      </Button>
    </div>
  )
}
```

- [ ] **Step 6: Commit**

```bash
cd /Users/yuvalkassif/Azimut/API-Sandbox && git add src/components/VesselTable.tsx src/components/VesselTable.test.tsx src/components/VesselFilters.tsx
git commit -m "feat: add VesselTable and VesselFilters components"
```

---

## Task 5: TransitTimeline component

**Files:**
- Create: `src/components/TransitTimeline.tsx`
- Create: `src/components/TransitTimeline.test.tsx`

Each transit in the timeline renders:
1. A row of sighting thumbnail placeholders evenly distributed above the bar
2. A full-width colored bar labeled with the area name (links to `/transits/:id`)
3. A metadata strip below (entered→exited, course, confidence, anomaly badges)

- [ ] **Step 1: Write failing tests**

Create `src/components/TransitTimeline.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { TransitTimeline } from './TransitTimeline'
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
  evidence: { primary_image: null, sightings: { count: 3, ids: [] } },
  created_at: '2026-05-18T08:14:25Z',
  updated_at: '2026-05-18T08:31:09Z',
  links: {},
}

function wrap(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>)
}

describe('TransitTimeline', () => {
  it('renders transit area name', () => {
    wrap(
      <TransitTimeline
        transits={[mockTransit]}
        isLoading={false}
        hasPrev={false}
        hasNext={false}
        onPrev={() => {}}
        onNext={() => {}}
      />,
    )
    expect(screen.getByText('Strait of Gibraltar')).toBeInTheDocument()
  })

  it('shows no history message when transits is empty', () => {
    wrap(
      <TransitTimeline
        transits={[]}
        isLoading={false}
        hasPrev={false}
        hasNext={false}
        onPrev={() => {}}
        onNext={() => {}}
      />,
    )
    expect(screen.getByText(/no transit history/i)).toBeInTheDocument()
  })

  it('shows sighting count indicators', () => {
    wrap(
      <TransitTimeline
        transits={[mockTransit]}
        isLoading={false}
        hasPrev={false}
        hasNext={false}
        onPrev={() => {}}
        onNext={() => {}}
      />,
    )
    // 3 sightings = 3 placeholder boxes rendered (count ≤ 5)
    expect(screen.getAllByTitle('Sighting').length).toBe(3)
  })
})
```

- [ ] **Step 2: Run tests — expect failure**

```bash
cd /Users/yuvalkassif/Azimut/API-Sandbox && npx vitest run src/components/TransitTimeline.test.tsx
```

Expected: FAIL — `Cannot find module './TransitTimeline'`

- [ ] **Step 3: Create `src/components/TransitTimeline.tsx`**

```tsx
import { Link } from 'react-router-dom'
import { Skeleton } from './ui/skeleton'
import { Button } from './ui/button'
import { AnomalyBadge } from './AnomalyBadge'
import { cn } from '../lib/utils'
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
        <div className="flex items-end justify-around px-1">
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

function formatDatetime(iso: string): string {
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
cd /Users/yuvalkassif/Azimut/API-Sandbox && npx vitest run src/components/TransitTimeline.test.tsx
```

Expected: PASS — 3 tests.

- [ ] **Step 5: Commit**

```bash
cd /Users/yuvalkassif/Azimut/API-Sandbox && git add src/components/TransitTimeline.tsx src/components/TransitTimeline.test.tsx
git commit -m "feat: add TransitTimeline gantt component"
```

---

## Task 6: VesselList page

**Files:**
- Create: `src/pages/VesselList.tsx`
- Create: `src/pages/VesselList.test.tsx`

- [ ] **Step 1: Write failing smoke test**

Create `src/pages/VesselList.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { VesselList } from './VesselList'

vi.mock('../hooks/useVessels', () => ({
  useVessels: () => ({
    data: undefined,
    isLoading: true,
    isFetchingNextPage: false,
    hasNextPage: false,
    fetchNextPage: vi.fn(),
  }),
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

describe('VesselList', () => {
  it('renders without crashing and shows search input', () => {
    wrap(<VesselList />)
    expect(
      screen.getByPlaceholderText(/search by name/i),
    ).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test — expect failure**

```bash
cd /Users/yuvalkassif/Azimut/API-Sandbox && npx vitest run src/pages/VesselList.test.tsx
```

Expected: FAIL — `Cannot find module '../pages/VesselList'`

- [ ] **Step 3: Create `src/pages/VesselList.tsx`**

```tsx
import { useState } from 'react'
import { useVessels, type VesselFiltersInput } from '../hooks/useVessels'
import { useMe } from '../hooks/useMe'
import { NavBar } from '../components/NavBar'
import { VesselFilters } from '../components/VesselFilters'
import { VesselTable } from '../components/VesselTable'

export function VesselList() {
  const [filters, setFilters] = useState<VesselFiltersInput>({})
  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useVessels(filters)
  const { data: me } = useMe()

  const vessels = data?.pages.flatMap((p) => p.data) ?? []

  return (
    <div className="flex flex-col min-h-screen">
      <NavBar orgId={me?.org_id} />
      <VesselFilters filters={filters} onChange={setFilters} />
      <main className="flex-1 overflow-auto">
        <VesselTable
          vessels={vessels}
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
cd /Users/yuvalkassif/Azimut/API-Sandbox && npx vitest run src/pages/VesselList.test.tsx
```

Expected: PASS — 1 test.

- [ ] **Step 5: Commit**

```bash
cd /Users/yuvalkassif/Azimut/API-Sandbox && git add src/pages/VesselList.tsx src/pages/VesselList.test.tsx
git commit -m "feat: add VesselList page"
```

---

## Task 7: VesselDetail page

**Files:**
- Create: `src/pages/VesselDetail.tsx`
- Create: `src/pages/VesselDetail.test.tsx`

The page manages cursor-based Prev/Next pagination by maintaining a history stack of cursors. The `useVesselTransits` hook is keyed on `[aid, cursor]` so TanStack Query caches each page independently.

- [ ] **Step 1: Write failing smoke test**

Create `src/pages/VesselDetail.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { VesselDetail } from './VesselDetail'

vi.mock('../hooks/useVessel', () => ({
  useVessel: () => ({ data: undefined, isLoading: true, error: null }),
}))

vi.mock('../hooks/useVesselTransits', () => ({
  useVesselTransits: () => ({ data: undefined, isLoading: true }),
}))

function wrap() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={['/vessels/aid_v_001']}>
        <Routes>
          <Route path="/vessels/:aid" element={<VesselDetail />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('VesselDetail', () => {
  it('renders without crashing and shows back link', () => {
    wrap()
    expect(screen.getByText(/vessels/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test — expect failure**

```bash
cd /Users/yuvalkassif/Azimut/API-Sandbox && npx vitest run src/pages/VesselDetail.test.tsx
```

Expected: FAIL — `Cannot find module '../pages/VesselDetail'`

- [ ] **Step 3: Create `src/pages/VesselDetail.tsx`**

```tsx
import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useVessel } from '../hooks/useVessel'
import { useVesselTransits } from '../hooks/useVesselTransits'
import { VesselCard } from '../components/VesselCard'
import { TransitTimeline } from '../components/TransitTimeline'
import { Skeleton } from '../components/ui/skeleton'

export function VesselDetail() {
  const { aid } = useParams<{ aid: string }>()
  const { data: vesselEnvelope, isLoading: vesselLoading, error } = useVessel(aid!)

  // Cursor stack for Prev/Next pagination.
  // cursorHistory[0] = undefined (first page), cursorHistory[n] = cursor for page n+1.
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

  function goNext() {
    if (!hasMoreNext || !nextCursor) return
    // Only add cursor to history if we haven't gone here before
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
        <Link to="/vessels" className="text-sm underline">
          ← Back to vessels
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="flex items-center gap-4 px-6 py-4 border-b bg-background">
        <Link to="/vessels" className="text-sm text-muted-foreground hover:text-foreground">
          ← Vessels
        </Link>
        <h1 className="text-lg font-semibold tracking-tight">
          {vesselLoading ? (
            <Skeleton className="h-5 w-48" />
          ) : (
            vessel?.name ?? aid
          )}
        </h1>
      </header>

      <main className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 flex-1">
        {/* Left column — vessel identity card */}
        <div className="flex flex-col gap-6">
          <section className="rounded-lg border p-4 flex flex-col gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Vessel
            </h2>
            {vesselLoading ? (
              <div className="flex flex-col gap-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-4 w-3/4" />
                ))}
              </div>
            ) : vessel ? (
              <VesselCard vessel={vessel} />
            ) : null}
          </section>
        </div>

        {/* Right column — transit timeline */}
        <div className="flex flex-col gap-4">
          <TransitTimeline
            transits={transits}
            isLoading={transitsLoading}
            hasPrev={pageIndex > 0}
            hasNext={hasMoreNext}
            onPrev={goPrev}
            onNext={goNext}
          />
        </div>
      </main>
    </div>
  )
}
```

- [ ] **Step 4: Run test — expect pass**

```bash
cd /Users/yuvalkassif/Azimut/API-Sandbox && npx vitest run src/pages/VesselDetail.test.tsx
```

Expected: PASS — 1 test.

- [ ] **Step 5: Commit**

```bash
cd /Users/yuvalkassif/Azimut/API-Sandbox && git add src/pages/VesselDetail.tsx src/pages/VesselDetail.test.tsx
git commit -m "feat: add VesselDetail page with transit timeline"
```

---

## Task 8: Wire up routes and cross-links

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/TransitTable.tsx`
- Modify: `src/pages/TransitDetail.tsx`

This task connects everything: adds vessel routes to the router, makes vessel names in the transit table clickable links, and makes the vessel name in the transit detail header a link.

- [ ] **Step 1: Update `src/App.tsx`**

Replace the entire file:

```tsx
import { Routes, Route } from 'react-router-dom'
import { TransitFeed } from './pages/TransitFeed'
import { TransitDetail } from './pages/TransitDetail'
import { VesselList } from './pages/VesselList'
import { VesselDetail } from './pages/VesselDetail'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<TransitFeed />} />
      <Route path="/transits/:id" element={<TransitDetail />} />
      <Route path="/vessels" element={<VesselList />} />
      <Route path="/vessels/:aid" element={<VesselDetail />} />
    </Routes>
  )
}
```

- [ ] **Step 2: Make vessel names clickable in TransitTable**

In `src/components/TransitTable.tsx`, the VesselChip cell currently is:

```tsx
<TableCell>
  <VesselChip vessel={t.vessel} />
</TableCell>
```

Replace it with a link that stops the row-click event from also firing:

```tsx
<TableCell
  className="p-0"
  onClick={(e) => e.stopPropagation()}
>
  <Link
    to={`/vessels/${t.vessel.aid}`}
    className="flex px-4 py-3 hover:underline"
  >
    <VesselChip vessel={t.vessel} />
  </Link>
</TableCell>
```

Also add the `Link` import at the top of `TransitTable.tsx`:

```typescript
import { useNavigate, Link } from 'react-router-dom'
```

- [ ] **Step 3: Make vessel name a link in TransitDetail header**

In `src/pages/TransitDetail.tsx`, the h1 currently shows the vessel name as plain text:

```tsx
<h1 className="text-lg font-semibold tracking-tight">
  {transitLoading ? <Skeleton className="h-5 w-48" /> : (transit?.vessel.name ?? id)}
</h1>
```

Replace with:

```tsx
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
```

- [ ] **Step 4: Run all tests**

```bash
cd /Users/yuvalkassif/Azimut/API-Sandbox && npx vitest run
```

Expected: all tests pass.

- [ ] **Step 5: Verify TypeScript compiles**

```bash
cd /Users/yuvalkassif/Azimut/API-Sandbox && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 6: Final commit**

```bash
cd /Users/yuvalkassif/Azimut/API-Sandbox && git add src/App.tsx src/components/TransitTable.tsx src/pages/TransitDetail.tsx
git commit -m "feat: wire up vessel routes and bidirectional cross-links — Phase 2 complete"
```
