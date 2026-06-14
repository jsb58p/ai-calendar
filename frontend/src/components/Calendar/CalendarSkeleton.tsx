import { Skeleton } from '../Skeleton'

export function CalendarSkeleton() {
  return (
    <div data-testid="calendar-skeleton" className="bg-bg-base flex-1 p-6">
      {/* Nav row */}
      <div className="flex items-center gap-3 mb-6">
        <Skeleton className="w-24 h-6" />
        <Skeleton className="w-32 h-6" />
        <Skeleton className="w-24 h-6" />
      </div>

      {/* Day header row */}
      <div className="grid grid-cols-7 gap-px mb-1">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-6 rounded-sm opacity-30" />
        ))}
      </div>

      {/* Calendar grid: 5 rows × 7 cols */}
      <div className="grid grid-cols-7 gap-px bg-border-default rounded-lg overflow-hidden">
        {Array.from({ length: 35 }).map((_, i) => (
          <div key={i} className="bg-bg-surface h-28 p-2 flex flex-col gap-1">
            <Skeleton className="w-3/4 h-3" />
            {i % 3 !== 0 && <Skeleton className="w-1/2 h-3" />}
          </div>
        ))}
      </div>
    </div>
  )
}
