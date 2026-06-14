export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      data-testid="skeleton"
      className={`bg-bg-muted animate-pulse-slow rounded-md${className ? ` ${className}` : ''}`}
    />
  )
}
