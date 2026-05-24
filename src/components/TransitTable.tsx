import { useNavigate } from 'react-router-dom'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from './ui/table'
import { Button } from './ui/button'
import { Skeleton } from './ui/skeleton'
import { AnomalyBadge } from './AnomalyBadge'
import { VesselChip } from './VesselChip'
import { cn } from '../lib/utils'
import { formatDatetime } from '../lib/formatDatetime'
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
            <TableHead className="w-16" />
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
                  {Array.from({ length: 9 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            : transits.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="py-16 text-center text-muted-foreground">
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
                  <TableCell className="p-2">
                    <TransitThumbnail href={t.evidence.primary_image?.href ?? null} />
                  </TableCell>
                  <TableCell>
                    <VesselChip vessel={t.vessel} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">{t.area.name}</TableCell>
                  <TableCell className="whitespace-nowrap text-sm">
                    {formatDatetime(t.entered_at)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                    {t.exited_at ? formatDatetime(t.exited_at) : '—'}
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

function TransitThumbnail({ href }: { href: string | null }) {
  if (!href) {
    return (
      <div className="h-10 w-14 rounded bg-muted flex items-center justify-center text-muted-foreground/40">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
    )
  }
  return (
    <img
      src={href}
      alt=""
      className="h-10 w-14 rounded object-cover bg-muted"
      loading="lazy"
    />
  )
}
