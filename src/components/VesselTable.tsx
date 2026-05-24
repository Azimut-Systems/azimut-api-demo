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
