import { Skeleton } from '../Skeleton'

export function CalendarSkeleton() {
  return (
    <div data-testid="calendar-skeleton">
      {/* Month navigation row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <Skeleton className="h-8 w-8" />
        <Skeleton className="h-6 w-36" />
        <Skeleton className="h-8 w-8" />
        <Skeleton className="h-8 w-16 ml-2" />
      </div>

      {/* 7-column day-label header */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', marginBottom: '4px' }}>
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-5 mx-1" />
        ))}
      </div>

      {/* 5 rows × 7 columns of skeleton cells */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
        {Array.from({ length: 35 }).map((_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
    </div>
  )
}
