export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      data-testid="skeleton"
      className={`bg-gray-200 animate-pulse rounded${className ? ` ${className}` : ''}`}
    />
  )
}
